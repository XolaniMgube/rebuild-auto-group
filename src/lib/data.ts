import type { Tables } from "./database.types";
import { isUuid, thumbPathFor } from "./ids";
import { createClient } from "./supabase/server";
import {
  ACTIVE_STATUSES,
  type Part,
  type ProjectSummary,
  type ProjectTask,
  type SignedPhoto,
  type Vehicle,
  type VehicleDocument,
  type WorkspaceCounts,
} from "./types";

// Server-side reads. Every query runs as the signed-in user, so row level
// security decides what comes back.

const VEHICLE_COLUMNS = "id, make, model, year, vin, registration, color, notes, created_at";
const VEHICLE_WITH_PHOTO = "id, make, model, year, vin, registration, color, notes, created_at, photo_path";
const PART_COLUMNS =
  "id, name, brand, serial_number, condition, description, quantity, location, status, vehicle_id, created_at, part_images(id, storage_path, position)";
const DOCUMENT_COLUMNS = "id, storage_path, file_name, content_type, size_bytes, created_at";

const PAGE_SIZE = 1000; // the Data API's default row cap
const FILE_URL_SECONDS = 60 * 60;

type Client = Awaited<ReturnType<typeof createClient>>;
type Bucket = "part-images" | "vehicle-files";
type VehicleRecord = Pick<Tables<"vehicles">, "id" | "make" | "model" | "year" | "vin" | "registration" | "color" | "notes" | "created_at">;
type PartRecord = Pick<
  Tables<"parts">,
  "id" | "name" | "brand" | "serial_number" | "condition" | "description" | "quantity" | "location" | "status" | "vehicle_id" | "created_at"
> & { part_images: Pick<Tables<"part_images">, "id" | "storage_path" | "position">[] };

// Reads every page so long lists are never silently cut off at the row cap.
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

function toVehicle(row: VehicleRecord): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    vin: row.vin,
    registration: row.registration,
    color: row.color,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function sortedImages(row: PartRecord) {
  return [...row.part_images].sort((a, b) => a.position - b.position);
}

function toPart(row: PartRecord, photos: Map<string, SignedPhoto>, limit?: number): Part {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    serialNumber: row.serial_number,
    condition: row.condition,
    description: row.description,
    quantity: row.quantity,
    location: row.location,
    status: row.status,
    images: sortedImages(row).slice(0, limit).flatMap((image) => {
      const photo = photos.get(image.storage_path);
      return photo ? [{ id: image.id, ...photo }] : [];
    }),
    vehicleId: row.vehicle_id,
    createdAt: row.created_at,
  };
}

// The buckets are private, so files are shown through short-lived signed URLs.
// Files that no longer exist are left out.
async function signFiles(supabase: Client, bucket: Bucket, paths: string[]) {
  const unique = [...new Set(paths)];
  if (!unique.length) return new Map<string, string>();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, FILE_URL_SECONDS);
  if (error) throw new Error(error.message);
  return new Map(data.flatMap((item) => (item.path && item.signedUrl && !item.error ? [[item.path, item.signedUrl] as const] : [])));
}

/**
 * Signs photos and their previews. Lists only need previews (`full: false`);
 * photos without a preview fall back to the full image.
 */
async function signPhotos(supabase: Client, bucket: Bucket, paths: string[], full: boolean) {
  const photos = new Map<string, SignedPhoto>();
  if (!paths.length) return photos;
  const [thumbs, fullUrls] = await Promise.all([
    signFiles(supabase, bucket, paths.map(thumbPathFor)),
    full ? signFiles(supabase, bucket, paths) : null,
  ]);
  const urls = fullUrls ?? (await signFiles(supabase, bucket, paths.filter((path) => !thumbs.has(thumbPathFor(path)))));
  for (const path of paths) {
    const thumbUrl = thumbs.get(thumbPathFor(path)) ?? urls.get(path);
    const url = urls.get(path) ?? thumbUrl;
    if (url && thumbUrl) photos.set(path, { url, thumbUrl });
  }
  return photos;
}

/** Sidebar badges. Non-critical, so any failure returns null instead of breaking the page. */
export async function getWorkspaceCounts(): Promise<WorkspaceCounts | null> {
  try {
    const supabase = await createClient();
    const head = { count: "exact", head: true } as const;
    const [inStock, onHold, projects] = await Promise.all([
      supabase.from("parts").select("id", head).eq("status", "in_stock"),
      supabase.from("parts").select("id", head).eq("status", "reserved"),
      supabase.from("vehicles").select("id", head),
    ]);
    if (inStock.error || onHold.error || projects.error) return null;
    return { inStock: inStock.count ?? 0, onHold: onHold.count ?? 0, projects: projects.count ?? 0 };
  } catch {
    return null;
  }
}

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = await createClient();
  const rows = await allRows<VehicleRecord>((from, to) =>
    supabase.from("vehicles").select(VEHICLE_COLUMNS).order("created_at", { ascending: false }).order("id").range(from, to)
  );
  return rows.map(toVehicle);
}

