"use server";

import { revalidatePath } from "next/cache";
import { isUuid, thumbPathFor } from "./ids";
import { createClient } from "./supabase/server";
import { MAX_CAR_DOCUMENTS, MAX_DOCUMENT_MB, MAX_PART_PHOTOS, type Condition } from "./types";

// Mutations run as the signed-in user, so row level security decides what is
// allowed. Inputs are re-checked here because anyone can call an action
// directly, not only through our forms.

export type VehicleInput = {
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  registration: string | null;
  vin: string | null;
  notes: string | null;
};

export type PartInput = {
  name: string;
  vehicleId: string | null;
  condition: Condition;
  location: string | null;
  quantity: number;
  brand: string | null;
  serialNumber: string | null;
  description: string | null;
};

export type DocumentInput = {
  path: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

type Outcome = { error?: string };
type Created = { id: string } | { error: string };
type Client = Awaited<ReturnType<typeof createClient>>;

const CONDITIONS: Condition[] = ["good", "fair", "spares_only"];
const PART_PHOTOS = "part-images";
const CAR_FILES = "vehicle-files";
const DOCUMENT_EXTENSIONS: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg" };
const SAVE_FAILED = "Couldn't save. Check your connection and try again.";

class InvalidInput extends Error {}

async function guard<T>(work: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof InvalidInput) return { error: error.message };
    console.error(error);
    return { error: SAVE_FAILED };
  }
}

function failed(error: { code?: string; message: string }) {
  console.error(error);
  if (error.code === "42501") return { error: "You don't have permission to do that." };
  if (error.code === "23503") return { error: "That car project no longer exists. Refresh and try again." };
  // Messages raised by our own database rules, such as attachment limits.
  if (error.code === "P0001") return { error: error.message };
  return { error: SAVE_FAILED };
}

function optionalText(value: unknown, label: string, max: number) {
  if (value != null && typeof value !== "string") throw new InvalidInput(`${label} is invalid.`);
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed.length > max) throw new InvalidInput(`${label} must be ${max} characters or fewer.`);
  return trimmed || null;
}

function requiredText(value: unknown, label: string, max: number) {
  const trimmed = optionalText(value, label, max);
  if (!trimmed) throw new InvalidInput(`${label} is required.`);
  return trimmed;
}

