"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { parseRands, rands, todayIso } from "@/lib/format";
import type { Owner } from "@/lib/types";
import { Icon } from "./Icon";
import { useSession } from "./Session";
import { Button, Field, InlineError, Input, MoneyInput, Select, Sheet } from "./ui";

export type MoneyEntry<T extends string> = { kind: T; amount: number; note: string; on: string; person: string | null };

/** One of the owners: who paid, or who is holding the money. */
export function OwnerSelect({ owners, value, onChange, label }: { owners: Owner[]; value: string; onChange: (id: string) => void; label: string }) {
  return <Select aria-label={label} icon="pin" value={value} onChange={e => onChange(e.target.value)}>
    {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
  </Select>;
}

/** The signed-in owner, else the first owner: a sensible "who" for a new entry. */
export function useDefaultOwner(owners: Owner[]) {
  const me = useSession().id;
  return owners.some(owner => owner.id === me) ? me : owners[0]?.id ?? "";
}

/**
 * Adds a money line: what it was, how much, on which day, and which owner
 * paid or received it. Used for car expenses, car income and running costs.
 */
export function MoneyEntryForm<T extends string>({ options, owners, personLabel, submitLabel, onSave, onSaved }: {
  options: { value: T; label: string }[];
  owners: Owner[];
  personLabel: string; // "Paid by" or "Received by"
  submitLabel: string;
  onSave: (entry: MoneyEntry<T>) => Promise<{ error?: string }>;
  onSaved?: (entry: MoneyEntry<T>) => void;
}) {
  const [kind, setKind] = useState<T>(options[0].value);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [on, setOn] = useState(todayIso());
  const [person, setPerson] = useState(useDefaultOwner(owners));
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseRands(amount);
    if (value === null || Number.isNaN(value) || value <= 0) { setError("Enter the amount in rands, e.g. 1500."); return; }
    if (!on || on > todayIso()) { setError("Choose a date that isn't in the future."); return; }
    setError(null);
    const entry = { kind, amount: value, note, on, person: person || null };
    startSaving(async () => {
      const result = await onSave(entry);
      // Updates after an await need their own transition, or React can hold back the refreshed page.
      startSaving(() => {
        if (result.error) { setError(result.error); return; }
        setAmount("");
        setNote("");
        onSaved?.(entry);
      });
    });
  }

  return <form onSubmit={submit} className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <Select aria-label="What it was for" value={kind} onChange={e => setKind(e.target.value as T)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      <MoneyInput aria-label="Amount" placeholder="Amount" value={amount} onChange={e => { setAmount(e.target.value); setError(null); }} />
    </div>
    <div className={`grid gap-3 ${owners.length ? "grid-cols-2" : ""}`}>
      <Field label="Date" className="[&>span]:sr-only"><Input type="date" value={on} max={todayIso()} onChange={e => setOn(e.target.value)} /></Field>
      {owners.length > 0 && <Field label={personLabel} className="[&>span]:sr-only"><OwnerSelect owners={owners} value={person} onChange={setPerson} label={personLabel} /></Field>}
    </div>
    <Input aria-label="Note" placeholder="Note (optional)" maxLength={120} value={note} onChange={e => setNote(e.target.value)} />
    {error && <InlineError>{error}</InlineError>}
    <Button type="submit" variant="secondary" block loading={saving}><Icon name="plus" />{submitLabel}</Button>
  </form>;
}

/** A titled list of money lines with an add form underneath. */
export function MoneyCard({ title, amount, empty, rows, children }: {
  title: string;
  amount: number;
  empty: string;
  rows: { id: string; title: string; meta: string; amount: number; action: ReactNode }[];
  children: ReactNode;
}) {
  return <div className="card">
    <div className="flex items-center justify-between gap-3 px-4 pt-4">
      <h3 className="text-card">{title}</h3>
      <span className="text-meta tabular-nums text-secondary">{rands(amount)}</span>
    </div>
    {rows.length > 0
      ? <ul className="mt-2 divide-y divide-separator">{rows.map(row => <li key={row.id} className="flex items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium">{row.title}</p>
          <p className="truncate text-meta text-secondary">{row.meta}</p>
        </div>
        <span className="shrink-0 text-body font-semibold tabular-nums">{rands(row.amount)}</span>
        {row.action}
      </li>)}</ul>
      : <p className="px-4 pt-1 text-meta text-secondary">{empty}</p>}
    <div className="mt-3 border-t border-separator p-4">{children}</div>
  </div>;
}

export type Purchase = { amount: number; on: string; paidBy: string | null };

/** What was paid for a car or a part, on which day and by whom. Leaving the price empty clears it. */
export function PurchaseSheet({ description, label, initial, owners, open, onClose, onSave, onSaved }: {
  description: string;
  label: string; // "Purchase price"
  initial: Purchase | null;
  owners: Owner[];
  open: boolean;
  onClose: () => void;
  onSave: (purchase: Purchase) => Promise<{ error?: string }>;
  onSaved: () => void;
}) {
  const formId = useId();
  const fallbackOwner = useDefaultOwner(owners);
  const [value, setValue] = useState(initial && initial.amount > 0 ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.on || todayIso());
  const [paidBy, setPaidBy] = useState(initial?.paidBy && owners.some(o => o.id === initial.paidBy) ? initial.paidBy : fallbackOwner);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseRands(value);
    if (Number.isNaN(amount)) { setError("Enter the price in rands, e.g. 2000."); return; }
    if (!date || date > todayIso()) { setError("Choose a date that isn't in the future."); return; }
    setError(null);
    startSaving(async () => {
      const result = await onSave({ amount: amount ?? 0, on: date, paidBy: paidBy || null });
      startSaving(() => {
        if (result.error) setError(result.error);
        else onSaved();
      });
    });
  }

  return <Sheet open={open} onClose={onClose} title="Bought for" description={description}
    footer={<>
      <Button variant="secondary" block className="sm:w-auto" onClick={onClose}>Cancel</Button>
      <Button type="submit" form={formId} block className="sm:w-auto" loading={saving}>Save</Button>
    </>}>
    <form id={formId} onSubmit={submit} className="space-y-4">
      <Field label={label}><MoneyInput value={value} onChange={e => { setValue(e.target.value); setError(null); }} placeholder="0" /></Field>
      <div className={`grid gap-3 ${owners.length ? "grid-cols-2" : ""}`}>
        <Field label="Bought on"><Input type="date" value={date} max={todayIso()} onChange={e => setDate(e.target.value)} /></Field>
        {owners.length > 0 && <Field label="Paid by"><OwnerSelect owners={owners} value={paidBy} onChange={setPaidBy} label="Paid by" /></Field>}
      </div>
      {error && <InlineError>{error}</InlineError>}
    </form>
  </Sheet>;
}
