import { compressImage } from "./image";
import { MAX_DOCUMENT_MB } from "./types";

// Prepares picked files for upload. Photos are resized and get a small preview
// copy for lists; document scans stay sharp enough to read; PDFs go up as-is.

export type PreparedFile = {
  blob: Blob;
  thumb: Blob | null;
  name: string;
  contentType: "image/jpeg" | "application/pdf";
  preview: string | null; // local object URL, shown before upload
};

export class FileProblem extends Error {}

const PHOTO_EDGE = 1600;
const SCAN_EDGE = 2400;
const THUMB_EDGE = 400;

async function prepareImage(file: File, maxEdge: number, quality: number): Promise<PreparedFile> {
  if (file.type && !file.type.startsWith("image/")) throw new FileProblem("Use a photo, an image or a PDF.");
  try {
    const blob = await compressImage(file, maxEdge, quality);
    const thumb = await compressImage(blob, THUMB_EDGE, 0.7);
    return { blob, thumb, name: jpgName(file.name), contentType: "image/jpeg", preview: URL.createObjectURL(blob) };
  } catch {
    throw new FileProblem("Couldn't read that image. Try another one.");
  }
}

export function preparePhoto(file: File) {
  return prepareImage(file, PHOTO_EDGE, 0.8);
}

export async function prepareDocument(file: File): Promise<PreparedFile> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) throw new FileProblem(`PDFs must be ${MAX_DOCUMENT_MB} MB or smaller.`);
    return { blob: file, thumb: null, name: cleanName(file.name) || "Document.pdf", contentType: "application/pdf", preview: null };
  }
  return prepareImage(file, SCAN_EDGE, 0.85);
}

/** Prepares several files, keeping the ones that worked and reporting the first problem. */
export async function prepareAll(files: File[], prepare: (file: File) => Promise<PreparedFile>) {
  const results = await Promise.allSettled(files.map(prepare));
  const prepared = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  const problem = failure
    ? failure.reason instanceof FileProblem ? failure.reason.message : "Couldn't read one of those files."
    : null;
  return { prepared, problem };
}

export function discardPreview(file: PreparedFile | null) {
  if (file?.preview) URL.revokeObjectURL(file.preview);
}

function cleanName(name: string) {
  return name.replace(/[\x00-\x1f\x7f/\\]/g, "").trim().slice(-120);
}

function jpgName(name: string) {
  return `${cleanName(name).replace(/\.[^.]*$/, "") || "Photo"}.jpg`.slice(-120);
}
