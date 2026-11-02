"use client";

import { useState, useTransition } from "react";
import { parseRands, todayIso } from "@/lib/format";
import type { Owner } from "@/lib/types";
import { Icon } from "./Icon";
import { useSession } from "./Session";
import { Button, Field, InlineError, Input, MoneyInput, Select } from "./ui";

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
