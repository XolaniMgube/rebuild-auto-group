"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileTile, MediaPicker } from "@/components/Attachments";
import { Icon } from "@/components/Icon";
import { FormFooter, NavBar } from "@/components/Shell";
import { Button, DisclosureCard, Field, FormSection, IconButton, InlineError, Input, Spinner, Textarea } from "@/components/ui";
import { createVehicle } from "@/lib/actions";
import { discardPreview, prepareAll, prepareDocument, preparePhoto, type PreparedFile } from "@/lib/files";
import { MAX_CAR_DOCUMENTS } from "@/lib/types";

export default function NewCarPage() {
  const router = useRouter();
  const [saving, startSaving] = useTransition();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registration, setRegistration] = useState("");
  const [vin, setVin] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<PreparedFile | null>(null);
  const [documents, setDocuments] = useState<PreparedFile[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickPhoto(files: File[]) {
    setError(null);
    setPreparing(true);
    const { prepared, problem } = await prepareAll(files.slice(0, 1), preparePhoto);
    if (prepared[0]) {
      discardPreview(photo);
      setPhoto(prepared[0]);
    }
    if (problem) setError(problem);
    setPreparing(false);
  }

  async function pickDocuments(files: File[]) {
    const room = MAX_CAR_DOCUMENTS - documents.length;
    setError(null);
    setPreparing(true);
    const { prepared, problem } = await prepareAll(files.slice(0, room), prepareDocument);
    setDocuments(prev => [...prev, ...prepared].slice(0, MAX_CAR_DOCUMENTS));
    if (problem) setError(problem);
    else if (files.length > room) setError(`A car can have up to ${MAX_CAR_DOCUMENTS} documents.`);
    setPreparing(false);
  }

  function removeDocument(index: number) {
    discardPreview(documents[index]);
    setDocuments(documents.filter((_, i) => i !== index));
  }

  function save() {
    if (!make.trim() || !model.trim()) {
      setError("Make and model are needed so parts can be matched to it.");
      return;
    }
    if (year && (!Number.isInteger(Number(year)) || Number(year) < 1900 || Number(year) > new Date().getFullYear() + 1)) { setError("Enter a valid car year."); return; }
    if (preparing) return;
    setError(null);
    startSaving(async () => {
      const result = await createVehicle({ make, model, year: year ? Number(year) : null, color, registration, vin, notes });
      if ("error" in result) { setError(result.error); return; }

      // The project exists now, so a failed upload never loses the project itself.
      let filesFailed = false;
      if (photo || documents.length) {
        try {
          const { attachCarDocuments, attachCarPhoto } = await import("@/lib/uploads");
          const problems = await Promise.all([
            photo ? attachCarPhoto(result.id, photo) : null,
            documents.length ? attachCarDocuments(result.id, documents) : null,
          ]);
          filesFailed = problems.some(Boolean);
        } catch {
          filesFailed = true;
        }
      }
      router.push(`/cars/${result.id}${filesFailed ? "?files=failed" : ""}`);
    });
  }

  return <>
    <NavBar back={{ href: "/cars", label: "Cancel" }} title="New project" />
    <main className="page-narrow pb-6 pt-4">
      <form id="new-project" onSubmit={e => { e.preventDefault(); save(); }} className="space-y-4">
        <section className="card overflow-hidden">
          {photo
            ? <div className="relative bg-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview ?? ""} alt="Car photo" className="aspect-[16/10] w-full object-cover" />
              <IconButton label="Remove car photo" icon="close" variant="overlay" disabled={saving} onClick={() => { discardPreview(photo); setPhoto(null); }} className="absolute right-3 top-3" />
            </div>
            : <div className="flex items-center gap-4 p-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-thumb bg-subtle text-tertiary"><Icon name="car" className="h-7 w-7" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-card">Car photo</h2>
                <p className="mt-0.5 text-meta text-secondary">Optional</p>
              </div>
              <MediaPicker compact label="car photo" disabled={saving || preparing} onFiles={pickPhoto} />
            </div>}
        </section>

        <FormSection title="Car details">
          <Field label="Make"><Input required maxLength={60} value={make} onChange={e => { setMake(e.target.value); setError(null); }} placeholder="e.g. VW" /></Field>
          <Field label="Model"><Input required maxLength={60} value={model} onChange={e => { setModel(e.target.value); setError(null); }} placeholder="e.g. Polo Vivo" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year"><Input type="number" inputMode="numeric" min={1900} max={new Date().getFullYear() + 1} step={1} value={year} onChange={e => setYear(e.target.value)} placeholder="2012" /></Field>
            <Field label="Colour"><Input maxLength={40} value={color} onChange={e => setColor(e.target.value)} placeholder="White" /></Field>
          </div>
        </FormSection>

        <FormSection title="Documents" aside={`${documents.length}/${MAX_CAR_DOCUMENTS}`}>
          {documents.length > 0 && <ul className="-my-1 divide-y divide-separator">{documents.map((doc, i) => <li key={`${i}-${doc.name}`} className="flex items-center gap-3 py-2">
            <FileTile thumbUrl={doc.preview} />
            <span className="min-w-0 flex-1 truncate text-body font-medium">{doc.name}</span>
            <IconButton label={`Remove ${doc.name}`} icon="close" variant="plain" disabled={saving} onClick={() => removeDocument(i)} className="-mr-2" />
          </li>)}</ul>}
          {documents.length < MAX_CAR_DOCUMENTS && <MediaPicker label="car document" accept="image/*,application/pdf" multiple uploadText="Upload file" disabled={saving || preparing} onFiles={pickDocuments} />}
        </FormSection>

        {preparing && <p role="status" className="flex items-center gap-2 px-1 text-meta text-secondary"><Spinner className="h-4 w-4" />Preparing files…</p>}

        <DisclosureCard title="More details" aside="Optional">
          <Field label="Registration"><Input maxLength={20} value={registration} onChange={e => setRegistration(e.target.value)} /></Field>
          <Field label="VIN / chassis number"><Input maxLength={32} value={vin} onChange={e => setVin(e.target.value)} /></Field>
          <Field label="Notes"><Textarea rows={3} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Plans for this car" /></Field>
        </DisclosureCard>
      </form>
    </main>
    <FormFooter>
      {error && <InlineError>{error}</InlineError>}
      <Button type="submit" form="new-project" block loading={saving} disabled={preparing}>{saving ? "Creating…" : "Create project"}</Button>
    </FormFooter>
  </>;
}
