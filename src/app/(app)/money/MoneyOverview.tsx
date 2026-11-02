"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { MoneyEntryForm, OwnerSelect } from "@/components/MoneyEntry";
import { PageHeader } from "@/components/Shell";
import {
  Button, ChipGroup, DetailList, DetailRow, Field, IconButton, InlineError, Input, MoneyInput, Notice, SectionHeading, Sheet, Spinner, StatTiles, useConfirm,
} from "@/components/ui";
import { addOverhead, recordTransfer, removeOverhead, removeTransfer } from "@/lib/actions";
import { parseRands, rands, shortDate, todayIso } from "@/lib/format";
import { PERIODS, type MoneyData, type Period, type Settlement, type summarise } from "@/lib/money";
import { OVERHEAD_LABEL, OVERHEAD_OPTIONS, type Owner } from "@/lib/types";

type Summary = ReturnType<typeof summarise>;

const signed = (value: number) => (value < 0 ? `−${rands(-value)}` : rands(value));

export function MoneyOverview({ period, summary, owners, transfers }: {
  period: Period;
  summary: Summary;
  owners: Owner[];
  transfers: MoneyData["transfers"];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [switching, startSwitching] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [paying, setPaying] = useState<Settlement | null>(null);
  const [sheet, setSheet] = useState(0);
  const nameOf = (id: string | null) => owners.find(o => o.id === id)?.name ?? "Someone";
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? "";

  async function drop(id: string, ask: { title: string; message: string }, action: () => Promise<{ error?: string }>, done: string) {
    if (!(await confirm({ ...ask, confirmLabel: "Remove" }))) return;
    setError(null);
    setBusy(id);
    const result = await action();
    setBusy(null);
    if (result.error) setError(result.error);
    else setMessage(done);
  }

  return <>
    <PageHeader eyebrow="Owners" title="Money" description="Profit across every car, running costs, and who owes whom." />

    <main className="page page-bottom space-y-6 pt-2">
      {message && <Notice onDismiss={() => setMessage("")}>{message}</Notice>}
      {error && <Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice>}

      <div className="flex items-center gap-3">
        <ChipGroup label="Period" options={PERIODS} value={period}
          onChange={next => startSwitching(() => router.replace(next === "month" ? "/money" : `/money?period=${next}`, { scroll: false }))} />
        {switching && <Spinner className="h-4 w-4 shrink-0" />}
      </div>

      <StatTiles items={[
        { label: "Money in", value: rands(summary.moneyIn), tone: "success", icon: "tag" },
        { label: "Money out", value: rands(summary.moneyOut), tone: "warning", icon: "receipt" },
        { label: "Profit", value: signed(summary.profit), tone: "navy", icon: "boxes" },
      ]} />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <section>
          <SectionHeading title={periodLabel} note="where it came from and went" />
          <DetailList>
            <DetailRow label="Parts sold" value={rands(summary.sales)} />
            <DetailRow label="Scrap & other income" value={rands(summary.income)} />
            <DetailRow label="Cars bought" value={signed(-summary.carsBought)} />
            <DetailRow label="Car expenses" value={signed(-summary.carExpenses)} />
            <DetailRow label="Running costs" value={signed(-summary.overheads)} />
            <DetailRow label="Profit" value={<span className={`font-bold ${summary.profit >= 0 ? "text-success" : "text-brand-red"}`}>{signed(summary.profit)}</span>} />
          </DetailList>
        </section>

        {owners.length > 1 && <section>
          <SectionHeading title={owners.map(o => o.name).join(" & ")} note="all time, split equally" />
          <div className="card overflow-hidden">
            <div className="p-4 sm:p-5">
              {summary.settlements.length
                ? summary.settlements.map(s => <div key={`${s.from.id}-${s.to.id}`} className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-body"><span className="font-semibold">{s.from.name}</span> owes <span className="font-semibold">{s.to.name}</span>
                    <span className="mt-1 block text-[28px] font-bold leading-none tracking-[-0.03em] tabular-nums">{rands(s.amount)}</span>
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => { setSheet(n => n + 1); setPaying(s); }}>Record payment</Button>
                </div>)
                : <p className="flex items-center gap-2 text-body font-semibold text-success"><Icon name="check-circle" className="h-5 w-5" />You&apos;re level</p>}
            </div>
            <ul className="divide-y divide-separator border-t border-separator">{summary.balances.map(b => <li key={b.owner.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
              <span className="text-body font-medium">{b.owner.name}</span>
              <span className="text-meta tabular-nums text-secondary">Paid {rands(b.paidOut)} · Took in {rands(b.tookIn)}</span>
            </li>)}</ul>
            {summary.unassigned > 0 && <p className="border-t border-separator bg-subtle/60 px-4 py-2.5 text-meta text-secondary sm:px-5">
              {rands(summary.unassigned)} isn&apos;t linked to an owner (such as staff sales), so it&apos;s left out of the split.
            </p>}
          </div>
          {transfers.length > 0 && <ul className="card mt-3 divide-y divide-separator">{transfers.map(t => <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium">{nameOf(t.from)} paid {nameOf(t.to)}</p>
              <p className="truncate text-meta text-secondary">{[shortDate(t.on), t.note].filter(Boolean).join(" · ")}</p>
            </div>
            <span className="shrink-0 text-body font-semibold tabular-nums">{rands(t.amount)}</span>
            {busy === t.id
              ? <span className="grid h-11 w-11 place-items-center"><Spinner /></span>
              : <IconButton label={`Remove payment of ${rands(t.amount)}`} icon="close" variant="plain" className="-mr-2"
                onClick={() => drop(t.id, { title: "Remove this payment?", message: `${rands(t.amount)} from ${nameOf(t.from)} to ${nameOf(t.to)} comes off the balance.` }, () => removeTransfer(t.id), "Payment removed")} />}
          </li>)}</ul>}
        </section>}

        <section>
          <SectionHeading title="Running costs" note={`${periodLabel.toLowerCase()} · ${rands(summary.overheads)}`} />
          <div className="card">
            {summary.overheadRows.length > 0
              ? <ul className="divide-y divide-separator">{summary.overheadRows.map(row => <li key={row.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{row.description || OVERHEAD_LABEL[row.category]}</p>
                  <p className="truncate text-meta text-secondary">{[row.description && OVERHEAD_LABEL[row.category], shortDate(row.on), row.paidBy && `paid by ${nameOf(row.paidBy)}`].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="shrink-0 text-body font-semibold tabular-nums">{rands(row.amount)}</span>
                {busy === row.id
                  ? <span className="grid h-11 w-11 place-items-center"><Spinner /></span>
                  : <IconButton label={`Remove ${OVERHEAD_LABEL[row.category]} of ${rands(row.amount)}`} icon="close" variant="plain" className="-mr-2"
                    onClick={() => drop(row.id, { title: `Remove ${OVERHEAD_LABEL[row.category].toLowerCase()}?`, message: `${rands(row.amount)} comes off the running costs.` }, () => removeOverhead(row.id), "Cost removed")} />}
              </li>)}</ul>
              : <p className="px-4 pt-4 text-meta text-secondary">Rent, fuel, tools, adverts: costs that belong to no one car.</p>}
            <div className="mt-3 border-t border-separator p-4">
              <MoneyEntryForm options={OVERHEAD_OPTIONS} owners={owners} personLabel="Paid by" submitLabel="Add cost"
                onSave={entry => addOverhead({ category: entry.kind, amount: entry.amount, description: entry.note, spentOn: entry.on, paidBy: entry.person })}
                onSaved={entry => setMessage(`${OVERHEAD_LABEL[entry.kind]} added`)} />
            </div>
          </div>
        </section>

        <section>
          <SectionHeading title="By car" note="all time" />
          {summary.cars.length
            ? <ul className="card divide-y divide-separator">{summary.cars.map(car => <li key={car.id}>
              <Link href={`/cars/${car.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-subtle/60">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{car.name}</p>
                  <p className="truncate text-meta tabular-nums text-secondary">Cost {rands(car.cost)} · In {rands(car.takings)}</p>
                </div>
                <span className={`shrink-0 text-body font-bold tabular-nums ${car.profit >= 0 ? "text-success" : "text-ink"}`}>{car.profit >= 0 ? `+${rands(car.profit)}` : `${rands(-car.profit)} to go`}</span>
                <Icon name="chevron" className="h-4 w-4 shrink-0 text-tertiary" />
              </Link>
            </li>)}</ul>
            : <p className="card px-4 py-4 text-meta text-secondary">Car projects appear here once you add them.</p>}
        </section>
      </div>
    </main>

    {paying && <PaymentSheet key={sheet} owners={owners} suggestion={paying} onClose={() => setPaying(null)}
      onSaved={text => { setPaying(null); setMessage(text); }} />}
  </>;
}

/** Records one owner paying another, prefilled with what would even them up. */
function PaymentSheet({ owners, suggestion, onClose, onSaved }: { owners: Owner[]; suggestion: Settlement; onClose: () => void; onSaved: (message: string) => void }) {
  const [from, setFrom] = useState(suggestion.from.id);
  const [to, setTo] = useState(suggestion.to.id);
  const [amount, setAmount] = useState(String(suggestion.amount));
  const [on, setOn] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseRands(amount);
    if (value === null || Number.isNaN(value) || value <= 0) { setError("Enter the amount in rands."); return; }
    if (from === to) { setError("Choose two different people."); return; }
    setError(null);
    startSaving(async () => {
      const result = await recordTransfer({ from, to, amount: value, on, note });
      startSaving(() => {
        if (result.error) setError(result.error);
        else onSaved(`Payment of ${rands(value)} recorded`);
      });
    });
  }

  return <Sheet open onClose={onClose} title="Record payment" description="Money one of you handed the other to settle up."
    footer={<>
      <Button variant="secondary" block className="sm:w-auto" disabled={saving} onClick={onClose}>Cancel</Button>
      <Button type="submit" form="partner-payment" block className="sm:w-auto" loading={saving}>Record payment</Button>
    </>}>
    <form id="partner-payment" onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="From"><OwnerSelect owners={owners} value={from} onChange={setFrom} label="From" /></Field>
        <Field label="To"><OwnerSelect owners={owners} value={to} onChange={setTo} label="To" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount"><MoneyInput value={amount} onChange={e => { setAmount(e.target.value); setError(null); }} /></Field>
        <Field label="Date"><Input type="date" value={on} max={todayIso()} onChange={e => setOn(e.target.value)} /></Field>
      </div>
      <Field label="Note"><Input maxLength={120} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional, e.g. EFT" /></Field>
      {error && <InlineError>{error}</InlineError>}
    </form>
  </Sheet>;
}
