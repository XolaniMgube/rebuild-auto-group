"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { BIN_DAYS } from "@/lib/types";
import { Icon } from "./Icon";
import { Button, InlineError, Input, Sheet } from "./ui";

export type Stake = { icon: string; label: string; value: ReactNode };

const tidy = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * A deliberate delete: lists what goes with the item before it happens. With
 * `requireName` it also asks for the item's name, which projects use because
 * one project takes a lot with it. Give it a fresh key each time it opens.
 */
export function DeleteSheet({ open, onClose, title, description, name = "", stakes, children, blocked, forever = false, requireName = true, confirmLabel, onConfirm }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  name?: string;
  stakes: Stake[];
  children?: ReactNode;
  blocked?: string | null;
  forever?: boolean;
  requireName?: boolean;
  confirmLabel: string;
  onConfirm: (typed: string) => Promise<{ error?: string }>;
}) {
  const formId = useId();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();
  const matches = tidy(typed) !== "" && tidy(typed) === tidy(name);
  const ready = !requireName || matches;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || blocked || pending) return;
    setError(null);
    startPending(async () => {
      const result = await onConfirm(typed);
      if (result.error) setError(result.error);
    });
  }

  return <Sheet open={open} onClose={onClose} title={title} description={description}
    footer={blocked
      ? <Button variant="secondary" block className="sm:w-auto" onClick={onClose}>Close</Button>
      : <>
        <Button variant="secondary" block className="sm:w-auto" disabled={pending} onClick={onClose}>Cancel</Button>
        <Button type="submit" form={formId} block className="sm:w-auto" disabled={!ready} loading={pending}><Icon name="trash" />{confirmLabel}</Button>
      </>}>
    <form id={formId} onSubmit={submit} className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-brand-red/15">
        <p className="flex items-center gap-2 bg-brand-red-tint px-4 py-2.5 text-meta font-semibold text-brand-red">
          <Icon name="alert" className="h-4 w-4" />What&apos;s at stake
        </p>
        <ul className="divide-y divide-separator">{stakes.map(stake => <li key={stake.label} className="flex items-center gap-3 px-4 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-subtle text-secondary"><Icon name={stake.icon} className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0 flex-1 text-body text-secondary">{stake.label}</span>
          <span className="shrink-0 text-right text-body font-semibold tabular-nums">{stake.value}</span>
        </li>)}</ul>
      </div>

      {children}

      {blocked
        ? <p role="alert" className="flex gap-2.5 rounded-2xl bg-warning-tint px-4 py-3 text-meta text-warning"><Icon name="alert" className="mt-px h-4 w-4 shrink-0" />{blocked}</p>
        : <>
          <p className={`flex items-center gap-2 text-meta ${forever ? "font-semibold text-brand-red" : "text-secondary"}`}>
            <Icon name={forever ? "alert" : "undo"} className="h-4 w-4 shrink-0" />
            {forever ? "This can't be undone." : `Restorable from Recently deleted for ${BIN_DAYS} days.`}
          </p>
          {requireName && <>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold text-ink">
                Type <span className="rounded-md bg-subtle px-1.5 py-0.5 font-bold">{name}</span> to confirm
              </span>
              <Input value={typed} onChange={e => { setTyped(e.target.value); setError(null); }} disabled={pending}
                autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="done" />
            </label>
            {matches && <p className="flex items-center gap-1.5 text-meta font-medium text-success"><Icon name="check-circle" className="h-4 w-4" />Name matches</p>}
          </>}
        </>}

      {error && <InlineError>{error}</InlineError>}
    </form>
  </Sheet>;
}
