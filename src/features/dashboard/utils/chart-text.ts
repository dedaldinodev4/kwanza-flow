import type { CategorySpending, SeriesPoint } from "@/lib/calculations";

interface Formatters {
  money: (minor: number) => string;
  net: (minor: number) => string;
  permille: (permille: number) => string;
}

/** Plain-language equivalent of the income-vs-expense chart (used as its accessible name). */
export function describeCashFlow(
  series: readonly SeriesPoint[],
  periodLabel: string,
  f: Formatters,
): string {
  const income = series.reduce((t, p) => t + p.income, 0);
  const expenses = series.reduce((t, p) => t + p.expenses, 0);
  if (income === 0 && expenses === 0) return `${periodLabel}: no income or expenses recorded.`;
  const peak = series.reduce((best, p) => (p.expenses > best.expenses ? p : best), series[0]);
  const peakText =
    peak.expenses > 0 ? ` Highest spending: ${peak.label}, ${f.money(peak.expenses)}.` : "";
  return `${periodLabel}: income ${f.money(income)}, expenses ${f.money(expenses)}, net ${f.net(income - expenses)}.${peakText}`;
}

/** Plain-language equivalent of the spending donut. */
export function describeSpending(rows: readonly CategorySpending[], f: Formatters): string {
  if (rows.length === 0) return "No expenses recorded in this period.";
  const total = rows.reduce((t, r) => t + r.amount, 0);
  const [top] = rows;
  return `Total expenses ${f.money(total)} across ${rows.length} ${rows.length === 1 ? "category" : "categories"}. Largest: ${top.name}, ${f.money(top.amount)} (${f.permille(top.permille)}).`;
}
