"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { MoneyEntryForm, OwnerSelect, useDefaultOwner } from "@/components/MoneyEntry";
import { Button, DetailList, DetailRow, Field, IconButton, InlineError, Input, MoneyInput, Sheet, Spinner, useConfirm } from "@/components/ui";
import { addExpense, addIncome, removeExpense, removeIncome, setPurchasePrice, undoSale } from "@/lib/actions";
import { parseRands, rands, shortDate, todayIso } from "@/lib/format";
import { partHref } from "@/lib/return-to";
import {
  EXPENSE_LABEL, EXPENSE_OPTIONS, INCOME_LABEL, INCOME_OPTIONS,
  type Owner, type ProjectMoney as Money, type SoldItem, type Vehicle, type VehicleExpense, type VehicleIncome,
} from "@/lib/types";

const total = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;
const joined = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join(" · ");

/** Owner-only view of what a car cost and what it has brought in. */
export function ProjectMoney({ vehicle, money, stockValue, owners, onMessage }: {
  vehicle: Vehicle;
  money: Money;
  stockValue: number;
  owners: Owner[];
  onMessage: (message: string) => void;
}) {
  const confirm = useConfirm();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceSheet, setPriceSheet] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expensesTotal = total(money.expenses.map(e => e.amount));
  const incomeTotal = total(money.income.map(i => i.amount));
  const salesTotal = total(money.sales.map(s => s.price * s.quantity));
  const takings = total([salesTotal, incomeTotal]);
  const cost = total([vehicle.purchasePrice, expensesTotal]);
  const discounts = total(money.sales.map(s => (s.listPrice != null && s.listPrice > s.price ? (s.listPrice - s.price) * s.quantity : 0)));
  const profit = total([takings, -cost]);
  const projected = total([takings, stockValue, -cost]);
  const recovered = cost > 0 ? Math.min(takings / cost, 1) : takings > 0 ? 1 : 0;
  const buyer = owners.find(o => o.id === vehicle.paidBy)?.name;

  async function run(id: string, action: () => Promise<{ error?: string }>, done: string) {
    setError(null);
    setBusy(id);
    const result = await action();
    setBusy(null);
    if (result.error) setError(result.error);
    else onMessage(done);
  }

  async function dropExpense(expense: VehicleExpense) {
    if (!(await confirm({ title: `Remove ${EXPENSE_LABEL[expense.category].toLowerCase()} expense?`, message: `${rands(expense.amount)} comes off this car's costs.`, confirmLabel: "Remove" }))) return;
    await run(expense.id, () => removeExpense(expense.id), "Expense removed");
  }

  async function dropIncome(income: VehicleIncome) {
    if (!(await confirm({ title: `Remove ${INCOME_LABEL[income.kind].toLowerCase()}?`, message: `${rands(income.amount)} comes off what this car brought in.`, confirmLabel: "Remove" }))) return;
    await run(income.id, () => removeIncome(income.id), "Income removed");
  }

  async function reverseSale(sale: SoldItem) {
    if (!(await confirm({ title: "Undo this sale?", message: `${sale.partName} goes back into stock and ${rands(sale.price * sale.quantity)} comes off sales.`, confirmLabel: "Undo sale" }))) return;
    await run(sale.saleId, () => undoSale(sale.saleId), "Sale undone");
  }

  const removeButton = (id: string, label: string, onClick: () => void) => busy === id
    ? <span className="grid h-11 w-11 place-items-center"><Spinner /></span>
    : <IconButton label={label} icon="close" variant="plain" onClick={onClick} className="-mr-2" />;

  return <div className="space-y-4">
    <div className="card overflow-hidden">
      <div className="p-4 sm:p-5">
        <p className="text-meta font-medium text-secondary">{profit >= 0 ? "Profit so far" : "Still to recover"}</p>
        <p className={`mt-1.5 text-[34px] font-bold leading-none tracking-[-0.035em] tabular-nums ${profit >= 0 ? "text-success" : "text-ink"}`}>{rands(Math.abs(profit))}</p>
        <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-success transition-all duration-base ease-ios" style={{ width: `${recovered * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-meta tabular-nums text-secondary">
          <span>In {rands(takings)}</span>
          <span>Cost {rands(cost)}</span>
        </div>
      </div>
      {stockValue > 0 && <div className="flex items-center justify-between gap-3 border-t border-separator bg-subtle/60 px-4 py-3 text-meta sm:px-5">
        <span className="text-secondary">If unsold stock sells at asking</span>
        <span className={`shrink-0 font-semibold tabular-nums ${projected >= 0 ? "text-success" : "text-ink"}`}>{projected >= 0 ? `+${rands(projected)}` : `${rands(-projected)} short`}</span>
      </div>}
    </div>

    <DetailList>
      <DetailRow label="Bought for" value={<button type="button" onClick={() => { setPriceSheet(n => n + 1); setEditingPrice(true); }}
        className="-my-2 inline-flex min-h-11 flex-col items-end justify-center rounded-lg px-1 text-brand-navy">
        <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">{vehicle.purchasePrice > 0 ? rands(vehicle.purchasePrice) : "Add price"}<Icon name="pencil" className="h-4 w-4" /></span>
        {vehicle.purchasePrice > 0 && <span className="text-caption font-normal text-secondary">{joined(shortDate(vehicle.purchaseDate), buyer && `paid by ${buyer}`)}</span>}
      </button>} />
      <DetailRow label="Expenses" value={rands(expensesTotal)} />
      <DetailRow label="Total cost" value={rands(cost)} />
      <DetailRow label="Parts sold" value={rands(salesTotal)} />
      {incomeTotal > 0 && <DetailRow label="Scrap & other income" value={rands(incomeTotal)} />}
      {discounts > 0 && <DetailRow label="Discounts given" value={rands(discounts)} />}
      <DetailRow label="Unsold stock (asking)" value={rands(stockValue)} />
    </DetailList>

    {error && <InlineError>{error}</InlineError>}

    <MoneyCard title="Expenses" amount={expensesTotal}
      empty="Transport, labour and anything else spent on this car."
      rows={money.expenses.map(expense => ({
        id: expense.id,
        title: expense.description || EXPENSE_LABEL[expense.category],
        meta: joined(expense.description && EXPENSE_LABEL[expense.category], shortDate(expense.spentOn), expense.paidBy && `paid by ${expense.paidBy}`),
        amount: expense.amount,
        action: removeButton(expense.id, `Remove ${EXPENSE_LABEL[expense.category]} expense of ${rands(expense.amount)}`, () => dropExpense(expense)),
      }))}>
      <MoneyEntryForm options={EXPENSE_OPTIONS} owners={owners} personLabel="Paid by" submitLabel="Add expense"
        onSave={entry => addExpense(vehicle.id, { category: entry.kind, amount: entry.amount, description: entry.note, spentOn: entry.on, paidBy: entry.person })}
        onSaved={entry => onMessage(`${EXPENSE_LABEL[entry.kind]} expense added`)} />
    </MoneyCard>

    <MoneyCard title="Scrap & other income" amount={incomeTotal}
      empty="Money the car brings in besides its parts, like selling the shell for scrap."
      rows={money.income.map(income => ({
        id: income.id,
        title: income.description || INCOME_LABEL[income.kind],
        meta: joined(income.description && INCOME_LABEL[income.kind], shortDate(income.receivedOn), income.receivedBy && `with ${income.receivedBy}`),
        amount: income.amount,
        action: removeButton(income.id, `Remove ${INCOME_LABEL[income.kind]} of ${rands(income.amount)}`, () => dropIncome(income)),
      }))}>
      <MoneyEntryForm options={INCOME_OPTIONS} owners={owners} personLabel="Received by" submitLabel="Add income"
        onSave={entry => addIncome(vehicle.id, { kind: entry.kind, amount: entry.amount, description: entry.note, receivedOn: entry.on, receivedBy: entry.person })}
        onSaved={entry => onMessage(`${INCOME_LABEL[entry.kind]} added`)} />
    </MoneyCard>

    <div className="card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h3 className="text-card">Sold parts</h3>
        <span className="text-meta tabular-nums text-secondary">{rands(salesTotal)}</span>
      </div>
      {money.sales.length > 0
        ? <ul className="mt-2 divide-y divide-separator">{money.sales.map(sale => <li key={sale.id} className="flex items-center gap-3 px-4 py-2.5">
          <Link href={partHref(sale.partId, `/cars/${vehicle.id}`)} className="min-w-0 flex-1 py-1">
            <p className="truncate text-body font-medium">{sale.partName}</p>
            <p className="truncate text-meta text-secondary">
              {shortDate(sale.soldAt)}
              {sale.soldBy ? ` · Sold by ${sale.soldBy}${sale.customerName ? ` to ${sale.customerName}` : ""}` : sale.customerName ? ` · ${sale.customerName}` : ""}
              {sale.receivedBy && sale.receivedBy !== sale.soldBy && ` · money with ${sale.receivedBy}`}
              {sale.listPrice != null && sale.listPrice > sale.price && <span className="text-warning"> · asked {rands(sale.listPrice)}</span>}
            </p>
          </Link>
          <span className="shrink-0 text-body font-semibold tabular-nums">{rands(sale.price * sale.quantity)}</span>
          {busy === sale.saleId
            ? <span className="grid h-11 w-11 place-items-center"><Spinner /></span>
            : <IconButton label={`Undo sale of ${sale.partName}`} icon="undo" variant="plain" onClick={() => reverseSale(sale)} className="-mr-2" />}
        </li>)}</ul>
        : <p className="px-4 pb-4 pt-1 text-meta text-secondary">Parts marked as sold appear here with the price paid.</p>}
    </div>

    <PurchasePriceSheet key={priceSheet} vehicle={vehicle} owners={owners} open={editingPrice} onClose={() => setEditingPrice(false)}
      onSaved={() => { setEditingPrice(false); onMessage("Purchase saved"); }} />
  </div>;
}

