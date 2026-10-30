"use server";

import { revalidatePath } from "next/cache";
import { isUuid, thumbPathFor } from "./ids";
import { createClient } from "./supabase/server";
import { BIN_DAYS, MAX_CAR_DOCUMENTS, MAX_DOCUMENT_MB, MAX_PART_PHOTOS, type Condition } from "./types";

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
  purchasePrice: number | null;
};

export type PartInput = {
  name: string;
  vehicleId: string | null;
  condition: Condition;
  location: string | null;
  brand: string | null;
  serialNumber: string | null;
  description: string | null;
  price: number | null;
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

/** A rand amount, rounded to cents. */
function money(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 99_999_999) {
    throw new InvalidInput(`${label} must be an amount in rands.`);
  }
  return Math.round(value * 100) / 100;
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
    selling_price: input.price == null ? 0 : money(input.price, "Price"),
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
      purchase_price: input.purchasePrice == null ? 0 : money(input.purchasePrice, "Purchase price"),
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
      // Every part is a single item, so a sale always takes it out of stock.
      .insert({ ...partColumns(input), quantity: 1, status: "in_stock" })
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

/* --------------------------------------------------------------------------
   Money
   -------------------------------------------------------------------------- */

const EXPENSE_CATEGORIES = ["transport", "labour", "repairs", "other"];

export type ExpenseInput = { category: string; amount: number; description: string | null };
export type SaleInput = { price: number; customerName: string | null; customerPhone: string | null };
export type TemplatePartInput = { name: string; price: number | null };

export async function setPurchasePrice(vehicleId: string, amount: number): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(vehicleId, "Car");
    const purchase_price = money(amount, "Purchase price");
    const supabase = await createClient();
    const { data, error } = await supabase.from("vehicles").update({ purchase_price }).eq("id", id).select("id");
    if (error) return failed(error);
    if (!data.length) return { error: "This project no longer exists. Refresh and try again." };
    refresh();
    return {};
  });
}

export async function addExpense(vehicleId: string, input: ExpenseInput): Promise<Outcome> {
  return guard(async () => {
    const vehicle_id = uuid(vehicleId, "Car");
    if (!EXPENSE_CATEGORIES.includes(input.category)) throw new InvalidInput("Choose what the expense was for.");
    const amount = money(input.amount, "Amount");
    if (amount <= 0) throw new InvalidInput("Amount must be more than R 0.");
    const supabase = await createClient();
    const { error } = await supabase
      .from("vehicle_expenses")
      .insert({ vehicle_id, category: input.category, amount, description: optionalText(input.description, "Note", 120) });
    if (error) return failed(error);
    refresh();
    return {};
  });
}

export async function removeExpense(expenseId: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(expenseId, "Expense");
    const supabase = await createClient();
    const { error } = await supabase.from("vehicle_expenses").delete().eq("id", id);
    if (error) return failed(error);
    refresh();
    return {};
  });
}

/** Records a part as sold at the price the customer actually paid. */
export async function sellPart(partId: string, input: SaleInput): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(partId, "Part");
    const price = money(input.price, "Sold price");
    const supabase = await createClient();
    const { error } = await supabase.rpc("complete_sale", {
      items: [{ part_id: id, price, quantity: 1 }],
      customer_name: optionalText(input.customerName, "Customer", 120) ?? undefined,
      customer_phone: optionalText(input.customerPhone, "Phone", 30) ?? undefined,
    });
    if (error) return failed(error);
    refresh();
    return {};
  });
}

/** Owners reverse a sale recorded by mistake; the stock goes back. */
export async function undoSale(saleId: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(saleId, "Sale");
    const supabase = await createClient();
    const { error } = await supabase.rpc("undo_sale", { target_sale: id });
    if (error) return failed(error);
    refresh();
    return {};
  });
}

/** Adds many parts to a car at once, from the strip list. */
export async function createPartsFromTemplate(vehicleId: string, parts: TemplatePartInput[]): Promise<{ count: number } | { error: string }> {
  return guard(async () => {
    const vehicle_id = uuid(vehicleId, "Car");
    if (!Array.isArray(parts) || !parts.length || parts.length > 300) throw new InvalidInput("Choose between 1 and 300 parts.");
    const rows = parts.map(part => {
      const name = requiredText(part?.name, "Part name", 120);
      return {
        name,
        vehicle_id,
        condition: "good" as const,
        quantity: 1,
        selling_price: part.price == null ? 0 : money(part.price, `Price for ${name}`),
        status: "in_stock" as const,
      };
    });
    const supabase = await createClient();
    const { error } = await supabase.from("parts").insert(rows);
    if (error) return failed(error);
    refresh();
    return { count: rows.length };
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

/* --------------------------------------------------------------------------
   Recently deleted
   -------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;
const PURGE_BATCH = 100;
const BULK_LIMIT = 300; // same cap as the database function

/** Same rule as the database: case and spacing don't matter. */
function sameName(typed: unknown, actual: string) {
  const tidy = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  return typeof typed === "string" && tidy(actual) !== "" && tidy(typed) === tidy(actual);
}

const typedText = (value: unknown) => (typeof value === "string" ? value.slice(0, 200) : "");

/**
 * Moves parts to Recently deleted, one or many. Parts with sales recorded stay
 * put and come back in `kept` so the screen can say which were left behind.
 */
export async function binParts(partIds: string[]): Promise<{ binned: number; kept: string[] } | { error: string }> {
  return guard(async () => {
    if (!Array.isArray(partIds) || !partIds.length) throw new InvalidInput("Choose at least one part.");
    if (partIds.length > BULK_LIMIT) throw new InvalidInput(`Delete up to ${BULK_LIMIT} parts at a time.`);
    const targets = partIds.map((id) => uuid(id, "Part"));
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("bin_parts", { targets });
    if (error) return failed(error);
    refresh();
    const result = (data ?? {}) as { binned?: number; kept?: string[] | null };
    return { binned: result.binned ?? 0, kept: result.kept ?? [] };
  });
}

/** Moves a project to Recently deleted, with its unsold parts or leaving them as unassigned stock. */
export async function binVehicle(vehicleId: string, typedName: string, keepParts: boolean): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(vehicleId, "Project");
    if (typeof keepParts !== "boolean") throw new InvalidInput("Choose what happens to the parts.");
    const supabase = await createClient();
    const { error } = await supabase.rpc("bin_vehicle", { target: id, typed_name: typedText(typedName), keep_parts: keepParts });
    if (error) return failed(error);
    refresh();
    return {};
  });
}

