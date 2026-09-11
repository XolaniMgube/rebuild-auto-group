"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Button, DetailList, DetailRow, Field, IconButton, InlineError, Input, MoneyInput, Select, Sheet, Spinner, useConfirm } from "@/components/ui";
import { addExpense, removeExpense, setPurchasePrice, undoSale } from "@/lib/actions";
import { parseRands, rands, shortDate } from "@/lib/format";
import { EXPENSE_LABEL, EXPENSE_OPTIONS, type ExpenseCategory, type ProjectMoney as Money, type SoldItem, type Vehicle, type VehicleExpense } from "@/lib/types";

const total = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;

/** Owner-only view of what a car cost and what its parts have brought in. */
export function ProjectMoney({ vehicle, money, stockValue, onMessage }: { vehicle: Vehicle; money: Money; stockValue: number; onMessage: (message: string) => void }) {
  const confirm = useConfirm();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceSheet, setPriceSheet] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expensesTotal = total(money.expenses.map(e => e.amount));
  const cost = total([vehicle.purchasePrice, expensesTotal]);
  const revenue = total(money.sales.map(s => s.price * s.quantity));
  const discounts = total(money.sales.map(s => (s.listPrice != null && s.listPrice > s.price ? (s.listPrice - s.price) * s.quantity : 0)));
  const profit = total([revenue, -cost]);
  const projected = total([revenue, stockValue, -cost]);
  const recovered = cost > 0 ? Math.min(revenue / cost, 1) : revenue > 0 ? 1 : 0;

  async function dropExpense(expense: VehicleExpense) {
    if (!(await confirm({ title: `Remove ${EXPENSE_LABEL[expense.category].toLowerCase()} expense?`, message: `${rands(expense.amount)} comes off this car's costs.`, confirmLabel: "Remove" }))) return;
    setError(null);
    setBusy(expense.id);
    const result = await removeExpense(expense.id);
    setBusy(null);
    if (result.error) setError(result.error);
    else onMessage("Expense removed");
  }

  async function reverseSale(sale: SoldItem) {
    if (!(await confirm({ title: "Undo this sale?", message: `${sale.partName} goes back into stock and ${rands(sale.price * sale.quantity)} comes off sales.`, confirmLabel: "Undo sale" }))) return;
    setError(null);
    setBusy(sale.saleId);
    const result = await undoSale(sale.saleId);
    setBusy(null);
    if (result.error) setError(result.error);
    else onMessage("Sale undone");
  }

  return <div className="space-y-4">
    <div className="card overflow-hidden">
      <div className="p-4 sm:p-5">
        <p className="text-meta font-medium text-secondary">{profit >= 0 ? "Profit so far" : "Still to recover"}</p>
        <p className={`mt-1.5 text-[34px] font-bold leading-none tracking-[-0.035em] tabular-nums ${profit >= 0 ? "text-success" : "text-ink"}`}>{rands(Math.abs(profit))}</p>
        <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-success transition-all duration-base ease-ios" style={{ width: `${recovered * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-meta tabular-nums text-secondary">
          <span>Sold {rands(revenue)}</span>
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
        className="-my-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 font-semibold text-brand-navy tabular-nums">
        {vehicle.purchasePrice > 0 ? rands(vehicle.purchasePrice) : "Add price"}<Icon name="pencil" className="h-4 w-4" />
      </button>} />
      <DetailRow label="Expenses" value={rands(expensesTotal)} />
      <DetailRow label="Total cost" value={rands(cost)} />
      <DetailRow label="Sold" value={rands(revenue)} />
      {discounts > 0 && <DetailRow label="Discounts given" value={rands(discounts)} />}
      <DetailRow label="Unsold stock (asking)" value={rands(stockValue)} />
    </DetailList>

    {error && <InlineError>{error}</InlineError>}

    <div className="card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h3 className="text-card">Expenses</h3>
        <span className="text-meta tabular-nums text-secondary">{rands(expensesTotal)}</span>
      </div>
      {money.expenses.length > 0
        ? <ul className="mt-2 divide-y divide-separator">{money.expenses.map(expense => <li key={expense.id} className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium">{expense.description || EXPENSE_LABEL[expense.category]}</p>
            <p className="text-meta text-secondary">{expense.description ? `${EXPENSE_LABEL[expense.category]} · ` : ""}{shortDate(expense.spentOn)}</p>
          </div>
          <span className="shrink-0 text-body font-semibold tabular-nums">{rands(expense.amount)}</span>
          {busy === expense.id
            ? <span className="grid h-11 w-11 place-items-center"><Spinner /></span>
            : <IconButton label={`Remove ${EXPENSE_LABEL[expense.category]} expense of ${rands(expense.amount)}`} icon="close" variant="plain" onClick={() => dropExpense(expense)} className="-mr-2" />}
        </li>)}</ul>
        : <p className="px-4 pt-1 text-meta text-secondary">Transport, labour and anything else spent on this car.</p>}
      <AddExpense vehicleId={vehicle.id} onAdded={onMessage} />
    </div>

    <div className="card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h3 className="text-card">Sold parts</h3>
        <span className="text-meta tabular-nums text-secondary">{rands(revenue)}</span>
      </div>
      {money.sales.length > 0
        ? <ul className="mt-2 divide-y divide-separator">{money.sales.map(sale => <li key={sale.id} className="flex items-center gap-3 px-4 py-2.5">
          <Link href={`/parts/${sale.partId}`} className="min-w-0 flex-1 py-1">
            <p className="truncate text-body font-medium">{sale.partName}</p>
            <p className="truncate text-meta text-secondary">
              {shortDate(sale.soldAt)}
              {sale.soldBy ? ` · Sold by ${sale.soldBy}${sale.customerName ? ` to ${sale.customerName}` : ""}` : sale.customerName ? ` · ${sale.customerName}` : ""}
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

    <PurchasePriceSheet key={priceSheet} vehicle={vehicle} open={editingPrice} onClose={() => setEditingPrice(false)}
      onSaved={() => { setEditingPrice(false); onMessage("Purchase price saved"); }} />
  </div>;
}

function AddExpense({ vehicleId, onAdded }: { vehicleId: string; onAdded: (message: string) => void }) {
  const [category, setCategory] = useState<ExpenseCategory>("transport");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseRands(amount);
    if (value === null || Number.isNaN(value) || value <= 0) { setError("Enter the amount in rands, e.g. 1500."); return; }
    setError(null);
    startSaving(async () => {
      const result = await addExpense(vehicleId, { category, amount: value, description: note });
      if (result.error) { setError(result.error); return; }
      setAmount("");
      setNote("");
      onAdded(`${EXPENSE_LABEL[category]} expense added`);
    });
  }

  return <form onSubmit={submit} className="mt-3 space-y-3 border-t border-separator p-4">
    <div className="grid grid-cols-2 gap-3">
      <Select aria-label="Expense type" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>
        {EXPENSE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      <MoneyInput aria-label="Expense amount" placeholder="Amount" value={amount} onChange={e => { setAmount(e.target.value); setError(null); }} />
    </div>
    <Input aria-label="Expense note" placeholder="Note (optional)" maxLength={120} value={note} onChange={e => setNote(e.target.value)} />
    {error && <InlineError>{error}</InlineError>}
    <Button type="submit" variant="secondary" block loading={saving}><Icon name="plus" />Add expense</Button>
  </form>;
}

function PurchasePriceSheet({ vehicle, open, onClose, onSaved }: { vehicle: Vehicle; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(vehicle.purchasePrice > 0 ? String(vehicle.purchasePrice) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseRands(value);
    if (Number.isNaN(amount)) { setError("Enter the price in rands, e.g. 20000."); return; }
    setError(null);
    startSaving(async () => {
      const result = await setPurchasePrice(vehicle.id, amount ?? 0);
      if (result.error) setError(result.error);
      else onSaved();
    });
  }

  return <Sheet open={open} onClose={onClose} title="Bought for" description="What you paid for the car itself. Add transport and labour as expenses."
    footer={<>
      <Button variant="secondary" block className="sm:w-auto" onClick={onClose}>Cancel</Button>
      <Button type="submit" form="purchase-price" block className="sm:w-auto" loading={saving}>Save</Button>
    </>}>
    <form id="purchase-price" onSubmit={submit} className="space-y-3">
      <Field label="Purchase price"><MoneyInput value={value} onChange={e => { setValue(e.target.value); setError(null); }} placeholder="0" /></Field>
      {error && <InlineError>{error}</InlineError>}
    </form>
  </Sheet>;
}