export async function getVehicle(id: string): Promise<{ vehicle: Vehicle; photo: SignedPhoto | null } | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("vehicles").select(VEHICLE_WITH_PHOTO).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const photos = await signPhotos(supabase, "vehicle-files", data.photo_path ? [data.photo_path] : [], true);
  return { vehicle: toVehicle(data), photo: data.photo_path ? photos.get(data.photo_path) ?? null : null };
}

export async function getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
  if (!isUuid(vehicleId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("vehicle_id", vehicleId)
    .order("created_at");
  if (error) throw new Error(error.message);

  const isImage = (row: { content_type: string }) => row.content_type === "image/jpeg";
  const [files, thumbs] = await Promise.all([
    signFiles(supabase, "vehicle-files", data.map((row) => row.storage_path)),
    signFiles(supabase, "vehicle-files", data.filter(isImage).map((row) => thumbPathFor(row.storage_path))),
  ]);
  return data.map((row) => {
    const url = files.get(row.storage_path) ?? null;
    return {
      id: row.id,
      fileName: row.file_name,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      url,
      thumbUrl: isImage(row) ? thumbs.get(thumbPathFor(row.storage_path)) ?? url : null,
      createdAt: row.created_at,
    };
  });
}

/** In-stock and on-hold parts, newest first, with each part's cover photo. */
export async function getActiveParts(vehicleId?: string): Promise<Part[]> {
  if (vehicleId !== undefined && !isUuid(vehicleId)) return [];
  const supabase = await createClient();
  const rows = await allRows<PartRecord>((from, to) => {
    const query = supabase.from("parts").select(PART_COLUMNS).in("status", ACTIVE_STATUSES);
    return (vehicleId ? query.eq("vehicle_id", vehicleId) : query)
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to);
  });
  const covers = rows.flatMap((row) => sortedImages(row).slice(0, 1).map((image) => image.storage_path));
  const photos = await signPhotos(supabase, "part-images", covers, false);
  return rows.map((row) => toPart(row, photos, 1));
}

/** Any part, including sold ones, with all of its photos. */
export async function getPart(id: string): Promise<Part | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("parts").select(PART_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const photos = await signPhotos(supabase, "part-images", data.part_images.map((image) => image.storage_path), true);
  return toPart(data, photos);
}

export async function getTasks(vehicleId: string): Promise<ProjectTask[]> {
  if (!isUuid(vehicleId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_tasks")
    .select("id, vehicle_id, name, done")
    .eq("vehicle_id", vehicleId)
    .order("position")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data.map((row) => ({ id: row.id, vehicleId: row.vehicle_id, name: row.name, done: row.done }));
}

/** Every project with its photo, active part count and checklist progress. */
export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const [vehicles, parts, tasks] = await Promise.all([
    allRows<VehicleRecord & { photo_path: string | null }>((from, to) =>
      supabase.from("vehicles").select(VEHICLE_WITH_PHOTO).order("created_at", { ascending: false }).order("id").range(from, to)
    ),
    allRows<{ vehicle_id: string | null }>((from, to) =>
      supabase.from("parts").select("vehicle_id").in("status", ACTIVE_STATUSES).not("vehicle_id", "is", null).order("id").range(from, to)
    ),
    allRows<{ vehicle_id: string; done: boolean }>((from, to) =>
      supabase.from("project_tasks").select("vehicle_id, done").order("id").range(from, to)
    ),
  ]);

  const photos = await signPhotos(supabase, "vehicle-files", vehicles.flatMap((row) => (row.photo_path ? [row.photo_path] : [])), false);
  const partCounts = new Map<string, number>();
  for (const part of parts) {
    if (part.vehicle_id) partCounts.set(part.vehicle_id, (partCounts.get(part.vehicle_id) ?? 0) + 1);
  }
  const taskCounts = new Map<string, { done: number; total: number }>();
  for (const task of tasks) {
    const count = taskCounts.get(task.vehicle_id) ?? { done: 0, total: 0 };
    count.total += 1;
    if (task.done) count.done += 1;
    taskCounts.set(task.vehicle_id, count);
  }

  return vehicles.map((row) => ({
    vehicle: toVehicle(row),
    photo: row.photo_path ? photos.get(row.photo_path)?.thumbUrl ?? null : null,
    partCount: partCounts.get(row.id) ?? 0,
    tasksDone: taskCounts.get(row.id)?.done ?? 0,
    tasksTotal: taskCounts.get(row.id)?.total ?? 0,
  }));
}
