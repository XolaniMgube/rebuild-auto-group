import Link from "next/link";
import type { ReactNode } from "react";
import { carName, rands } from "@/lib/format";
import { partHref } from "@/lib/return-to";
import type { Part, Vehicle } from "@/lib/types";
import { Icon } from "./Icon";
import { PartThumb } from "./PartThumb";
import { Badge, StatusBadge } from "./ui";

const DAY = 86_400_000;

/** How long a part has been on the shelf, compactly: "Today", "4d ago", "3w ago", "2mo ago". */
function shelfAge(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days < 1) return "Today";
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function Status({ part }: { part: Part }) {
  if (part.status === "in_stock") return <Badge tone="success" dot>In stock</Badge>;
  if (part.status === "reserved") return <Badge tone="warning" dot>On hold{part.heldBy ? ` · ${part.heldBy}` : ""}</Badge>;
  return <StatusBadge status={part.status} />;
}

function Price({ part }: { part: Part }) {
  return part.price > 0
    ? <span className="whitespace-nowrap text-[17px] font-bold tabular-nums tracking-[-0.01em] text-success">{rands(part.price)}</span>
    : <span className="whitespace-nowrap text-meta font-semibold text-warning">Needs price</span>;
}

function Age({ part }: { part: Part }) {
  // Relative to now, so the server and browser can differ by a day at midnight.
  return <span suppressHydrationWarning className="inline-flex shrink-0 items-center gap-1 text-caption font-medium tabular-nums text-tertiary">
    <Icon name="clock" className="h-3.5 w-3.5" /><span className="sr-only">Added </span>{shelfAge(part.createdAt)}
  </span>;
}

/**
 * Opens the part, or ticks it while several are being picked for deletion.
 * "card" suits the grid; "row" is the denser list view on desktop.
 */
export function PartCard({ part, vehicle, showVehicle = true, from, layout = "card", selectable = false, selected = false, onSelect }: {
  part: Part;
  vehicle?: Vehicle | null;
  showVehicle?: boolean;
  from?: string; // the screen to return to
  layout?: "card" | "row";
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const where = [showVehicle ? (vehicle ? carName(vehicle) : "Unassigned") : null, part.location].filter(Boolean).join(" · ");

  const body: ReactNode = layout === "row"
    ? <>
      <PartThumb image={part.images[0]?.thumbUrl} name={part.name} className="h-12 w-12" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-body font-semibold">{part.name}</h3>
        {where && <p className="truncate text-meta text-secondary">{where}</p>}
      </div>
      <span className="hidden w-40 shrink-0 md:block"><Status part={part} /></span>
      <span className="hidden w-20 shrink-0 justify-end md:flex"><Age part={part} /></span>
      <span className="flex w-24 shrink-0 justify-end"><Price part={part} /></span>
    </>
    : <>
      <PartThumb image={part.images[0]?.thumbUrl} name={part.name} />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-card">{part.name}</h3>
          <span className="mt-0.5"><Age part={part} /></span>
        </div>
        {where && <p className="mt-0.5 truncate text-meta text-secondary">{where}</p>}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <Status part={part} />
          <Price part={part} />
        </div>
      </div>
    </>;

  const shape = layout === "row" ? "gap-4 px-3 py-2.5" : "gap-4 p-3";

  if (selectable) {
    return <button type="button" aria-pressed={selected} onClick={() => onSelect?.(part.id)}
      className={`card-link flex w-full items-center pr-4 text-left ${shape} ${selected ? "ring-2 ring-brand-navy" : ""}`}>
      <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] transition duration-fast ${selected ? "border-brand-navy bg-brand-navy text-white" : "border-tertiary/70 bg-surface text-transparent"}`}>
        <Icon name="check" className="h-3.5 w-3.5" />
      </span>
      {body}
    </button>;
  }

  return <Link href={partHref(part.id, from)} className={`card-link flex items-center pr-4 ${shape}`}>
    {body}
    <Icon name="chevron" className="h-4 w-4 shrink-0 text-tertiary" />
  </Link>;
}
