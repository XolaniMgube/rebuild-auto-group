import { cache } from "react";
import type { Tables } from "./database.types";
import { isUuid, thumbPathFor } from "./ids";
import { createClient } from "./supabase/server";
import {
  ACTIVE_STATUSES,
  BIN_DAYS,
  type BinnedPart,
  type BinnedProject,
  type ExpenseCategory,
  type Part,
  type ProjectMoney,
  type ProjectSummary,
  type ProjectTask,
  type Role,
  type SignedPhoto,
  type SoldItem,
  type Vehicle,
  type VehicleDocument,
  type WorkspaceCounts,
} from "./types";

// Server-side reads. Every query runs as the signed-in user, so row level
// security decides what comes back.

const VEHICLE_COLUMNS = "id, make, model, year, vin, registration, color, notes, purchase_price, created_at";
const VEHICLE_WITH_PHOTO = "id, make, model, year, vin, registration, color, notes, purchase_price, created_at, photo_path";
const PART_COLUMNS =
  "id, name, brand, serial_number, condition, description, quantity, selling_price, location, status, held_at, holder:profiles!parts_held_by_fkey(name, email), vehicle_id, created_at, part_images(id, storage_path, position)";
const SALE_COLUMNS =
  "id, quantity, price_at_sale, list_price_at_sale, sale:sales!inner(id, sale_date, customer_name, seller:profiles!sales_sold_by_fkey(name, email)), part:parts!inner(id, name, vehicle_id)";
const DOCUMENT_COLUMNS = "id, storage_path, file_name, content_type, size_bytes, created_at";

const PAGE_SIZE = 1000; // the Data API's default row cap
const FILE_URL_SECONDS = 60 * 60;

type Client = Awaited<ReturnType<typeof createClient>>;
type Bucket = "part-images" | "vehicle-files";
type VehicleRecord = Pick<Tables<"vehicles">, "id" | "make" | "model" | "year" | "vin" | "registration" | "color" | "notes" | "purchase_price" | "created_at">;
type Person = { name: string | null; email: string } | null;
type PartRecord = Pick<
  Tables<"parts">,
  "id" | "name" | "brand" | "serial_number" | "condition" | "description" | "quantity" | "selling_price" | "location" | "status" | "held_at" | "vehicle_id" | "created_at"
> & { holder: Person; part_images: Pick<Tables<"part_images">, "id" | "storage_path" | "position">[] };
type SaleRecord = {
  id: string;
  quantity: number;
  price_at_sale: number;
  list_price_at_sale: number | null;
  sale: { id: string; sale_date: string; customer_name: string | null; seller: Person };
  part: { id: string; name: string };
};

/** The name to show for a team member: their profile name, else the start of their email, capitalised ("mitch" → "Mitch"). */
function personName(person: Person) {
  const raw = person?.name?.trim() || person?.email.split("@")[0] || "";
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : null;
}

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
    purchasePrice: row.purchase_price,
    createdAt: row.created_at,
  };
}

function toSoldItem(row: SaleRecord): SoldItem {
  return {
    id: row.id,
    saleId: row.sale.id,
    partId: row.part.id,
    partName: row.part.name,
    quantity: row.quantity,
    price: row.price_at_sale,
    listPrice: row.list_price_at_sale,
    soldAt: row.sale.sale_date,
    soldBy: personName(row.sale.seller),
    customerName: row.sale.customer_name,
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
    price: row.selling_price,
    location: row.location,
    status: row.status,
    heldBy: row.status === "reserved" ? personName(row.holder) : null,
    heldAt: row.status === "reserved" ? row.held_at : null,
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

/** The signed-in person's role, looked up once per request. Decides whether money is shown. */
export const getViewerRole = cache(async (): Promise<Role | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.claims.sub).maybeSingle();
  return profile?.role ?? null;
});

/** Expenses and sales for one car. Row level security returns nothing to staff, so only call this for owners. */
export async function getProjectMoney(vehicleId: string): Promise<ProjectMoney> {
  if (!isUuid(vehicleId)) return { expenses: [], sales: [] };
  const supabase = await createClient();
  const [expenses, sales] = await Promise.all([
    supabase
      .from("vehicle_expenses")
      .select("id, category, description, amount, spent_on")
      .eq("vehicle_id", vehicleId)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("sale_items").select(SALE_COLUMNS).eq("part.vehicle_id", vehicleId),
  ]);
  if (expenses.error) throw new Error(expenses.error.message);
  if (sales.error) throw new Error(sales.error.message);
  return {
    expenses: expenses.data.map(row => ({
      id: row.id,
      category: row.category as ExpenseCategory,
      description: row.description,
      amount: row.amount,
      spentOn: row.spent_on,
    })),
    sales: (sales.data as SaleRecord[]).map(toSoldItem).sort((a, b) => b.soldAt.localeCompare(a.soldAt)),
  };
}

