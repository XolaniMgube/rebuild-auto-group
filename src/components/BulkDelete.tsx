"use client";

import { useState } from "react";
import { binParts } from "@/lib/actions";
import { plural, rands } from "@/lib/format";
import type { Part } from "@/lib/types";
import { DeleteSheet, type Stake } from "./DeleteSheet";
import { Icon } from "./Icon";
import { Button } from "./ui";

/** Which parts are ticked while several are being picked. */
export function useSelection() {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());
  return {
    ids,
    toggle(id: string) {
      setIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    set(next: string[]) {
      setIds(new Set(next));
    },
    clear() {
      setIds(new Set());
    },
  };
}

/** Bar across the bottom while picking parts, with the confirmation sheet. */
export function BulkDeleteBar({ parts, allSelected, onSelectAll, onClear, onDeleted }: {
  parts: Part[]; // the ticked parts
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onDeleted: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(0);
  const value = parts.reduce((sum, part) => sum + part.price, 0);
  const onHold = parts.filter(part => part.status === "reserved").length;
  const stakes: Stake[] = [
    { icon: "box", label: "Parts", value: parts.length },
    ...(value > 0 ? [{ icon: "tag", label: "Asking value", value: rands(value) }] : []),
    ...(onHold > 0 ? [{ icon: "clock", label: "On hold for someone", value: onHold }] : []),
  ];

  return <>
    <div className="bar-surface fixed inset-x-0 bottom-0 z-30 border-t border-line/60 lg:pl-sidebar">
      <div className="page flex items-center gap-2.5 py-3 pb-[calc(var(--nav-height)+28px)] lg:pb-3">
        <p role="status" className="min-w-0 flex-1 truncate text-body font-semibold tabular-nums">{plural(parts.length, "part")} selected</p>
        <Button variant="secondary" size="sm" onClick={allSelected ? onClear : onSelectAll}>{allSelected ? "Clear" : "Select all"}</Button>
        <Button variant="danger" size="sm" disabled={!parts.length} onClick={() => { setSheet(n => n + 1); setOpen(true); }}>
          <Icon name="trash" className="h-4 w-4" />Delete
        </Button>
      </div>
    </div>

    <DeleteSheet key={sheet} open={open} onClose={() => setOpen(false)} requireName={false}
      title={`Delete ${plural(parts.length, "part")}?`} stakes={stakes} confirmLabel={`Delete ${plural(parts.length, "part")}`}
      onConfirm={async () => {
        const result = await binParts(parts.map(part => part.id));
        if ("error" in result) return result;
        setOpen(false);
        onDeleted(binMessage(result));
        return {};
      }}>
      <ul className="max-h-40 space-y-1 overflow-y-auto rounded-2xl bg-subtle px-4 py-3 text-meta text-secondary">
        {parts.slice(0, 8).map(part => <li key={part.id} className="truncate">{part.name}</li>)}
        {parts.length > 8 && <li className="font-medium text-ink">and {parts.length - 8} more</li>}
      </ul>
    </DeleteSheet>
  </>;
}

function binMessage({ binned, kept }: { binned: number; kept: string[] }) {
  const moved = binned ? `${plural(binned, "part")} moved to Recently deleted` : "Nothing deleted";
  if (!kept.length) return moved;
  const names = kept.slice(0, 3).join(", ");
  return `${moved}. ${plural(kept.length, "part")} kept because of recorded sales: ${names}${kept.length > 3 ? "…" : ""}`;
}
