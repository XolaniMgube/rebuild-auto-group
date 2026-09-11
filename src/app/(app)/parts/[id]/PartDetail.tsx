"use client";

import { useState, useTransition } from "react";
import { MediaPicker, RemoveButton } from "@/components/Attachments";
import { Icon } from "@/components/Icon";
import { partIcon } from "@/components/PartThumb";
import { NavBar } from "@/components/Shell";
import {
  Button, ButtonLink, ConditionBadge, DetailList, DetailRow, DisclosureCard, Field, FieldSet, FormSection, IconButton, InlineError, Input,
  MoneyInput, Notice, RowLink, SectionHeading, SegmentedControl, Select, Sheet, Spinner, StatusBadge, Textarea, useConfirm,
} from "@/components/ui";
import { removePartImage, sellPart, setPartHold, undoSale, updatePart } from "@/lib/actions";
import { discardPreview, prepareAll, preparePhoto } from "@/lib/files";
import { carName, longDate, parseRands, rands, shortDate } from "@/lib/format";
import { ACTIVE_STATUSES, CONDITION_LABEL, CONDITION_OPTIONS, MAX_PART_PHOTOS, type Part, type SoldItem, type Vehicle } from "@/lib/types";

export function PartDetail({ part, vehicles, sales, notice }: { part: Part; vehicles: Vehicle[]; sales: SoldItem[] | null; notice: string }) {
  const confirm = useConfirm();
  const [shot, setShot] = useState(0);
  const [editing, setEditing] = useState(false);
  const [selling, setSelling] = useState(false);
  const [sellSheet, setSellSheet] = useState(0);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [message, setMessage] = useState(notice);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [holding, startHold] = useTransition();
  const vehicle = vehicles.find(v => v.id === part.vehicleId);
  const active = ACTIVE_STATUSES.includes(part.status);
  const photo = part.images[Math.min(shot, part.images.length - 1)];

  function toggleHold() {
    const held = part.status === "reserved";
    setError(null);
    startHold(async () => {
      const result = await setPartHold(part.id, !held);
      if (result.error) setError(result.error);
      else setMessage(held ? "Hold released" : "Part on hold");
    });
  }

  async function reverseSale(sale: SoldItem) {
    if (!(await confirm({ title: "Undo this sale?", message: `The part goes back into stock and ${rands(sale.price * sale.quantity)} comes off sales.`, confirmLabel: "Undo sale" }))) return;
    setError(null);
    setMessage("");
    setUndoing(sale.saleId);
    const result = await undoSale(sale.saleId);
    setUndoing(null);
    if (result.error) setError(result.error);
    else setMessage("Sale undone, part back in stock");
  }

  async function addPhotos(files: File[]) {
    const room = MAX_PART_PHOTOS - part.images.length;
    setPhotoError(null);
    setMessage("");
    setPhotoBusy(true);
    try {
      const { prepared, problem } = await prepareAll(files.slice(0, room), preparePhoto);
      if (prepared.length) {
        const { attachPartPhotos } = await import("@/lib/uploads");
        const uploadProblem = await attachPartPhotos(part.id, prepared);
        prepared.forEach(discardPreview);
        if (uploadProblem) {
          setPhotoError(uploadProblem);
          return;
        }
        setMessage(prepared.length > 1 ? "Photos added" : "Photo added");
      }
      if (problem) setPhotoError(problem);
      else if (files.length > room) setPhotoError(`A part can have up to ${MAX_PART_PHOTOS} photos.`);
    } catch {
      setPhotoError("Couldn't add those photos. Check your connection and try again.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto(id: string) {
    if (!(await confirm({ title: "Remove this photo?", confirmLabel: "Remove" }))) return;
    setPhotoError(null);
    setMessage("");
    setPhotoBusy(true);
    const result = await removePartImage(id);
    setPhotoBusy(false);
    if (result.error) setPhotoError(result.error);
    else {
      setShot(0);
      setMessage("Photo removed");
    }
  }

  return <>
    <NavBar back={{ href: "/search", label: "Parts" }} title={editing ? "Edit part" : part.name} heading={false} />
    <main className="page page-bottom pt-4 lg:pt-6">
      <div className="space-y-4">
        {message && <Notice onDismiss={() => setMessage("")}>{message}</Notice>}

        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <section className={`card overflow-hidden ${editing ? "hidden lg:block" : ""}`}>
            {photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photo.url} alt={part.name} className="aspect-[4/3] w-full bg-subtle object-contain" />
              : <div className="grid h-40 w-full place-items-center bg-subtle text-tertiary sm:h-52 lg:h-72"><Icon name={partIcon(part.name)} className="h-12 w-12" /></div>}
            <div className="border-t border-separator p-3">
              <div className="flex flex-wrap items-center gap-3">
                {part.images.map((img, i) => <div key={img.id} className="relative">
                  <button type="button" aria-label={`View photo ${i + 1}`} aria-pressed={photo?.id === img.id} onClick={() => setShot(i)}
                    className={`block overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-surface transition duration-fast ${photo?.id === img.id ? "ring-brand-navy" : "ring-transparent"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumbUrl} alt="" className="h-14 w-14 bg-subtle object-cover" />
                  </button>
                  <RemoveButton label={`Remove photo ${i + 1}`} disabled={photoBusy} onClick={() => removePhoto(img.id)} />
                </div>)}
                {photoBusy
                  ? <span role="status" aria-label="Saving photos" className="grid h-11 w-11 place-items-center"><Spinner /></span>
                  : part.images.length < MAX_PART_PHOTOS && <div className="flex items-center gap-2">
                    <MediaPicker compact label="part photo" multiple onFiles={addPhotos} />
                    {!part.images.length && <span className="pl-1 text-meta text-secondary">Add photos</span>}
                  </div>}
              </div>
              {photoError && <InlineError className="mt-3 px-1">{photoError}</InlineError>}
            </div>
          </section>

          <div className="min-w-0 space-y-5">
            {editing
              ? <EditPart key={part.id} part={part} vehicles={vehicles} onDone={() => { setEditing(false); setMessage("Changes saved"); }} onCancel={() => setEditing(false)} />
              : <>
                <section className="px-1">
                  <h1 className="break-words text-title">{part.name}</h1>
                  <p className="mt-1 text-body text-secondary">{[vehicle ? carName(vehicle) : "Unassigned stock", part.brand].filter(Boolean).join(" · ")}</p>
                  <div className="mt-3 flex flex-wrap gap-2"><ConditionBadge condition={part.condition} /><StatusBadge status={part.status} /></div>
                  <p className="mt-4 flex items-baseline gap-2">
                    {part.price > 0
                      ? <><span className="text-[30px] font-bold leading-none tracking-[-0.035em] tabular-nums">{rands(part.price)}</span>
                        <span className="text-meta text-secondary">asking{part.quantity > 1 ? " each" : ""}</span></>
                      : <span className="text-body text-tertiary">No asking price yet</span>}
                  </p>
                </section>

                <div className="space-y-3">
                  {active && <Button block onClick={() => { setError(null); setSellSheet(n => n + 1); setSelling(true); }}><Icon name="tag" />Mark as sold</Button>}
                  <div className={`grid gap-3 ${active ? "grid-cols-2" : ""}`}>
                    <Button variant="secondary" onClick={() => { setError(null); setEditing(true); }}>Edit part</Button>
                    {active && <Button variant="secondary" loading={holding} onClick={toggleHold}>{part.status === "reserved" ? "Release hold" : "Put on hold"}</Button>}
                  </div>
                </div>
                {error && <InlineError>{error}</InlineError>}

                {sales && sales.length > 0 && <div>
                  <SectionHeading variant="group" title="Sales" />
                  <ul className="card divide-y divide-separator">{sales.map(sale => {
                    const discounted = sale.listPrice != null && sale.listPrice > sale.price;
                    return <li key={sale.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-semibold tabular-nums">
                          {rands(sale.price * sale.quantity)}
                          {sale.quantity > 1 && <span className="font-normal text-secondary"> · {sale.quantity} × {rands(sale.price)}</span>}
                        </p>
                        <p className="truncate text-meta text-secondary">
                          {shortDate(sale.soldAt)}{sale.customerName ? ` · ${sale.customerName}` : ""}
                          {discounted && <span className="text-warning"> · asked {rands(sale.listPrice!)}</span>}
                        </p>
                      </div>
                      {undoing === sale.saleId
                        ? <span className="grid h-11 w-11 place-items-center"><Spinner /></span>
                        : <IconButton label={`Undo sale of ${rands(sale.price * sale.quantity)}`} icon="undo" variant="plain" disabled={undoing !== null} onClick={() => reverseSale(sale)} className="-mr-2" />}
                    </li>;
                  })}</ul>
                </div>}

                <div>
                  <SectionHeading variant="group" title="Inventory" />
                  <DetailList>
                    <DetailRow icon="pin" label="Location" value={part.location ?? "Not set"} muted={!part.location} />
                    <DetailRow icon="box" label="Quantity" value={part.quantity} />
                  </DetailList>
                </div>

                <div>
                  <SectionHeading variant="group" title="Details" />
                  <DetailList>
                    <DetailRow label="Condition" value={CONDITION_LABEL[part.condition]} />
                    {part.brand && <DetailRow label="Brand" value={part.brand} />}
                    {part.serialNumber && <DetailRow label="Part number" value={part.serialNumber} />}
                  </DetailList>
                </div>

                {vehicle && <div>
                  <SectionHeading variant="group" title="Vehicle" />
                  <RowLink href={`/cars/${vehicle.id}`} icon="car" label="Car project" title={carName(vehicle)} />
                </div>}

                {part.description && <div>
                  <SectionHeading variant="group" title="Notes" />
                  <p className="card whitespace-pre-line break-words p-4 text-body">{part.description}</p>
                </div>}

                <div>
                  <SectionHeading variant="group" title="History" />
                  <DetailList><DetailRow label="Added" value={longDate(part.createdAt)} /></DetailList>
                </div>

                <ButtonLink href={`/add${vehicle ? `?car=${vehicle.id}` : ""}`} variant="plain" block><Icon name="plus" />Add another part</ButtonLink>
              </>}
          </div>
        </div>
      </div>
    </main>

    {active && <SellSheet key={sellSheet} part={part} open={selling} onClose={() => setSelling(false)}
      onSold={text => { setSelling(false); setMessage(text); }} />}
  </>;
}

/** Records what the customer actually paid, which may be less than the asking price. */
function SellSheet({ part, open, onClose, onSold }: { part: Part; open: boolean; onClose: () => void; onSold: (message: string) => void }) {
  const [price, setPrice] = useState(part.price > 0 ? String(part.price) : "");
  const [quantity, setQuantity] = useState("1");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const several = part.quantity > 1;
  const amount = parseRands(price);
  const discount = part.price > 0 && amount !== null && !Number.isNaN(amount) && amount < part.price ? part.price - amount : 0;
  const hint = part.price > 0 ? (discount > 0 ? `${rands(discount)} off the asking price of ${rands(part.price)}` : `Asking ${rands(part.price)}`) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const count = Number(quantity);
    if (amount === null || Number.isNaN(amount)) { setError("Enter what the customer paid, e.g. 300."); return; }
    if (!Number.isInteger(count) || count < 1 || count > part.quantity) { setError(`Quantity must be from 1 to ${part.quantity}.`); return; }
    setError(null);
    startSaving(async () => {
      const result = await sellPart(part.id, { price: amount, quantity: count, customerName: customer, customerPhone: phone });
      if (result.error) setError(result.error);
      else onSold(`Sold for ${rands(amount * count)}`);
    });
  }

  return <Sheet open={open} onClose={onClose} title="Mark as sold" description={part.name}
    footer={<>
      <Button variant="secondary" block className="sm:w-auto" disabled={saving} onClick={onClose}>Cancel</Button>
      <Button type="submit" form="sell-part" block className="sm:w-auto" loading={saving}>Record sale</Button>
    </>}>
    <form id="sell-part" onSubmit={submit} className="space-y-4">
      <div className={several ? "grid grid-cols-[minmax(0,1fr)_104px] gap-3" : ""}>
        <Field label={several ? "Sold for, each" : "Sold for"} hint={hint}>
          <MoneyInput value={price} onChange={e => { setPrice(e.target.value); setError(null); }} placeholder="0" />
        </Field>
        {several && <Field label="Quantity">
          <Input type="number" inputMode="numeric" min={1} max={part.quantity} step={1} value={quantity} onChange={e => { setQuantity(e.target.value); setError(null); }} />
        </Field>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer"><Input maxLength={120} autoComplete="off" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Optional" /></Field>
        <Field label="Phone"><Input type="tel" inputMode="tel" maxLength={30} autoComplete="off" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" /></Field>
      </div>
      {error && <InlineError>{error}</InlineError>}
    </form>
  </Sheet>;
}

function EditPart({ part, vehicles, onDone, onCancel }: { part: Part; vehicles: Vehicle[]; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(part.name);
  const [vehicleId, setVehicleId] = useState(part.vehicleId ?? "");
  const [location, setLocation] = useState(part.location ?? "");
  const [condition, setCondition] = useState(part.condition);
  const [notes, setNotes] = useState(part.description ?? "");
  const [quantity, setQuantity] = useState(String(part.quantity));
  const [price, setPrice] = useState(part.price > 0 ? String(part.price) : "");
  const [brand, setBrand] = useState(part.brand ?? "");
  const [serial, setSerial] = useState(part.serialNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Give the part a name so it can be found later."); return; }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) { setError("Quantity must be a whole number of at least 1."); return; }
    const askingPrice = parseRands(price);
    if (Number.isNaN(askingPrice)) { setError("Enter the price in rands, e.g. 400."); return; }
    setError(null);
    startSaving(async () => {
      const result = await updatePart(part.id, { name, vehicleId: vehicleId || null, location, condition, description: notes, quantity: Number(quantity), brand, serialNumber: serial, price: askingPrice });
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return <form className="space-y-4" onSubmit={submit}>
    <FormSection title="Part">
      <Field label="Part name"><Input required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Car project">
        <Select value={vehicleId} onChange={e => setVehicleId(e.currentTarget.value)}>
          <option value="">Unassigned stock</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{carName(v)}</option>)}
        </Select>
      </Field>
      <FieldSet legend="Condition"><SegmentedControl label="Condition" options={CONDITION_OPTIONS} value={condition} onChange={setCondition} /></FieldSet>
      <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3">
        <Field label="Asking price"><MoneyInput value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 400" /></Field>
        <Field label="Quantity"><Input type="number" inputMode="numeric" min={1} max={9999} step={1} required value={quantity} onChange={e => setQuantity(e.target.value)} /></Field>
      </div>
      <Field label="Location"><Input maxLength={60} value={location} onChange={e => setLocation(e.target.value)} placeholder="Rack B3" /></Field>
    </FormSection>
    <DisclosureCard title="More details">
      <Field label="Brand"><Input maxLength={60} value={brand} onChange={e => setBrand(e.target.value)} /></Field>
      <Field label="Part number"><Input maxLength={80} value={serial} onChange={e => setSerial(e.target.value)} /></Field>
      <Field label="Notes"><Textarea rows={3} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    </DisclosureCard>
    {error && <InlineError>{error}</InlineError>}
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" disabled={saving} onClick={onCancel}>Cancel</Button>
      <Button type="submit" loading={saving}>Save changes</Button>
    </div>
  </form>;
}
