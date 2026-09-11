"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { FormFooter, NavBar } from "@/components/Shell";
import { Badge, Button, CheckCircle, EmptyState, IconButton, InlineError, Input, MoneyInput, Notice, SearchBar } from "@/components/ui";
import { createPartsFromTemplate } from "@/lib/actions";
import { carName, parseRands, plural, rands } from "@/lib/format";
import { STRIP_TEMPLATE } from "@/lib/strip-template";
import type { Vehicle } from "@/lib/types";

const TEMPLATE_PARTS = STRIP_TEMPLATE.flatMap(group => group.parts);
const tidy = (name: string) => name.trim().replace(/\s+/g, " ");
const key = (name: string) => tidy(name).toLowerCase();

/** Ticked list of typical parts: untick what the car doesn't have, price what's left, add them all at once. */
export function StripPicker({ vehicle, existing, notice }: { vehicle: Vehicle; existing: string[]; notice: string }) {
  const router = useRouter();
  const [onCar] = useState(() => new Set(existing.map(key)));
  const [extra, setExtra] = useState<string[]>([]);
  const [selected, setSelected] = useState(() => new Set(TEMPLATE_PARTS.filter(name => !onCar.has(key(name)))));
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState(notice);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const groups = [...STRIP_TEMPLATE, ...(extra.length ? [{ group: "Your additions", parts: extra }] : [])];
  const everything = groups.flatMap(group => group.parts);
  const chosen = everything.filter(name => selected.has(name));
  const askingTotal = chosen.reduce((sum, name) => sum + (parseRands(prices[name] ?? "") || 0), 0);
  const query = key(filter);
  const visible = groups
    .map(group => ({ ...group, shown: group.parts.filter(name => !query || key(name).includes(query)) }))
    .filter(group => group.shown.length);

  function setMany(names: string[], on: boolean) {
    setError(null);
    setSelected(prev => {
      const next = new Set(prev);
      for (const name of names) {
        if (on) next.add(name);
        else next.delete(name);
      }
      return next;
    });
  }

  function addName(raw: string) {
    const name = tidy(raw);
    if (!name) return;
    if (name.length > 120) { setError("Part names must be 120 characters or fewer."); return; }
    const listed = everything.find(existingName => key(existingName) === key(name));
    if (onCar.has(key(name))) { setError(`${listed ?? name} is already on this car.`); return; }
    if (listed) setMany([listed], true);
    else {
      setExtra(prev => [...prev, name]);
      setMany([name], true);
    }
    setCustom("");
    setFilter("");
  }

  function submit() {
    if (!chosen.length || saving) return;
    const rows: { name: string; price: number | null }[] = [];
    for (const name of chosen) {
      const price = parseRands(prices[name] ?? "");
      if (Number.isNaN(price)) {
        setFilter("");
        setError(`Check the price for ${name}.`);
        document.getElementById(`price-${everything.indexOf(name)}`)?.focus();
        return;
      }
      rows.push({ name, price });
    }
    setError(null);
    startSaving(async () => {
      const result = await createPartsFromTemplate(vehicle.id, rows);
      if ("error" in result) { setError(result.error); return; }
      router.push(`/cars/${vehicle.id}?added=${result.count}`);
    });
  }

  return <>
    <NavBar back={{ href: `/cars/${vehicle.id}`, label: "Cancel" }} title="Choose parts" />
    <main className="page pb-6 pt-4 lg:pt-6">
      <div className="space-y-4">
        {message && <Notice onDismiss={() => setMessage("")}>{message}</Notice>}

        <section className="px-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand-navy">Strip for parts</p>
          <h1 className="mt-1 break-words text-title">{carName(vehicle)}</h1>
          <p className="mt-1 text-body text-secondary">Untick what this car doesn&apos;t have. Prices can go in now or later.</p>
        </section>

        <div className="bar-canvas sticky z-10 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10" style={{ top: "calc(56px + env(safe-area-inset-top))" }}>
          <SearchBar label="Filter parts" value={filter} onChange={setFilter} placeholder="Filter parts" />
        </div>

        {visible.length
          ? <div className="gap-5 xl:columns-2">{visible.map(({ group, parts, shown }) => {
            const open = parts.filter(name => !onCar.has(key(name)));
            const count = open.filter(name => selected.has(name)).length;
            const all = open.length > 0 && count === open.length;
            return <section key={group} aria-label={group} className="card mb-4 break-inside-avoid overflow-hidden xl:mb-5">
              <div className="flex min-h-[60px] items-center gap-3 border-b border-separator px-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-card">{group}</h2>
                  <p className="text-caption tabular-nums text-secondary">{open.length ? `${count} of ${open.length} selected` : "All added"}</p>
                </div>
                {open.length > 0 && !query && <button type="button" disabled={saving} onClick={() => setMany(open, !all)}
                  className="-mr-2 min-h-11 shrink-0 rounded-xl px-2 text-[15px] font-semibold text-brand-navy transition hover:bg-brand-navy-tint disabled:opacity-50">
                  {all ? "Clear" : "Select all"}
                </button>}
              </div>
              <ul className="divide-y divide-separator">{shown.map(name => {
                const added = onCar.has(key(name));
                const on = selected.has(name);
                const invalid = on && Number.isNaN(parseRands(prices[name] ?? ""));
                return <li key={name} className="flex min-h-14 items-center gap-3 px-4 py-1.5">
                  {added
                    ? <span className="flex min-h-11 min-w-0 flex-1 items-center gap-3">
                      <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-tint text-success"><Icon name="check" className="h-3.5 w-3.5" /></span>
                      <span className="min-w-0 break-words text-body text-secondary">{name}</span>
                    </span>
                    : <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <CheckCircle checked={on} disabled={saving} onChange={e => setMany([name], e.target.checked)} />
                      <span className={`min-w-0 break-words text-body transition-colors ${on ? "text-ink" : "text-secondary"}`}>{name}</span>
                    </label>}
                  {added
                    ? <Badge tone="success">Added</Badge>
                    : <MoneyInput compact id={`price-${everything.indexOf(name)}`} aria-label={`Price for ${name}`} aria-invalid={invalid || undefined}
                      placeholder="Price" disabled={!on || saving} value={on ? prices[name] ?? "" : ""}
                      onChange={e => { const value = e.target.value; setError(null); setPrices(prev => ({ ...prev, [name]: value })); }}
                      className="w-[112px] shrink-0" />}
                </li>;
              })}</ul>
            </section>;
          })}</div>
          : <div className="card"><EmptyState icon="search" title="Not on the list" description={`Add “${tidy(filter)}” as its own part.`}
            action={<Button variant="secondary" onClick={() => addName(filter)}><Icon name="plus" />Add to list</Button>} /></div>}

        <form onSubmit={e => { e.preventDefault(); addName(custom); }} className="card p-4">
          <h2 className="text-card">Add another part</h2>
          <div className="mt-3 flex gap-2">
            <Input aria-label="Part name" placeholder="e.g. Tow bar" maxLength={120} value={custom} onChange={e => { setCustom(e.target.value); setError(null); }} />
            <IconButton type="submit" label="Add part to list" icon="plus" variant="dark" size="lg" disabled={!custom.trim() || saving} className="!h-control !w-control" />
          </div>
        </form>
      </div>
    </main>
    <FormFooter>
      {error && <InlineError>{error}</InlineError>}
      <div className="flex items-center justify-between gap-3 text-meta tabular-nums">
        <span className="text-secondary">{plural(chosen.length, "part")} selected</span>
        {askingTotal > 0 && <span className="font-semibold text-ink">Asking {rands(askingTotal)}</span>}
      </div>
      <Button block loading={saving} disabled={!chosen.length} onClick={submit}>
        {saving ? "Adding parts…" : chosen.length ? `Add ${plural(chosen.length, "part")}` : "Choose parts to add"}
      </Button>
    </FormFooter>
  </>;
}
