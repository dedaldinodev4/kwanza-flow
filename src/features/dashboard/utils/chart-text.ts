import type { CategorySpending, SeriesPoint } from "@/lib/calculations";


export type Translate = (key: string, params?: Record<string, string | number>) => string;

interface Formatters {
  money: (minor: number) => string;
  net: (minor: number) => string;
  permille: (permille: number) => string;
  t: Translate;
}

/** Plain-language equivalent of the income-vs-expense chart (used as its accessible name). */
export function describeCashFlow(
  series: readonly SeriesPoint[],
  periodLabel: string,
  f: Formatters,
): string {
  const { t } = f;
  const period = t(periodLabel);
  const income = series.reduce((sum, p) => sum + p.income, 0);
  const expenses = series.reduce((sum, p) => sum + p.expenses, 0);
  if (income === 0 && expenses === 0) {
    return t("{{period}}: no income or expenses recorded.", { period });
  }
  const peak = series.reduce((best, p) => (p.expenses > best.expenses ? p : best), series[0]);
  const peakText =
    peak.expenses > 0
      ? ` ${t("Highest spending: {{period}}, {{amount}}.", { period: peak.label, amount: f.money(peak.expenses) })}`
      : "";
  return `${t("{{period}}: income {{income}}, expenses {{expenses}}, net {{net}}.", {
    period,
    income: f.money(income),
    expenses: f.money(expenses),
    net: f.net(income - expenses),
  })}${peakText}`;
}


/** Plain-language equivalent of the spending donut. */
export function describeSpending(rows: readonly CategorySpending[], f: Formatters): string {
  const { t } = f;
  if (rows.length === 0) return t("No expenses recorded in this period.");
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const [top] = rows;
  return t(
    "Total expenses {{total}} across {{count}} categories. Largest: {{name}}, {{amount}} ({{share}}).",
    {
      total: f.money(total),
      count: rows.length,
      name: t(top.name),
      amount: f.money(top.amount),
      share: f.permille(top.permille),
    },
  );
}

/**
 * Weekly buckets all fall in one month, so after the first tick the repeated month name is noise that
 * makes neighbouring labels collide on a phone: "1–4 Oct", "5–11", "12–18"… Month buckets ("Jan") and
 * the tooltip / table keep their full text.
 */
export function shortenWeekLabel(label: string, index: number): string {
  return index > 0 && label.includes("–") ? label.replace(/\s\p{L}{3,4}$/u, "") : label;
}