/** A titled list of money lines with an add form underneath. */
function MoneyCard({ title, amount, empty, rows, children }: {
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

function PurchasePriceSheet({ vehicle, owners, open, onClose, onSaved }: { vehicle: Vehicle; owners: Owner[]; open: boolean; onClose: () => void; onSaved: () => void }) {
  const fallbackOwner = useDefaultOwner(owners);
  const [value, setValue] = useState(vehicle.purchasePrice > 0 ? String(vehicle.purchasePrice) : "");
  const [date, setDate] = useState(vehicle.purchaseDate || todayIso());
  const [paidBy, setPaidBy] = useState(vehicle.paidBy && owners.some(o => o.id === vehicle.paidBy) ? vehicle.paidBy : fallbackOwner);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseRands(value);
    if (Number.isNaN(amount)) { setError("Enter the price in rands, e.g. 20000."); return; }
    if (!date || date > todayIso()) { setError("Choose a date that isn't in the future."); return; }
    setError(null);
    startSaving(async () => {
      const result = await setPurchasePrice(vehicle.id, amount ?? 0, { purchaseDate: date, paidBy: paidBy || null });
      startSaving(() => {
        if (result.error) setError(result.error);
        else onSaved();
      });
    });
  }

  return <Sheet open={open} onClose={onClose} title="Bought for" description="What you paid for the car itself. Add transport and labour as expenses."
    footer={<>
      <Button variant="secondary" block className="sm:w-auto" onClick={onClose}>Cancel</Button>
      <Button type="submit" form="purchase-price" block className="sm:w-auto" loading={saving}>Save</Button>
    </>}>
    <form id="purchase-price" onSubmit={submit} className="space-y-4">
      <Field label="Purchase price"><MoneyInput value={value} onChange={e => { setValue(e.target.value); setError(null); }} placeholder="0" /></Field>
      <div className={`grid gap-3 ${owners.length ? "grid-cols-2" : ""}`}>
        <Field label="Bought on"><Input type="date" value={date} max={todayIso()} onChange={e => setDate(e.target.value)} /></Field>
        {owners.length > 0 && <Field label="Paid by"><OwnerSelect owners={owners} value={paidBy} onChange={setPaidBy} label="Paid by" /></Field>}
      </div>
      {error && <InlineError>{error}</InlineError>}
    </form>
  </Sheet>;
}
