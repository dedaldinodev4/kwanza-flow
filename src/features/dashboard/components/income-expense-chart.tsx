"use client";

import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";

import type { SeriesPoint } from "@/lib/calculations";
import { useFormat } from "@/providers/use-format";
import { describeCashFlow, shortenWeekLabel } from "../utils/chart-text";

interface IncomeExpenseChartProps {
  series: SeriesPoint[];
  periodLabel: string;
}

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

export function IncomeExpenseChart({ series, periodLabel }: IncomeExpenseChartProps) {
  const { t } = useTranslation();
  const { money, net, permille, compact } = useFormat();
  const hasData = series.some((p) => p.income > 0 || p.expenses > 0);
  const summary = describeCashFlow(series, periodLabel, { money, net, permille, t });
  const totalIncome = series.reduce((sum, p) => sum + p.income, 0);
  const totalExpenses = series.reduce((sum, p) => sum + p.expenses, 0);

  return (
    <Card aria-labelledby="cashflow-title" className="lg:col-span-2">
      <CardHeader
        title={t("Income vs expenses")}
        titleId="cashflow-title"
        description={t("Amounts in kwanza (Kz), grouped by week or month")}
      />
      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title={t("Nothing to chart yet")}
          description={t("There is no income or spending in this period. Try another period.")}
        />
      ) : (
        <>
          <p className="text-muted-foreground mb-3 text-sm">{summary}</p>
          {/* role="img" gives the chart one accessible name; the table below is the full alternative. */}
          <div role="img" aria-label={summary} className="h-64 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 640, height: 256 }}
            >
              <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={series.length <= 6 ? 0 : "preserveEnd"}
                  tickFormatter={shortenWeekLabel}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={AXIS_TICK}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tick={AXIS_TICK}
                  tickFormatter={(value: number) => compact(value)}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(value) => money(Number(value))}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--foreground)",
                  }}
                />
                <Legend iconType="square" itemSorter={null} wrapperStyle={{ fontSize: 13 }} />
                <Bar
                  dataKey="income"
                  name={t("Income")}
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="expenses"
                  name={t("Expenses")}
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-3 text-sm">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium">
              {t("View as table")}
            </summary>
            <div className="overflow-x-auto">
              <table className="money w-full text-left text-sm">
                <caption className="sr-only">
                  {series.length > 6
                    ? t("Income and expenses by month")
                    : t("Income and expenses by period")}
                </caption>
                <thead>
                  <tr className="text-caption text-muted-foreground border-b">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      {t("Period")}
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      {t("Income")}
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      {t("Expenses")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((p) => (
                    <tr key={p.key} className="border-b last:border-0">
                      <th scope="row" className="py-2 pr-4 font-normal">
                        {p.label}
                      </th>
                      <td className="py-2 pr-4 text-right">{money(p.income)}</td>
                      <td className="py-2 text-right">{money(p.expenses)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <th scope="row" className="py-2 pr-4">
                      {t("Total")}
                    </th>
                    <td className="py-2 pr-4 text-right">{money(totalIncome)}</td>
                    <td className="py-2 text-right">{money(totalExpenses)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  );
}
