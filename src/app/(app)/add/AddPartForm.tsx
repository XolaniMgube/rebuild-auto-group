"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaPicker, RemoveButton } from "@/components/Attachments";
import { FormFooter, NavBar } from "@/components/Shell";
import { Button, DisclosureCard, Field, FieldSet, FormSection, InlineError, Input, SegmentedControl, Select, Spinner, Textarea } from "@/components/ui";
import { createPart } from "@/lib/actions";
import { discardPreview, prepareAll, preparePhoto, type PreparedFile } from "@/lib/files";
import { carName } from "@/lib/format";
import { CONDITION_OPTIONS, MAX_PART_PHOTOS, type Condition, type Vehicle } from "@/lib/types";

export function AddPartForm({ vehicles, initialCar }: { vehicles: Vehicle[]; initialCar: string | null }) {
  const router = useRouter();

  const [photos, setPhotos] = useState<PreparedFile[]>([]);
  const [vehicleId, setVehicleId] = useState<string>(vehicles.some(v => v.id === initialCar) ? initialCar! : "");
  const [name, setName] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState("");
  const [serial, setSerial] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickPhotos(files: File[]) {
    const room = MAX_PART_PHOTOS - photos.length;
    setBusy(true);
    setError(null);
    const { prepared, problem } = await prepareAll(files.slice(0, room), preparePhoto);
    setPhotos(prev => [...prev, ...prepared].slice(0, MAX_PART_PHOTOS));
    if (problem) setError(problem);
    else if (files.length > room) setError(`A part can have up to ${MAX_PART_PHOTOS} photos.`);
    setBusy(false);
  }

  function removePhoto(index: number) {
    discardPreview(photos[index]);
    setPhotos(photos.filter((_, i) => i !== index));
  }

  async function save() {
    if (!name.trim()) {
      setError("Give the part a name so it can be found later.");
      return;
    }
    if (busy || saving) return;
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) { setError("Quantity must be a whole number of at least 1."); return; }

    setSaving(true);
    setError(null);
    const result = await createPart({ name, vehicleId: vehicleId || null, condition, location, quantity: Number(quantity), brand, serialNumber: serial, description });
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // The part exists now, so a failed photo upload never loses the part itself.
    let photosFailed = false;
    if (photos.length) {
      try {
        // Loaded on demand: the Storage client is only needed when there are photos.
        const { attachPartPhotos } = await import("@/lib/uploads");
        photosFailed = Boolean(await attachPartPhotos(result.id, photos));
      } catch {
        photosFailed = true;
      }
    }
    router.push(`/parts/${result.id}?added=1${photosFailed ? "&photos=failed" : ""}`);
  }

  const backHref = initialCar ? `/cars/${initialCar}` : "/search";

  return <>
    <NavBar back={{ href: backHref, label: "Cancel" }} title="Add part" />
    <main className="page-narrow pb-6 pt-4">
      <form id="add-part" onSubmit={e => { e.preventDefault(); save(); }} className="space-y-4">
        <FormSection title="Photos" aside={`${photos.length}/${MAX_PART_PHOTOS}`}>
          {photos.length > 0 && <div className="grid grid-cols-4 gap-3">{photos.map((photo, i) => <div key={photo.preview ?? i} className="relative">
            {/* Local previews of resized photos, not yet uploaded. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.preview ?? ""} alt={`Part photo ${i + 1}`} className="aspect-square w-full rounded-xl bg-subtle object-cover" />
            <RemoveButton label={`Remove photo ${i + 1}`} disabled={saving} onClick={() => removePhoto(i)} />
          </div>)}</div>}
          {photos.length < MAX_PART_PHOTOS && <MediaPicker label="part photo" multiple disabled={busy || saving} onFiles={onPickPhotos} />}
          {busy && <p role="status" className="flex items-center gap-2 text-meta text-secondary"><Spinner className="h-4 w-4" />Preparing photos…</p>}
        </FormSection>

        <FormSection title="Part">
          <Field label="Part name"><Input required maxLength={120} value={name} onChange={e => { setName(e.target.value); setError(null); }} placeholder="e.g. Headlight, left" /></Field>
          <Field label="Car project">
            <Select value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">Unassigned stock</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{carName(v)}</option>)}
            </Select>
          </Field>
          <FieldSet legend="Condition"><SegmentedControl label="Condition" options={CONDITION_OPTIONS} value={condition} onChange={setCondition} /></FieldSet>
          <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3">
            <Field label="Location"><Input maxLength={60} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Rack B3" /></Field>
            <Field label="Quantity"><Input type="number" inputMode="numeric" min={1} max={9999} step={1} required value={quantity} onChange={e => setQuantity(e.target.value)} /></Field>
          </div>
        </FormSection>

        <DisclosureCard title="More details" aside="Optional">
          <Field label="Brand"><Input maxLength={60} value={brand} onChange={e => setBrand(e.target.value)} /></Field>
          <Field label="Part number"><Input maxLength={80} value={serial} onChange={e => setSerial(e.target.value)} /></Field>
          <Field label="Notes"><Textarea rows={3} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Fitment, test results, anything to remember" /></Field>
        </DisclosureCard>
      </form>
    </main>
    <FormFooter>
      {error && <InlineError>{error}</InlineError>}
      <Button type="submit" form="add-part" block loading={saving} disabled={busy}>{saving ? "Saving…" : "Add part"}</Button>
    </FormFooter>
  </>;
}
