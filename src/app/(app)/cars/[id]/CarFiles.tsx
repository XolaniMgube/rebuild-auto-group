"use client";

import { useState } from "react";
import { FileTile, MediaPicker } from "@/components/Attachments";
import { IconButton, iconButtonClass, InlineError, Spinner, useConfirm } from "@/components/ui";
import { removeVehicleDocument, removeVehiclePhoto } from "@/lib/actions";
import { discardPreview, FileProblem, prepareAll, prepareDocument, preparePhoto } from "@/lib/files";
import { fileSize, shortDate } from "@/lib/format";
import { MAX_CAR_DOCUMENTS, type VehicleDocument } from "@/lib/types";

type Notify = (message: string) => void;

export function CarPhotoControls({ vehicleId, hasPhoto, onMessage, onError }: {
  vehicleId: string;
  hasPhoto: boolean;
  onMessage: Notify;
  onError: (error: string | null) => void;
}) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const tone = hasPhoto ? "overlay" : "surface";

  async function pick(files: File[]) {
    onError(null);
    onMessage("");
    setBusy(true);
    try {
      const photo = await preparePhoto(files[0]);
      const { attachCarPhoto } = await import("@/lib/uploads");
      const problem = await attachCarPhoto(vehicleId, photo);
      discardPreview(photo);
      if (problem) onError(problem);
      else onMessage(hasPhoto ? "Photo replaced" : "Photo added");
    } catch (error) {
      onError(error instanceof FileProblem ? error.message : "Couldn't add that photo. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirm({ title: "Remove car photo?", confirmLabel: "Remove" }))) return;
    onError(null);
    onMessage("");
    setBusy(true);
    const result = await removeVehiclePhoto(vehicleId);
    setBusy(false);
    if (result.error) onError(result.error);
    else onMessage("Photo removed");
  }

  if (busy) return <span role="status" aria-label="Saving photo" className={iconButtonClass({ variant: tone })}><Spinner /></span>;
  return <div className="flex shrink-0 gap-2">
    <MediaPicker compact tone={tone} label="car photo" onFiles={pick} />
    {hasPhoto && <IconButton label="Remove car photo" icon="close" variant="overlay" onClick={remove} />}
  </div>;
}

export function CarDocuments({ vehicleId, documents, onMessage }: { vehicleId: string; documents: VehicleDocument[]; onMessage: Notify }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const room = MAX_CAR_DOCUMENTS - documents.length;

  async function add(files: File[]) {
    setError(null);
    onMessage("");
    setBusy(true);
    try {
      const { prepared, problem } = await prepareAll(files.slice(0, room), prepareDocument);
      if (prepared.length) {
        const { attachCarDocuments } = await import("@/lib/uploads");
        const uploadProblem = await attachCarDocuments(vehicleId, prepared);
        prepared.forEach(discardPreview);
        if (uploadProblem) {
          setError(uploadProblem);
          return;
        }
        onMessage(prepared.length > 1 ? "Documents added" : "Document added");
      }
      if (problem) setError(problem);
      else if (files.length > room) setError(`A car can have up to ${MAX_CAR_DOCUMENTS} documents.`);
    } catch {
      setError("Couldn't add those files. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(doc: VehicleDocument) {
    if (!(await confirm({ title: `Remove ${doc.fileName}?`, message: "The file will be deleted.", confirmLabel: "Remove" }))) return;
    setError(null);
    onMessage("");
    setBusy(true);
    const result = await removeVehicleDocument(doc.id);
    setBusy(false);
    if (result.error) setError(result.error);
    else onMessage("Document removed");
  }

  return <div className="card">
    <div className="flex items-center justify-between gap-3 px-4 pt-4">
      <h3 className="text-card">Documents</h3>
      <span className="text-meta tabular-nums text-secondary">{documents.length}/{MAX_CAR_DOCUMENTS}</span>
    </div>
    {documents.length > 0
      ? <ul className="mt-2 divide-y divide-separator">{documents.map(doc => {
        const label = <>
          <span className="block truncate text-body font-medium">{doc.fileName}</span>
          <span className="mt-0.5 block text-meta text-secondary">{doc.contentType === "application/pdf" ? "PDF" : "Image"} · {fileSize(doc.sizeBytes)} · {shortDate(doc.createdAt)}</span>
        </>;
        return <li key={doc.id} className="flex items-center gap-3 px-4 py-2.5">
          <FileTile thumbUrl={doc.thumbUrl} />
          {doc.url
            ? <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">{label}</a>
            : <div className="min-w-0 flex-1 opacity-60">{label}</div>}
          <IconButton label={`Remove ${doc.fileName}`} icon="close" variant="plain" disabled={busy} onClick={() => remove(doc)} className="-mr-2" />
        </li>;
      })}</ul>
      : <p className="px-4 pt-1 text-meta text-secondary">Registration papers, invoices and other scans.</p>}
    <div className="space-y-3 p-4">
      {error && <InlineError>{error}</InlineError>}
      {busy
        ? <p role="status" className="flex min-h-control items-center justify-center gap-2 text-meta text-secondary"><Spinner className="h-4 w-4" />Saving…</p>
        : room > 0
          ? <MediaPicker label="car document" accept="image/*,application/pdf" multiple uploadText="Upload file" onFiles={add} />
          : <p className="text-meta text-secondary">Remove a document to add another.</p>}
    </div>
  </div>;
}
