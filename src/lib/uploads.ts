import { addPartImages, addVehicleDocuments, setVehiclePhoto } from "./actions";
import type { PreparedFile } from "./files";
import { randomName, thumbPathFor } from "./ids";
import { createClient } from "./supabase/client";

// Files go straight from the phone to private Storage, so large files never
// pass through our server. A server action then records them. If recording
// fails, the uploaded files are removed again.

type Bucket = "part-images" | "vehicle-files";
type Client = ReturnType<typeof createClient>;

const PARTLY_FAILED = "Some files didn't upload. Check your connection and try again.";

async function upload(supabase: Client, bucket: Bucket, folder: string, files: PreparedFile[]) {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const path = `${folder}/${randomName()}.${file.contentType === "application/pdf" ? "pdf" : "jpg"}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file.blob, { contentType: file.contentType });
      if (error) throw error;
      // A missing preview only means lists fall back to the full photo.
      if (file.thumb) await supabase.storage.from(bucket).upload(thumbPathFor(path), file.thumb, { contentType: "image/jpeg" });
      return { path, file };
    })
  );
  const uploaded = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  return { uploaded, failed: uploaded.length < files.length };
}

async function discard(supabase: Client, bucket: Bucket, paths: string[]) {
  const all = paths.flatMap((path) => (path.endsWith(".jpg") ? [path, thumbPathFor(path)] : [path]));
  if (all.length) await supabase.storage.from(bucket).remove(all);
}

/** Returns an error message, or null when every photo was saved. */
export async function attachPartPhotos(partId: string, photos: PreparedFile[]): Promise<string | null> {
  const supabase = createClient();
  const { uploaded, failed } = await upload(supabase, "part-images", partId, photos);
  if (!uploaded.length) return PARTLY_FAILED;
  const paths = uploaded.map((item) => item.path);
  const result = await addPartImages(partId, paths);
  if (result.error) {
    await discard(supabase, "part-images", paths);
    return result.error;
  }
  return failed ? PARTLY_FAILED : null;
}

/** Sets or replaces the car photo. Returns an error message, or null. */
export async function attachCarPhoto(vehicleId: string, photo: PreparedFile): Promise<string | null> {
  const supabase = createClient();
  const { uploaded } = await upload(supabase, "vehicle-files", `${vehicleId}/photo`, [photo]);
  if (!uploaded.length) return "The photo didn't upload. Check your connection and try again.";
  const result = await setVehiclePhoto(vehicleId, uploaded[0].path);
  if (result.error) {
    await discard(supabase, "vehicle-files", [uploaded[0].path]);
    return result.error;
  }
  return null;
}

/** Returns an error message, or null when every document was saved. */
export async function attachCarDocuments(vehicleId: string, documents: PreparedFile[]): Promise<string | null> {
  const supabase = createClient();
  const { uploaded, failed } = await upload(supabase, "vehicle-files", `${vehicleId}/documents`, documents);
  if (!uploaded.length) return PARTLY_FAILED;
  const result = await addVehicleDocuments(
    vehicleId,
    uploaded.map(({ path, file }) => ({ path, fileName: file.name, contentType: file.contentType, sizeBytes: file.blob.size }))
  );
  if (result.error) {
    await discard(supabase, "vehicle-files", uploaded.map((item) => item.path));
    return result.error;
  }
  return failed ? PARTLY_FAILED : null;
}