export async function restorePart(partId: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(partId, "Part");
    const supabase = await createClient();
    const { error } = await supabase.rpc("restore_part", { target: id });
    if (error) return failed(error);
    refresh();
    return {};
  });
}

export async function restoreVehicle(vehicleId: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(vehicleId, "Project");
    const supabase = await createClient();
    const { error } = await supabase.rpc("restore_vehicle", { target: id });
    if (error) return failed(error);
    refresh();
    return {};
  });
}

// Rows go first, then their files, and only for rows that were really deleted:
// a part restored a moment ago keeps its photos.
async function purgeParts(supabase: Client, ids: string[]) {
  for (let i = 0; i < ids.length; i += PURGE_BATCH) {
    const batch = ids.slice(i, i + PURGE_BATCH);
    const { data: images, error: readError } = await supabase.from("part_images").select("part_id, storage_path").in("part_id", batch);
    if (readError) throw new Error(readError.message);
    const { data: gone, error } = await supabase.from("parts").delete().in("id", batch).not("deleted_at", "is", null).select("id");
    if (error) throw new Error(error.message);
    const removed = new Set(gone.map((row) => row.id));
    await removeFiles(supabase, PART_PHOTOS, images.filter((image) => removed.has(image.part_id)).map((image) => image.storage_path));
  }
}

async function purgeVehicle(supabase: Client, vehicleId: string) {
  const { data: car, error: carError } = await supabase
    .from("vehicles")
    .select("deleted_at, photo_path")
    .eq("id", vehicleId)
    .not("deleted_at", "is", null)
    .maybeSingle();
  if (carError) throw new Error(carError.message);
  if (!car?.deleted_at) return false;

  // Parts binned along with the car go with it; parts binned on their own keep their own 30 days.
  const { data: parts, error: partsError } = await supabase.from("parts").select("id").eq("vehicle_id", vehicleId).eq("deleted_at", car.deleted_at);
  if (partsError) throw new Error(partsError.message);
  await purgeParts(supabase, parts.map((part) => part.id));

  const { data: documents, error: documentsError } = await supabase.from("vehicle_documents").select("storage_path").eq("vehicle_id", vehicleId);
  if (documentsError) throw new Error(documentsError.message);
  // The checklist, documents and expenses cascade; sold parts stay for the sales records.
  const { data: gone, error } = await supabase.from("vehicles").delete().eq("id", vehicleId).not("deleted_at", "is", null).select("id");
  if (error) throw new Error(error.message);
  if (!gone.length) return false;
  await removeFiles(supabase, CAR_FILES, [...(car.photo_path ? [car.photo_path] : []), ...documents.map((doc) => doc.storage_path)]);
  return true;
}

export async function deletePartForever(partId: string, typedName: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(partId, "Part");
    const supabase = await createClient();
    const { data: part, error } = await supabase.from("parts").select("name").eq("id", id).not("deleted_at", "is", null).maybeSingle();
    if (error) return failed(error);
    if (!part) return { error: "This part is no longer in Recently deleted." };
    if (!sameName(typedName, part.name)) throw new InvalidInput("The name typed doesn't match.");
    await purgeParts(supabase, [id]);
    refresh();
    return {};
  });
}

export async function deleteVehicleForever(vehicleId: string, typedName: string): Promise<Outcome> {
  return guard(async () => {
    const id = uuid(vehicleId, "Project");
    const supabase = await createClient();
    const { data: car, error } = await supabase.from("vehicles").select("make, model").eq("id", id).not("deleted_at", "is", null).maybeSingle();
    if (error) return failed(error);
    if (!car) return { error: "This project is no longer in Recently deleted." };
    if (!sameName(typedName, `${car.make} ${car.model}`)) throw new InvalidInput("The name typed doesn't match.");
    if (!(await purgeVehicle(supabase, id))) return { error: "This project is no longer in Recently deleted." };
    refresh();
    return {};
  });
}

/**
 * Deletes for good anything binned more than BIN_DAYS ago. Runs when an owner
 * opens Recently deleted (row level security gives staff nothing to delete).
 * Housekeeping only: it never throws and never revalidates.
 */
export async function purgeExpiredItems(): Promise<void> {
  try {
    const supabase = await createClient();
    const cutoff = new Date(Date.now() - BIN_DAYS * DAY_MS).toISOString();
    const { data: cars, error: carsError } = await supabase.from("vehicles").select("id").lte("deleted_at", cutoff);
    if (carsError) throw new Error(carsError.message);
    for (const car of cars) await purgeVehicle(supabase, car.id);
    const { data: parts, error: partsError } = await supabase.from("parts").select("id").lte("deleted_at", cutoff);
    if (partsError) throw new Error(partsError.message);
    await purgeParts(supabase, parts.map((part) => part.id));
  } catch (error) {
    console.error(error);
  }
}
