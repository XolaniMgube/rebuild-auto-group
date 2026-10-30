"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BulkDeleteBar, useSelection } from "@/components/BulkDelete";
import { DeleteSheet, type Stake } from "@/components/DeleteSheet";
import { Icon } from "@/components/Icon";
import { PartCard } from "@/components/PartCard";
import { NavBar } from "@/components/Shell";
import { Button, ButtonLink, CheckCircle, DetailList, DetailRow, EmptyState, IconButton, IconLink, InlineError, Input, Notice, SectionHeading, SegmentedControl } from "@/components/ui";
import { addTask, binVehicle, removeTask, setTaskDone } from "@/lib/actions";
import { carName, plural, rands } from "@/lib/format";
import type { Part, ProjectMoney as Money, ProjectTask, SignedPhoto, Vehicle, VehicleDocument } from "@/lib/types";
import { CarDocuments, CarPhotoControls } from "./CarFiles";
import { ProjectMoney } from "./ProjectMoney";

type Tab = "parts" | "money" | "checklist" | "details";
type TaskChange = { type: "add"; task: ProjectTask } | { type: "toggle"; id: string } | { type: "remove"; id: string };

const PENDING = "pending-";

function applyChange(tasks: ProjectTask[], change: TaskChange) {
  if (change.type === "add") return [...tasks, change.task];
  if (change.type === "toggle") return tasks.map(t => t.id === change.id ? { ...t, done: !t.done } : t);
  return tasks.filter(t => t.id !== change.id);
}

const headingLink = "-mr-1 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-brand-navy transition hover:bg-brand-navy-tint";