function wholeNumber(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new InvalidInput(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return value;
}

function uuid(value: unknown, label: string) {
  if (!isUuid(value)) throw new InvalidInput(`${label} is invalid.`);
  return value;
}

function partColumns(input: PartInput) {
  if (!CONDITIONS.includes(input.condition)) throw new InvalidInput("Condition is invalid.");
  return {
    name: requiredText(input.name, "Part name", 120),
    vehicle_id: input.vehicleId == null || input.vehicleId === "" ? null : uuid(input.vehicleId, "Car project"),
    condition: input.condition,
    location: optionalText(input.location, "Location", 60),
    quantity: wholeNumber(input.quantity, "Quantity", 1, 9999),
    brand: optionalText(input.brand, "Brand", 60),
    serial_number: optionalText(input.serialNumber, "Part number", 80),
    description: optionalText(input.description, "Notes", 2000),
  };
}

// Storage clean-up is best effort: a leftover file is harmless, a failed save is not.
async function removeFiles(supabase: Client, bucket: string, paths: string[]) {
  const all = paths.flatMap((path) => (path.endsWith(".jpg") ? [path, thumbPathFor(path)] : [path]));
  if (!all.length) return;
  const { error } = await supabase.storage.from(bucket).remove(all);
  if (error) console.error(error);
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createVehicle(input: VehicleInput): Promise<Created> {
  return guard(async () => {
    const row = {
      make: requiredText(input.make, "Make", 60),
      model: requiredText(input.model, "Model", 60),
      year: input.year == null ? null : wholeNumber(input.year, "Year", 1900, new Date().getFullYear() + 1),
      color: optionalText(input.color, "Colour", 40),
      registration: optionalText(input.registration, "Registration", 20),
      vin: optionalText(input.vin, "VIN", 32),
      notes: optionalText(input.notes, "Notes", 2000),
    };
    const supabase = await createClient();
    const { data, error } = await supabase.from("vehicles").insert(row).select("id").single();
    if (error) return failed(error);
    refresh();
    return { id: data.id };
  });
}

export async function createPart(input: PartInput): Promise<Created> {
  return guard(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("parts")
      .insert({ ...partColumns(input), status: "in_stock" })
      .select("id")
      .single();
    if (error) return failed(error);
    refresh();
    return { id: data.id };
  });
}

export async function updatePart(id: string, input: PartInput): Promise<Outcome> {
  return guard(async () => {
    const partId = uuid(id, "Part");
    const supabase = await createClient();
    const { data, error } = await supabase.from("parts").update(partColumns(input)).eq("id", partId).select("id");
    if (error) return failed(error);
    if (!data.length) return { error: "This part no longer exists. Refresh and try again." };
    refresh();
    return {};
  });
}

export async function setPartHold(id: string, onHold: boolean): Promise<Outcome> {
  return guard(async () => {
    const partId = uuid(id, "Part");
    if (typeof onHold !== "boolean") throw new InvalidInput("Hold is invalid.");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("parts")
      .update({ status: onHold ? "reserved" : "in_stock" })
      .eq("id", partId)
      .in("status", ["in_stock", "reserved"])
      .select("id");
    if (error) return failed(error);
    if (!data.length) return { error: "This part is no longer available." };
    refresh();
    return {};
  });
}

/** Records photos already uploaded to `part-images/<partId>/`. */
export async function addPartImages(partId: string, paths: string[]): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(partId, "Part");
    const pattern = new RegExp(`^${id}/[a-z0-9-]+\\.jpg$`);
    if (!Array.isArray(paths) || !paths.length || paths.length > MAX_PART_PHOTOS || !paths.every((p) => typeof p === "string" && pattern.test(p))) {
      throw new InvalidInput("Those photos are invalid.");
    }
    const supabase = await createClient();
    const { data: last, error: lastError } = await supabase
      .from("part_images")
      .select("position")
      .eq("part_id", id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) return failed(lastError);

    // The database enforces the photo limit.
    const start = (last?.position ?? -1) + 1;
    const { error } = await supabase
      .from("part_images")
      .insert(paths.map((storage_path, i) => ({ part_id: id, storage_path, position: start + i })));
    if (error) return failed(error);
    refresh();
    return {};
  });
}

export async function removePartImage(imageId: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(imageId, "Photo");
    const supabase = await createClient();
    const { data, error } = await supabase.from("part_images").delete().eq("id", id).select("storage_path");
    if (error) return failed(error);
    await removeFiles(supabase, PART_PHOTOS, data.map((row) => row.storage_path));
    refresh();
    return {};
  });
}

/** Points the car at a photo already uploaded to `vehicle-files/<id>/photo/`, replacing any old one. */
export async function setVehiclePhoto(vehicleId: string, path: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(vehicleId, "Car");
    if (typeof path !== "string" || !new RegExp(`^${id}/photo/[a-z0-9-]+\\.jpg$`).test(path)) {
      throw new InvalidInput("That photo is invalid.");
    }
    const supabase = await createClient();
    const { data: current, error: readError } = await supabase.from("vehicles").select("photo_path").eq("id", id).maybeSingle();
    if (readError) return failed(readError);
    if (!current) return { error: "This project no longer exists. Refresh and try again." };

    const { error } = await supabase.from("vehicles").update({ photo_path: path }).eq("id", id);
    if (error) return failed(error);
    if (current.photo_path && current.photo_path !== path) await removeFiles(supabase, CAR_FILES, [current.photo_path]);
    refresh();
    return {};
  });
}

