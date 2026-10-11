import { format } from "date-fns";
import { getCategory } from "@/lib/categories";
import { fromIsoDate, isWithin, monthOf } from "@/lib/dates/iso";
import type { Period } from "@/lib/dates/periods";
import type { Transaction, TransactionType } from "@/types/domain";



export function filterByPeriod<T extends Pick<Transaction, "date">>(
  transactions: readonly T[],
  period: Pick<Period, "start" | "end">,
): T[] {
  return transactions.filter((t) => isWithin(t.date, period.start, period.end));
}

export function sumByType(transactions: readonly Transaction[], type: TransactionType): number {
  return transactions.reduce((total, t) => (t.type === type ? total + t.amount : total), 0);
}

export interface CashFlowSummary {
  income: number;
  expenses: number;
  /** income − expenses; negative means the period spent more than it earned. */
  net: number;
  count: number;
}

export function summarize(transactions: readonly Transaction[]): CashFlowSummary {
  const income = sumByType(transactions, "income");
  const expenses = sumByType(transactions, "expense");
  return { income, expenses, net: income - expenses, count: transactions.length };
}

/**
 * Balance as of `asOf` (inclusive): opening balance + income − expenses for every transaction
 * dated on or before that day. Future-dated transactions are scheduled, not yet in the balance.
 */
export function accountBalance(
  openingBalance: number,
  transactions: readonly Transaction[],
  asOf: string,
): number {
  const { net } = summarize(transactions.filter((t) => t.date <= asOf));
  return openingBalance + net;
}

/**
 * Splits `total` into integer permille shares (0–1000) using the largest-remainder method,
 * so the shares always add up to exactly 1000 (100.0%) instead of 99.9% or 100.1%.
 */
export function allocatePermille(amounts: readonly number[]): number[] {
  const total = amounts.reduce((a, b) => a + b, 0);
  if (total <= 0) return amounts.map(() => 0);
  const exact = amounts.map((amount) => (amount * 1000) / total);
  const floors = exact.map(Math.floor);
  let leftover = 1000 - floors.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (leftover <= 0) break;
    floors[index] += 1;
    leftover -= 1;
  }
  return floors;
}

export interface CategorySpending {
  categoryId: string;
  name: string;
  amount: number;
  /** Share of total expenses in permille; shares sum to exactly 1000 when there is spending. */
  permille: number;
}

/** Expense totals per category, largest first (ties broken by name for a stable order). */
export function spendingByCategory(transactions: readonly Transaction[]): CategorySpending[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type === "expense") totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  const rows = [...totals.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      name: getCategory(categoryId)?.name ?? "Unknown category",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  const permille = allocatePermille(rows.map((r) => r.amount));
  return rows.map((row, i) => ({ ...row, permille: permille[i] }));
}

export interface SeriesPoint {
  key: string;
  label: string;
  from: string;
  to: string;
  income: number;
  expenses: number;
}

type Bucket = Pick<SeriesPoint, "key" | "label" | "from" | "to">;

function weekBuckets(period: Pick<Period, "start" | "end">): Bucket[] {
  // Weeks run Monday–Sunday and are clipped to the period so edge weeks are partial.
  const buckets: Bucket[] = [];
  let cursor = fromIsoDate(period.start);
  const end = fromIsoDate(period.end);
  while (cursor <= end) {
    const dayOfWeek = (cursor.getDay() + 6) % 7; // Monday = 0
    const weekEnd = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + (6 - dayOfWeek),
    );
    const last = weekEnd < end ? weekEnd : end;
    const from = format(cursor, "yyyy-MM-dd");
    const to = format(last, "yyyy-MM-dd");
    const label =
      from === to ? format(cursor, "d MMM") : `${format(cursor, "d")}–${format(last, "d MMM")}`;
    buckets.push({ key: from, label, from, to });
    cursor = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  }
  return buckets;
}

function monthBuckets(period: Pick<Period, "start" | "end">): Bucket[] {
  const months: Bucket[] = [];
  let year = Number(period.start.slice(0, 4));
  let month = Number(period.start.slice(5, 7));
  const last = monthOf(period.end);
  for (;;) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const from = `${key}-01`;
    const to = `${key}-${String(daysInMonth).padStart(2, "0")}`;
    months.push({ key, label: format(new Date(year, month - 1, 1), "MMM"), from, to });
    if (key >= last) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/**
 * Income-versus-expense series. A single-month period is bucketed by week, longer
 * periods by month. Totals across all buckets always equal `summarize()` for the period.
 */
export function incomeExpenseSeries(
  transactions: readonly Transaction[],
  period: Pick<Period, "start" | "end">,
): SeriesPoint[] {
  const singleMonth = monthOf(period.start) === monthOf(period.end);
  const buckets = singleMonth ? weekBuckets(period) : monthBuckets(period);
  const points: SeriesPoint[] = buckets.map((b) => ({ ...b, income: 0, expenses: 0 }));
  for (const t of filterByPeriod(transactions, period)) {
    const point = points.find((p) => isWithin(t.date, p.from, p.to));
    if (!point) continue;
    if (t.type === "income") point.income += t.amount;
    else point.expenses += t.amount;
  }
  return points;
}

/** Newest first. Ties on date fall back to creation time, then id, so order is fully stable. */
export function compareTransactionsNewestFirst(a: Transaction, b: Transaction): number {
  return (
    b.date.localeCompare(a.date) ||
    b.createdAt.localeCompare(a.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

export function recentTransactions(
  transactions: readonly Transaction[],
  limit: number,
): Transaction[] {
  return [...transactions].sort(compareTransactionsNewestFirst).slice(0, limit);
}

/**
 * Keeps the `maxVisible` largest categories and folds the rest into one "Other categories" row,
 * so a chart stays readable. Amounts and permille are summed, so totals never change.
 * With `maxVisible` or fewer rows the input is returned unchanged.
 */
export function groupSmallCategories(
  rows: readonly CategorySpending[],
  maxVisible: number,
): CategorySpending[] {
  if (rows.length <= maxVisible) return [...rows];
  const visible = rows.slice(0, maxVisible - 1);
  const rest = rows.slice(maxVisible - 1);
  return [
    ...visible,
    {
      categoryId: "grouped-other",
      name: "Other categories",
      amount: rest.reduce((t, r) => t + r.amount, 0),
      permille: rest.reduce((t, r) => t + r.permille, 0),
    },
  ];
}
