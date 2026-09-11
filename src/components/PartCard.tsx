import Link from "next/link";
import { carName, rands } from "@/lib/format";
import type { Part, Vehicle } from "@/lib/types";
import { Icon } from "./Icon";
import { PartThumb } from "./PartThumb";
import { ConditionBadge, StatusBadge } from "./ui";

export function PartCard({ part, vehicle, showVehicle = true }: { part: Part; vehicle?: Vehicle | null; showVehicle?: boolean }) {
  return <Link href={`/parts/${part.id}`} className="card-link flex items-center gap-4 p-3 pr-4">
    <PartThumb image={part.images[0]?.thumbUrl} name={part.name} />
    <div className="min-w-0 flex-1 py-0.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-card">{part.name}</h3>
        {part.price > 0 && <span className="shrink-0 text-card tabular-nums">{rands(part.price)}</span>}
      </div>
      {showVehicle && <p className="mt-0.5 truncate text-meta text-secondary">{vehicle ? carName(vehicle) : "Unassigned"}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <ConditionBadge condition={part.condition} />
        {part.status !== "in_stock" && <StatusBadge status={part.status} />}
        {part.location && <span className="inline-flex min-w-0 items-center gap-1 text-meta text-secondary"><Icon name="pin" className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{part.location}</span></span>}
        {part.quantity > 1 && <span className="text-meta font-medium tabular-nums text-secondary">×{part.quantity}</span>}
      </div>
    </div>
    <Icon name="chevron" className="h-4 w-4 shrink-0 text-tertiary" />
  </Link>;
}
