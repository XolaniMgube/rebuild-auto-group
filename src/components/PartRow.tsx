"use client";

import Link from "next/link";
import { PartThumb } from "./PartThumb";
import { ConditionPill, StatusPill } from "./ui";
import { carName } from "@/lib/format";
import type { Part, Vehicle } from "@/lib/types";

// The single most important component in the app. It has to answer
// what it is, its car project, condition, and its location.

export function PartRow({
  part,
  vehicle,
  href,
  selected = false,
  trailing,
}: {
  part: Part;
  vehicle?: Vehicle | null;
  href?: string;
  selected?: boolean;
  trailing?: React.ReactNode;
}) {
  const inner = (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-hairline transition
        ${selected ? "bg-brand-blueTint" : "bg-white hover:bg-paper"}`}
    >
      <PartThumb id={part.id} image={part.images[0]} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-narrow font-bold text-base leading-tight line-clamp-2">
            {part.name}
          </span>
          <span className="ml-auto font-narrow font-bold text-[15.5px] shrink-0">
            →
          </span>
        </div>
        <div className="text-[12.5px] text-slate font-medium mt-0.5 truncate">
          {vehicle ? carName(vehicle) : "Unassigned"}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
          {part.status === "IN_STOCK" ? (
            <ConditionPill condition={part.condition} />
          ) : (
            <StatusPill status={part.status} />
          )}
          {part.location && (
            <span className="text-xs font-medium text-slate break-words">
              {part.location}
            </span>
          )}
          {part.quantity > 1 && (
            <span className="text-xs font-medium text-slate break-words">
              {part.quantity} available
            </span>
          )}
        </div>
      </div>
      {trailing}
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blueTint">
      {inner}
    </Link>
  );
}