/** Sales of one part, newest first. Owners only. */
export async function getPartSales(partId: string): Promise<SoldItem[]> {
  if (!isUuid(partId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("sale_items").select(SALE_COLUMNS).eq("part_id", partId);
  if (error) throw new Error(error.message);
  return (data as SaleRecord[]).map(toSoldItem).sort((a, b) => b.soldAt.localeCompare(a.soldAt));
}

/** Names of every part already recorded against a car, sold ones included. */
export async function getVehiclePartNames(vehicleId: string): Promise<string[]> {
  if (!isUuid(vehicleId)) return [];
  const supabase = await createClient();
  const rows = await allRows<{ name: string }>((from, to) =>
    supabase.from("parts").select("name").eq("vehicle_id", vehicleId).is("deleted_at", null).order("id").range(from, to)
  );
  return rows.map(row => row.name);
}

/** Sidebar badges. Non-critical, so any failure returns null instead of breaking the page. */
export async function getWorkspaceCounts(): Promise<WorkspaceCounts | null> {
  try {
    const supabase = await createClient();
    const head = { count: "exact", head: true } as const;
    const [inStock, onHold, projects] = await Promise.all([
      supabase.from("parts").select("id", head).eq("status", "in_stock").is("deleted_at", null),
      supabase.from("parts").select("id", head).eq("status", "reserved").is("deleted_at", null),
      supabase.from("vehicles").select("id", head).is("deleted_at", null),
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
    supabase.from("vehicles").select(VEHICLE_COLUMNS).is("deleted_at", null).order("created_at", { ascending: false }).order("id").range(from, to)
  );
  return rows.map(toVehicle);
}

export async function getVehicle(id: string): Promise<{ vehicle: Vehicle; photo: SignedPhoto | null } | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("vehicles").select(VEHICLE_WITH_PHOTO).eq("id", id).is("deleted_at", null).maybeSingle();
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
    const query = supabase.from("parts").select(PART_COLUMNS).in("status", ACTIVE_STATUSES).is("deleted_at", null);
    return (vehicleId ? query.eq("vehicle_id", vehicleId) : query)
      .order("created_at", { ascending: false })
      .order("name") // parts added together from the strip list share a timestamp
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
  const { data, error } = await supabase.from("parts").select(PART_COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle();
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

/** Every project with its photo, active part count and checklist progress, plus cost and sales for owners. */
export async function getProjectSummaries(includeMoney = false): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const moneyRows = includeMoney
    ? Promise.all([
      allRows<{ vehicle_id: string; amount: number }>((from, to) =>
        supabase.from("vehicle_expenses").select("vehicle_id, amount").order("id").range(from, to)
      ),
      allRows<{ quantity: number; price_at_sale: number; part: { vehicle_id: string | null } }>((from, to) =>
        supabase.from("sale_items").select("quantity, price_at_sale, part:parts!inner(vehicle_id)").order("id").range(from, to)
      ),
    ])
    : null;
  const [vehicles, parts, tasks] = await Promise.all([
    allRows<VehicleRecord & { photo_path: string | null }>((from, to) =>
      supabase.from("vehicles").select(VEHICLE_WITH_PHOTO).is("deleted_at", null).order("created_at", { ascending: false }).order("id").range(from, to)
    ),
    allRows<{ vehicle_id: string | null }>((from, to) =>
      supabase.from("parts").select("vehicle_id").in("status", ACTIVE_STATUSES).is("deleted_at", null).not("vehicle_id", "is", null).order("id").range(from, to)
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

  const spent = new Map<string, number>();
  const sold = new Map<string, number>();
  const money = moneyRows ? await moneyRows : null;
  if (money) {
    for (const expense of money[0]) spent.set(expense.vehicle_id, (spent.get(expense.vehicle_id) ?? 0) + expense.amount);
    for (const item of money[1]) {
      if (item.part.vehicle_id) sold.set(item.part.vehicle_id, (sold.get(item.part.vehicle_id) ?? 0) + item.price_at_sale * item.quantity);
    }
  }

  return vehicles.map((row) => ({
    vehicle: toVehicle(row),
    photo: row.photo_path ? photos.get(row.photo_path)?.thumbUrl ?? null : null,
    money: money ? { cost: row.purchase_price + (spent.get(row.id) ?? 0), revenue: sold.get(row.id) ?? 0 } : null,
    partCount: partCounts.get(row.id) ?? 0,
    tasksDone: taskCounts.get(row.id)?.done ?? 0,
    tasksTotal: taskCounts.get(row.id)?.total ?? 0,
  }));
}

type Deleter = { name: string | null; email: string } | null;
type BinnedCarRecord = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  photo_path: string | null;
  deleted_at: string | null;
  deleter: Deleter;
  documents: { count: number }[];
};
type BinnedPartRecord = {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
  vehicle_id: string | null;
  deleted_at: string | null;
  deleter: Deleter;
  vehicle: { make: string; model: string; year: number | null; deleted_at: string | null } | null;
  part_images: { storage_path: string; position: number }[];
};

/**
 * Everything in Recently deleted that hasn't expired. Parts binned along with a
 * project are counted under it rather than listed. Owners only: staff get nothing back.
 */
export async function getRecentlyDeleted(): Promise<{ projects: BinnedProject[]; parts: BinnedPart[] }> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - BIN_DAYS * 86_400_000).toISOString();
  const [cars, parts] = await Promise.all([
    allRows<BinnedCarRecord>((from, to) =>
      supabase
        .from("vehicles")
        .select("id, make, model, year, photo_path, deleted_at, deleter:profiles!vehicles_deleted_by_fkey(name, email), documents:vehicle_documents(count)")
        .gt("deleted_at", cutoff)
        .order("deleted_at", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    allRows<BinnedPartRecord>((from, to) =>
      supabase
        .from("parts")
        .select("id, name, selling_price, quantity, vehicle_id, deleted_at, deleter:profiles!parts_deleted_by_fkey(name, email), vehicle:vehicles(make, model, year, deleted_at), part_images(storage_path, position)")
        .gt("deleted_at", cutoff)
        .order("deleted_at", { ascending: false })
        .order("id")
        .range(from, to)
    ),
  ]);

  // A part went in with its car when it shares the car's timestamp.
  const carStamps = new Map(cars.map((car) => [car.id, car.deleted_at]));
  const withCar = (part: BinnedPartRecord) => part.vehicle_id !== null && carStamps.get(part.vehicle_id) === part.deleted_at;
  const partCounts = new Map<string, number>();
  for (const part of parts) {
    if (withCar(part)) partCounts.set(part.vehicle_id!, (partCounts.get(part.vehicle_id!) ?? 0) + 1);
  }
  const loose = parts.filter((part) => !withCar(part));
  const cover = (part: BinnedPartRecord) => [...part.part_images].sort((a, b) => a.position - b.position)[0]?.storage_path;

  const [carPhotos, partPhotos] = await Promise.all([
    signPhotos(supabase, "vehicle-files", cars.flatMap((car) => (car.photo_path ? [car.photo_path] : [])), false),
    signPhotos(supabase, "part-images", loose.flatMap((part) => cover(part) ?? []), false),
  ]);
  const deleterName = (deleter: Deleter) => personName(deleter);

  return {
    projects: cars.map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      photo: car.photo_path ? carPhotos.get(car.photo_path)?.thumbUrl ?? null : null,
      deletedAt: car.deleted_at ?? "",
      deletedBy: deleterName(car.deleter),
      partCount: partCounts.get(car.id) ?? 0,
      documentCount: car.documents[0]?.count ?? 0,
    })),
    parts: loose.map((part) => {
      const path = cover(part);
      return {
        id: part.id,
        name: part.name,
        price: part.selling_price,
        quantity: part.quantity,
        photo: path ? partPhotos.get(path)?.thumbUrl ?? null : null,
        photoCount: part.part_images.length,
        deletedAt: part.deleted_at ?? "",
        deletedBy: deleterName(part.deleter),
        car: part.vehicle ? { make: part.vehicle.make, model: part.vehicle.model, year: part.vehicle.year } : null,
        carInBin: Boolean(part.vehicle?.deleted_at),
      };
    }),
  };
}
