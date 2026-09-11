import Link from "next/link";
import { carName, rands } from "@/lib/format";
import type { Part, Vehicle } from "@/lib/types";
import { Icon } from "./Icon";
import { PartThumb } from "./PartThumb";
import { Badge, StatusBadge } from "./ui";

const DAY = 86_400_000;
const PILL = "inline-flex h-7 items-center gap-1 rounded-full pl-2 pr-2.5";

/** How long a part has been on the shelf, compactly: "Today", "4d", "3w", "2mo". */
function shelfAge(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days < 1) return "Today";
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

export function PartCard({ part, vehicle, showVehicle = true }: { part: Part; vehicle?: Vehicle | null; showVehicle?: boolean }) {
  return <Link href={`/parts/${part.id}`} className="card-link flex items-center gap-4 p-3 pr-4">
    <PartThumb image={part.images[0]?.thumbUrl} name={part.name} />
    <div className="min-w-0 flex-1 py-0.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-card">{part.name}</h3>
        {/* Relative to now, so the server and browser can differ by a day at midnight. */}
        <span suppressHydrationWarning className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-caption font-medium tabular-nums text-tertiary">
          <Icon name="clock" className="h-3.5 w-3.5" /><span className="sr-only">Added </span>{shelfAge(part.createdAt)}
        </span>
      </div>
      {showVehicle && <p className="mt-0.5 truncate text-meta text-secondary">{vehicle ? carName(vehicle) : "Unassigned"}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {part.price > 0
          ? <span className={`${PILL} bg-success-tint text-[14px] font-bold tabular-nums text-success`}><Icon name="tag" className="h-3.5 w-3.5" strokeWidth={2.2} />{rands(part.price)}</span>
          : <span className={`${PILL} bg-warning-tint text-caption font-semibold text-warning`}><Icon name="tag" className="h-3.5 w-3.5" strokeWidth={2.2} />Needs price</span>}
        {part.status === "reserved"
          ? <Badge tone="warning">On hold{part.heldBy ? ` · ${part.heldBy}` : ""}</Badge>
          : part.status !== "in_stock" && <StatusBadge status={part.status} />}
        {part.location && <span className="inline-flex min-w-0 items-center gap-1 text-meta text-secondary"><Icon name="pin" className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{part.location}</span></span>}
      </div>
    </div>
    <Icon name="chevron" className="h-4 w-4 shrink-0 text-tertiary" />
  </Link>;
}