export function ProjectDetail({ vehicle, photo, documents, parts, tasks, money, canDelete, notice }: {
  vehicle: Vehicle;
  photo: SignedPhoto | null;
  documents: VehicleDocument[];
  parts: Part[];
  tasks: ProjectTask[];
  money: Money | null;
  canDelete: boolean;
  notice: string;
}) {
  const id = vehicle.id;
  // Checklist changes show instantly and roll back if the save fails.
  const [checklist, applyOptimistic] = useOptimistic(tasks, applyChange);
  const [, startTransition] = useTransition();
  const [task, setTask] = useState("");
  const [tab, setTab] = useState<Tab>("parts");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(notice);
  const [fileError, setFileError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSheet, setDeleteSheet] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const selection = useSelection();
  const done = checklist.filter(t => t.done).length;
  const summary = [vehicle.year, vehicle.color].filter(Boolean).join(" · ");
  const facts = ([["Year", vehicle.year], ["Colour", vehicle.color], ["Registration", vehicle.registration], ["VIN", vehicle.vin]] as const)
    .filter(([, value]) => value);
  const stockValue = parts.reduce((sum, part) => sum + part.price * part.quantity, 0);
  const tabs: { value: Tab; label: string }[] = [
    { value: "parts", label: "Parts" },
    ...(money ? [{ value: "money" as const, label: "Money" }] : []),
    { value: "checklist", label: "Checklist" },
    { value: "details", label: "Details" },
  ];

  function stopSelecting() {
    setSelecting(false);
    selection.clear();
  }

  function save(change: TaskChange, action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      applyOptimistic(change);
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const name = task.trim();
    if (!name) return;
    setTask("");
    save({ type: "add", task: { id: `${PENDING}${Date.now()}`, vehicleId: id, name, done: false } }, async () => {
      const result = await addTask(id, name);
      if (result.error) setTask(name);
      return result;
    });
  }

  return <>
    <NavBar back={{ href: "/cars", label: "Projects" }} title={carName(vehicle)} heading={false}
      action={<IconLink href={`/add?car=${id}`} label="Add part" icon="plus" variant="accent" className="-mr-2" />} />
    <main className={`page page-bottom pt-4 lg:pt-6 ${selecting ? "pb-40 lg:pb-32" : ""}`}>
      <div className="space-y-4">
        {message && <Notice onDismiss={() => setMessage("")}>{message}</Notice>}
        {fileError && <Notice tone="error" onDismiss={() => setFileError(null)}>{fileError}</Notice>}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
          <div className="min-w-0 space-y-5">
            <section className="card overflow-hidden">
              {photo
                ? <div className="relative bg-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={carName(vehicle)} className="aspect-[16/10] w-full object-cover" />
                  <div className="absolute bottom-3 right-3"><CarPhotoControls vehicleId={id} hasPhoto onMessage={setMessage} onError={setFileError} /></div>
                </div>
                : <div className="flex flex-col items-center gap-3 bg-subtle px-6 py-6 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-tertiary shadow-card"><Icon name="car" className="h-7 w-7" /></span>
                  <p className="text-meta text-secondary">Add a photo of this car</p>
                  <CarPhotoControls vehicleId={id} hasPhoto={false} onMessage={setMessage} onError={setFileError} />
                </div>}
              <div className="p-4 sm:p-5">
                <h1 className="break-words text-title">{vehicle.make} {vehicle.model}</h1>
                {summary && <p className="mt-1 text-body text-secondary">{summary}</p>}
              </div>
            </section>

            <div className="xl:hidden"><SegmentedControl tabs label="Project sections" options={tabs} value={tab} onChange={setTab} /></div>

            <section id="panel-parts" role="tabpanel" aria-labelledby="tab-parts" className={tab === "parts" ? "" : "hidden xl:block"}>
              <SectionHeading title="Parts" count={parts.length} action={<div className="flex items-center">
                {selecting
                  ? <button type="button" onClick={stopSelecting} className={headingLink}>Cancel</button>
                  : <>
                    <Link href={`/cars/${id}/strip`} className={headingLink}><Icon name="checklist" className="h-4 w-4" />Add from list</Link>
                    {parts.length > 0 && <Link href={`/search?car=${id}`} className={`${headingLink} hidden sm:inline-flex`}><Icon name="search" className="h-4 w-4" />Find</Link>}
                    {canDelete && parts.length > 0 && <button type="button" onClick={() => setSelecting(true)} className={headingLink}><Icon name="check-circle" className="h-4 w-4" />Select</button>}
                  </>}
              </div>} />
              {parts.length
                ? <div className="space-y-3">{parts.map(p => <PartCard key={p.id} part={p} vehicle={vehicle} showVehicle={false}
                  selectable={selecting} selected={selection.ids.has(p.id)} onSelect={selection.toggle} />)}</div>
                : <div className="card"><EmptyState icon="box" title="No parts yet" description="Strip the car with the parts list, or add parts one at a time."
                  action={<div className="flex flex-wrap justify-center gap-3">
                    <ButtonLink href={`/cars/${id}/strip`}>Choose parts to strip</ButtonLink>
                    <ButtonLink href={`/add?car=${id}`} variant="secondary">Add one part</ButtonLink>
                  </div>} /></div>}
            </section>
          </div>

          <div className="min-w-0 space-y-5">
            {money && <section id="panel-money" role="tabpanel" aria-labelledby="tab-money" className={tab === "money" ? "" : "hidden xl:block"}>
              <SectionHeading title="Money" />
              <ProjectMoney vehicle={vehicle} money={money} stockValue={stockValue} onMessage={setMessage} />
            </section>}

            <section id="panel-checklist" role="tabpanel" aria-labelledby="tab-checklist" className={tab === "checklist" ? "" : "hidden xl:block"}>
              <SectionHeading title="Checklist" action={<span className="text-meta font-semibold tabular-nums text-secondary">{done}/{checklist.length}</span>} />
              <div className="card p-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                  <div className="h-full rounded-full bg-brand-navy transition-all duration-base ease-ios" style={{ width: `${checklist.length ? (done / checklist.length) * 100 : 0}%` }} />
                </div>
                {checklist.length
                  ? <ul className="mt-2 divide-y divide-separator">{checklist.map(t => {
                    const pending = t.id.startsWith(PENDING);
                    return <li key={t.id} className="flex items-center gap-2">
                      <label className="flex min-h-[52px] min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <CheckCircle checked={t.done} disabled={pending} onChange={() => save({ type: "toggle", id: t.id }, () => setTaskDone(t.id, !t.done))} />
                        <span className={`min-w-0 break-words text-body transition-colors ${t.done ? "text-tertiary line-through" : ""}`}>{t.name}</span>
                      </label>
                      <IconButton label={`Remove ${t.name}`} icon="close" variant="plain" disabled={pending} onClick={() => save({ type: "remove", id: t.id }, () => removeTask(t.id))} className="-mr-2" />
                    </li>;
                  })}</ul>
                  : <p className="py-6 text-center text-body text-secondary">No tasks yet</p>}
                {error && <InlineError className="mt-3">{error}</InlineError>}
                <form onSubmit={add} className="mt-3 flex gap-2">
                  <Input aria-label="New checklist item" placeholder="Add a task or part" maxLength={200} value={task} onChange={e => setTask(e.target.value)} />
                  <IconButton type="submit" label="Add checklist item" icon="plus" variant="dark" size="lg" disabled={!task.trim()} className="!h-control !w-control" />
                </form>
                {checklist.length > 0 && done === checklist.length && <p role="status" className="mt-3 flex items-center gap-1.5 text-meta font-medium text-success"><Icon name="check-circle" className="h-4 w-4" />All tasks done</p>}
              </div>
            </section>

            <section id="panel-details" role="tabpanel" aria-labelledby="tab-details" className={tab === "details" ? "" : "hidden xl:block"}>
              <SectionHeading title="Details" />
              <div className="space-y-4">
                {facts.length > 0 && <DetailList>{facts.map(([label, value]) => <DetailRow key={label} label={label} value={value} />)}</DetailList>}
                {vehicle.notes && <div className="card p-4">
                  <h3 className="text-meta font-semibold text-secondary">Notes</h3>
                  <p className="mt-1.5 whitespace-pre-line break-words text-body">{vehicle.notes}</p>
                </div>}
                <CarDocuments vehicleId={id} documents={documents} onMessage={setMessage} />
                {canDelete && <Button variant="danger" block onClick={() => { setDeleteSheet(n => n + 1); setDeleting(true); }}><Icon name="trash" />Delete project</Button>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>

    {selecting && <BulkDeleteBar parts={parts.filter(p => selection.ids.has(p.id))}
      allSelected={parts.length > 0 && parts.every(p => selection.ids.has(p.id))}
      onSelectAll={() => selection.set(parts.map(p => p.id))} onClear={selection.clear}
      onDeleted={text => { stopSelecting(); setMessage(text); }} />}

    {canDelete && <DeleteProjectSheet key={deleteSheet} vehicle={vehicle} photo={photo} documents={documents} parts={parts} tasks={tasks} money={money}
      open={deleting} onClose={() => setDeleting(false)} />}
  </>;
}

const PART_CHOICES = [
  { keep: false, title: "Delete them with the project", text: "They come back if you restore it." },
  { keep: true, title: "Keep them as unassigned stock", text: "They stay searchable and for sale." },
];

function DeleteProjectSheet({ vehicle, photo, documents, parts, tasks, money, open, onClose }: {
  vehicle: Vehicle;
  photo: SignedPhoto | null;
  documents: VehicleDocument[];
  parts: Part[];
  tasks: ProjectTask[];
  money: Money | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [keepParts, setKeepParts] = useState(false);
  const sales = money?.sales ?? [];
  const expenses = money?.expenses ?? [];
  // Parts with sales stay with the project either way; the rest follow the choice below.
  const soldIds = new Set(sales.map(sale => sale.partId));
  const unsold = parts.filter(part => !soldIds.has(part.id));
  const unsoldValue = unsold.reduce((sum, part) => sum + part.price * part.quantity, 0);
  const revenue = sales.reduce((sum, sale) => sum + sale.price * sale.quantity, 0);
  const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const stakes: Stake[] = [
    { icon: "box", label: keepParts ? "Parts moved to unassigned stock" : "Parts deleted with it", value: unsold.length },
    ...(!keepParts && unsoldValue > 0 ? [{ icon: "tag", label: "Their asking value", value: rands(unsoldValue) }] : []),
    ...(sales.length ? [{ icon: "check-circle", label: "Sales on record", value: `${plural(sales.length, "sale")} · ${rands(revenue)}` }] : []),
    ...(vehicle.purchasePrice > 0 ? [{ icon: "car", label: "Bought for", value: rands(vehicle.purchasePrice) }] : []),
    ...(expenses.length ? [{ icon: "receipt", label: "Expenses", value: `${expenses.length} · ${rands(spent)}` }] : []),
    { icon: "file", label: "Documents", value: documents.length },
    ...(photo ? [{ icon: "image", label: "Car photo", value: 1 }] : []),
    { icon: "checklist", label: "Checklist tasks", value: tasks.length },
  ];

  return <DeleteSheet open={open} onClose={onClose} title="Delete this project?" description={carName(vehicle)}
    name={`${vehicle.make} ${vehicle.model}`} stakes={stakes} confirmLabel="Delete project"
    onConfirm={async typed => {
      const result = await binVehicle(vehicle.id, typed, keepParts);
      if (!result.error) router.push("/cars?binned=project");
      return result;
    }}>
    {unsold.length > 0 && <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-ink">What happens to its {plural(unsold.length, "unsold part")}?</legend>
      <div className="space-y-2">{PART_CHOICES.map(choice => {
        const selected = keepParts === choice.keep;
        return <label key={choice.title} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition duration-fast ${selected ? "border-brand-navy/40 bg-brand-navy-tint/60" : "border-line hover:bg-subtle"}`}>
          <input type="radio" name="project-parts" checked={selected} onChange={() => setKeepParts(choice.keep)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-navy" />
          <span className="min-w-0">
            <span className="block text-body font-semibold">{choice.title}</span>
            <span className="block text-meta text-secondary">{choice.text}</span>
          </span>
        </label>;
      })}</div>
    </fieldset>}
    {sales.length > 0 && <p className="text-meta text-secondary">Sold parts stay with the project, so its sales figures come back if you restore it.</p>}
  </DeleteSheet>;
}
