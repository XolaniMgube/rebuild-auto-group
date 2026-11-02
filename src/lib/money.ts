import type { OverheadCategory, Owner } from "./types";

// The business-wide money picture: totals for a period, profit per car, and
// what the owners owe each other. Pure functions over rows loaded by
// getMoneyOverview(), so the arithmetic lives in one place.
//
// Dates are South African calendar days (YYYY-MM-DD).

export type MoneyData = {
  owners: Owner[];
  cars: { id: string; name: string; purchasePrice: number; purchaseDate: string; paidBy: string | null }[];
  carExpenses: { vehicleId: string; amount: number; on: string; paidBy: string | null }[];
  sales: { vehicleId: string | null; amount: number; on: string; receivedBy: string | null }[];
  income: { vehicleId: string; amount: number; on: string; receivedBy: string | null }[];
  overheads: { id: string; category: OverheadCategory; description: string | null; amount: number; on: string; paidBy: string | null }[];
  transfers: { id: string; from: string | null; to: string | null; amount: number; on: string; note: string | null }[];
};

export type Period = "month" | "last-month" | "year" | "all";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

export const isPeriod = (value: unknown): value is Period => PERIODS.some((p) => p.value === value);

const cents = (value: number) => Math.round(value * 100) / 100;
const sum = (rows: { amount: number }[]) => cents(rows.reduce((total, row) => total + row.amount, 0));
const pad = (n: number) => String(n).padStart(2, "0");

/** First and last day of the period containing `today`; null for all time. */
export function periodRange(period: Period, today: string): { from: string; to: string } | null {
  const [year, month] = today.split("-").map(Number);
  const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (period === "month") return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay(year, month))}` };
  if (period === "last-month") {
    const y = month === 1 ? year - 1 : year;
    const m = month === 1 ? 12 : month - 1;
    return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay(y, m))}` };
  }
  if (period === "year") return { from: `${year}-01-01`, to: `${year}-12-31` };
  return null;
}

export type Balance = { owner: Owner; paidOut: number; tookIn: number; difference: number };
export type Settlement = { from: Owner; to: Owner; amount: number };

/**
 * What each owner put in and took out, all time, and the payments that would
 * even it up. Owners share the business equally: if Mitch paid for the car
 * and Dave holds the cash from its parts, Dave owes Mitch until they are level.
 * A settle-up payment counts as paid out by the payer and taken in by the other.
 */
export function partnerBalances(data: MoneyData) {
  const ids = new Set(data.owners.map((o) => o.id));
  const paid = new Map<string, number>();
  const took = new Map<string, number>();
  let unassigned = 0;
  const add = (map: Map<string, number>, who: string | null, amount: number) => {
    if (who && ids.has(who)) map.set(who, (map.get(who) ?? 0) + amount);
    else unassigned += amount;
  };

  for (const car of data.cars) if (car.purchasePrice > 0) add(paid, car.paidBy, car.purchasePrice);
  for (const row of data.carExpenses) add(paid, row.paidBy, row.amount);
  for (const row of data.overheads) add(paid, row.paidBy, row.amount);
  for (const row of data.sales) add(took, row.receivedBy, row.amount);
  for (const row of data.income) add(took, row.receivedBy, row.amount);
  for (const row of data.transfers) {
    if (row.from && ids.has(row.from)) paid.set(row.from, (paid.get(row.from) ?? 0) + row.amount);
    if (row.to && ids.has(row.to)) took.set(row.to, (took.get(row.to) ?? 0) + row.amount);
  }

  const owners = data.owners;
  const net = (id: string) => (took.get(id) ?? 0) - (paid.get(id) ?? 0);
  const fairShare = owners.length ? owners.reduce((total, o) => total + net(o.id), 0) / owners.length : 0;
  // Positive: holds more than their share, so owes the others.
  const balances: Balance[] = owners.map((owner) => ({
    owner,
    paidOut: cents(paid.get(owner.id) ?? 0),
    tookIn: cents(took.get(owner.id) ?? 0),
    difference: cents(net(owner.id) - fairShare),
  }));

  // Pair whoever owes the most with whoever is owed the most until all are level.
  const owing = balances.filter((b) => b.difference >= 1).map((b) => ({ ...b })).sort((a, b) => b.difference - a.difference);
  const owed = balances.filter((b) => b.difference <= -1).map((b) => ({ ...b, difference: -b.difference })).sort((a, b) => b.difference - a.difference);
  const settlements: Settlement[] = [];
  for (const debtor of owing) {
    for (const creditor of owed) {
      if (debtor.difference < 1) break;
      if (creditor.difference < 1) continue;
      const amount = cents(Math.min(debtor.difference, creditor.difference));
      settlements.push({ from: debtor.owner, to: creditor.owner, amount });
      debtor.difference -= amount;
      creditor.difference -= amount;
    }
  }
  return { balances, settlements, unassigned: cents(unassigned) };
}

/** Totals for a period, plus each car's all-time position. */
export function summarise(data: MoneyData, period: Period, today: string) {
  const range = periodRange(period, today);
  const within = (on: string) => !range || (on >= range.from && on <= range.to);

  const sales = sum(data.sales.filter((row) => within(row.on)));
  const income = sum(data.income.filter((row) => within(row.on)));
  const carsBought = cents(data.cars.filter((car) => within(car.purchaseDate)).reduce((total, car) => total + car.purchasePrice, 0));
  const carExpenses = sum(data.carExpenses.filter((row) => within(row.on)));
  const overheadRows = data.overheads.filter((row) => within(row.on));
  const overheads = sum(overheadRows);
  const moneyIn = cents(sales + income);
  const moneyOut = cents(carsBought + carExpenses + overheads);

  const cars = data.cars.map((car) => {
    const cost = cents(car.purchasePrice + sum(data.carExpenses.filter((row) => row.vehicleId === car.id)));
    const takings = cents(sum(data.sales.filter((row) => row.vehicleId === car.id)) + sum(data.income.filter((row) => row.vehicleId === car.id)));
    return { id: car.id, name: car.name, cost, takings, profit: cents(takings - cost) };
  });

  return {
    range,
    sales,
    income,
    carsBought,
    carExpenses,
    overheads,
    overheadRows,
    moneyIn,
    moneyOut,
    profit: cents(moneyIn - moneyOut),
    cars,
    ...partnerBalances(data),
  };
}
