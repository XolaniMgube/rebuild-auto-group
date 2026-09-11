"use client";

import { useState, type ReactNode } from "react";
import { DeleteSheet, type Stake } from "@/components/DeleteSheet";
import { Icon } from "@/components/Icon";
import { PartThumb } from "@/components/PartThumb";
import { PageHeader } from "@/components/Shell";
import { Badge, Button, EmptyState, Notice, SectionHeading } from "@/components/ui";
import { deletePartForever, deleteVehicleForever, restorePart, restoreVehicle } from "@/lib/actions";
import { carName, plural, rands, timeAgo } from "@/lib/format";
import { BIN_DAYS, type BinnedPart, type BinnedProject } from "@/lib/types";

const DAY = 86_400_000;

type Item = { kind: "project"; project: BinnedProject } | { kind: "part"; part: BinnedPart };

const itemId = (item: Item) => (item.kind === "project" ? item.project.id : item.part.id);
const itemName = (item: Item) => (item.kind === "project" ? `${item.project.make} ${item.project.model}` : item.part.name);

function daysLeft(deletedAt: string) {
  return Math.max(0, Math.ceil((new Date(deletedAt).getTime() + BIN_DAYS * DAY - Date.now()) / DAY));
}

function foreverStakes(item: Item): Stake[] {
  if (item.kind === "project") {
    const { project } = item;
    return [
      { icon: "box", label: "Parts deleted with it", value: project.partCount },
      { icon: "file", label: "Documents", value: project.documentCount },
      ...(project.photo ? [{ icon: "image", label: "Car photo", value: 1 }] : []),
      { icon: "receipt", label: "Checklist and expenses", value: "Deleted too" },
    ];
  }
  const { part } = item;
  return [
    { icon: "tag", label: "Asking price", value: part.price > 0 ? rands(part.price * part.quantity) : "Not priced" },
    { icon: "image", label: "Photos", value: part.photoCount },
    { icon: "car", label: "Project", value: part.car ? carName(part.car) : "Unassigned" },
  ];
}

export function RecentlyDeleted({ projects, parts }: { projects: BinnedProject[]; parts: BinnedPart[] }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [purging, setPurging] = useState<Item | null>(null);
  const total = projects.length + parts.length;

  async function restore(item: Item) {
    setError(null);
    setMessage("");
    setRestoring(itemId(item));
    const result = item.kind === "project" ? await restoreVehicle(item.project.id) : await restorePart(item.part.id);
    setRestoring(null);
    if (result.error) setError(result.error);
    else setMessage(`${itemName(item)} restored`);
  }

  return <>
    <PageHeader eyebrow="Owners" title="Recently deleted" count={total}
      description={`Deleted parts and projects wait here for ${BIN_DAYS} days, then they're removed for good.`} />
    <main className="page page-bottom space-y-6 pt-5 lg:pt-8">
      {message && <Notice onDismiss={() => setMessage("")}>{message}</Notice>}
      {error && <Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice>}

      {total === 0 && <div className="card">
        <EmptyState icon="trash" title="Nothing deleted" description={`Parts and projects you delete show up here for ${BIN_DAYS} days.`} />
      </div>}

      {projects.length > 0 && <section>
        <SectionHeading title="Projects" count={projects.length} />
        <ul className="grid gap-3 lg:grid-cols-2">{projects.map(project => {
          const item: Item = { kind: "project", project };
          return <BinRow key={project.id} title={carName(project)}
            thumb={project.photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={project.photo} alt="" className="h-14 w-14 shrink-0 rounded-thumb bg-subtle object-cover" />
              : <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-thumb bg-subtle text-tertiary"><Icon name="car" className="h-6 w-6" /></span>}
            detail={project.partCount ? `${plural(project.partCount, "part")} deleted with it` : "No parts deleted with it"}
            deletedAt={project.deletedAt} deletedBy={project.deletedBy}
            restoring={restoring === project.id} onRestore={() => restore(item)} onDelete={() => setPurging(item)} />;
        })}</ul>
      </section>}

      {parts.length > 0 && <section>
        <SectionHeading title="Parts" count={parts.length} />
        <ul className="grid gap-3 lg:grid-cols-2">{parts.map(part => {
          const item: Item = { kind: "part", part };
          return <BinRow key={part.id} title={part.name}
            thumb={<PartThumb image={part.photo} name={part.name} className="h-14 w-14" />}
            detail={[part.car ? carName(part.car) : "Unassigned", part.price > 0 ? rands(part.price) : null].filter(Boolean).join(" · ")}
            deletedAt={part.deletedAt} deletedBy={part.deletedBy}
            blocked={part.carInBin ? "Restore its project first" : null}
            restoring={restoring === part.id} onRestore={() => restore(item)} onDelete={() => setPurging(item)} />;
        })}</ul>
      </section>}
    </main>

    {purging && <DeleteSheet key={itemId(purging)} open forever onClose={() => setPurging(null)}
      title={purging.kind === "project" ? "Delete project for good?" : "Delete part for good?"}
      description={itemName(purging)} name={itemName(purging)} stakes={foreverStakes(purging)} confirmLabel="Delete for good"
      onConfirm={async typed => {
        const target = purging;
        const result = target.kind === "project"
          ? await deleteVehicleForever(target.project.id, typed)
          : await deletePartForever(target.part.id, typed);
        if (!result.error) {
          setPurging(null);
          setMessage(`${itemName(target)} deleted for good`);
        }
        return result;
      }} />}
  </>;
}

function BinRow({ thumb, title, detail, deletedAt, deletedBy, blocked = null, restoring, onRestore, onDelete }: {
  thumb: ReactNode;
  title: string;
  detail: string;
  deletedAt: string;
  deletedBy: string | null;
  blocked?: string | null;
  restoring: boolean;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const left = daysLeft(deletedAt);
  return <li className="card flex flex-col p-3">
    <div className="flex items-center gap-3.5">
      {thumb}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-card">{title}</h3>
          <Badge tone={left <= 7 ? "warning" : "neutral"} className="shrink-0">
            <Icon name="clock" className="h-3.5 w-3.5" /><span suppressHydrationWarning>{left <= 1 ? "Last day" : `${left} days left`}</span>
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-meta text-secondary">{detail}</p>
        <p suppressHydrationWarning className="mt-0.5 truncate text-caption text-tertiary">
          Deleted {timeAgo(deletedAt).toLowerCase()}{deletedBy ? ` by ${deletedBy}` : ""}
        </p>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-separator pt-3">
      {blocked && <p className="mr-auto flex items-center gap-1.5 text-meta text-warning"><Icon name="alert" className="h-4 w-4 shrink-0" />{blocked}</p>}
      <Button variant="secondary" size="sm" loading={restoring} disabled={Boolean(blocked)} onClick={onRestore}><Icon name="undo" className="h-4 w-4" />Restore</Button>
      <Button variant="danger" size="sm" onClick={onDelete}><Icon name="trash" className="h-4 w-4" />Delete now</Button>
    </div>
  </li>;
}