export async function removeVehiclePhoto(vehicleId: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(vehicleId, "Car");
    const supabase = await createClient();
    const { data: current, error: readError } = await supabase.from("vehicles").select("photo_path").eq("id", id).maybeSingle();
    if (readError) return failed(readError);
    if (!current?.photo_path) return {};

    const { error } = await supabase.from("vehicles").update({ photo_path: null }).eq("id", id);
    if (error) return failed(error);
    await removeFiles(supabase, CAR_FILES, [current.photo_path]);
    refresh();
    return {};
  });
}

/** Records documents already uploaded to `vehicle-files/<id>/documents/`. */
export async function addVehicleDocuments(vehicleId: string, documents: DocumentInput[]): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(vehicleId, "Car");
    if (!Array.isArray(documents) || !documents.length || documents.length > MAX_CAR_DOCUMENTS) {
      throw new InvalidInput("Those documents are invalid.");
    }
    const rows = documents.map((doc) => {
      const extension = DOCUMENT_EXTENSIONS[String(doc?.contentType)];
      if (!extension || typeof doc.path !== "string" || !new RegExp(`^${id}/documents/[a-z0-9-]+\\.${extension}$`).test(doc.path)) {
        throw new InvalidInput("Those documents are invalid.");
      }
      if (typeof doc.sizeBytes !== "number" || !Number.isInteger(doc.sizeBytes) || doc.sizeBytes < 1 || doc.sizeBytes > MAX_DOCUMENT_MB * 1024 * 1024) {
        throw new InvalidInput(`Files must be ${MAX_DOCUMENT_MB} MB or smaller.`);
      }
      return {
        vehicle_id: id,
        storage_path: doc.path,
        file_name: requiredText(typeof doc.fileName === "string" ? doc.fileName.replace(/[\x00-\x1f\x7f/\\]/g, "") : doc.fileName, "File name", 120),
        content_type: doc.contentType,
        size_bytes: doc.sizeBytes,
      };
    });

    // The database enforces the document limit.
    const supabase = await createClient();
    const { error } = await supabase.from("vehicle_documents").insert(rows);
    if (error) return failed(error);
    refresh();
    return {};
  });
}

export async function removeVehicleDocument(documentId: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(documentId, "Document");
    const supabase = await createClient();
    const { data, error } = await supabase.from("vehicle_documents").delete().eq("id", id).select("storage_path");
    if (error) return failed(error);
    await removeFiles(supabase, CAR_FILES, data.map((row) => row.storage_path));
    refresh();
    return {};
  });
}

export async function addTask(vehicleId: string, name: string): Promise<Outcome> {
  return guard(async () => {
    const vehicle_id = uuid(vehicleId, "Project");
    const taskName = requiredText(name, "Task", 200);
    const supabase = await createClient();
    const { data: last, error: lastError } = await supabase
      .from("project_tasks")
      .select("position")
      .eq("vehicle_id", vehicle_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) return failed(lastError);

    const { error } = await supabase
      .from("project_tasks")
      .insert({ vehicle_id, name: taskName, position: (last?.position ?? -1) + 1 });
    if (error) return failed(error);
    refresh();
    return {};
  });
}

export async function setTaskDone(id: string, done: boolean): Promise<Outcome> {
  return guard(async () => {
    const taskId = uuid(id, "Task");
    if (typeof done !== "boolean") throw new InvalidInput("Task is invalid.");
    const supabase = await createClient();
    const { data, error } = await supabase.from("project_tasks").update({ done }).eq("id", taskId).select("id");
    if (error) return failed(error);
    if (!data.length) return { error: "This task no longer exists. Refresh and try again." };
    refresh();
    return {};
  });
}

export async function removeTask(id: string): Promise<Outcome> {
  return guard(async () => {
    const taskId = uuid(id, "Task");
    const supabase = await createClient();
    const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
    if (error) return failed(error);
    refresh();
    return {};
  });
}
