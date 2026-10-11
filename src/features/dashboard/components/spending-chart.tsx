"use client";

import { PieChartIcon } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";

import type { CategorySpending } from "@/lib/calculations";
import { useFormat } from "@/providers/use-format";
import { describeSpending } from "../utils/chart-text";

interface SpendingChartProps {
  chartRows: CategorySpending[];
  allRows: CategorySpending[];
  total: number;
}

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--chart-6)",
];

export function SpendingChart({ chartRows, allRows, total }: SpendingChartProps) {
  const { money, net, permille } = useFormat();
  const summary = describeSpending(allRows, { money, net, permille });
  const data = chartRows.map((row, i) => ({ ...row, fill: SLICE_COLORS[i % SLICE_COLORS.length] }));

  return (
    <Card aria-labelledby="spending-title">
      <CardHeader
        title="Spending by category"
        titleId="spending-title"
        description="Share of total expenses"
      />
      {allRows.length === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="No expenses in this period"
          description="Once you record spending, it is broken down by category here."
        />
      ) : (
        <>
          <div role="img" aria-label={summary} className="relative mx-auto h-48 w-full max-w-60">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 240, height: 192 }}
            >
              <PieChart>
                <Tooltip
                  formatter={(value) => money(Number(value))}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--foreground)",
                  }}
                />
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  isAnimationActive={false}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center text-center"
            >
              <div>
                <p className="text-caption text-muted-foreground">Total</p>
                <p className="money text-sm font-semibold">{money(total, { fractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* The legend names every slice, so color is never the only identifier. */}
          <ul className="mt-4 space-y-2">
            {data.map((row) => (
              <li key={row.categoryId} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-[3px]"
                    style={{ background: row.fill }}
                  />
                  <span className="truncate">{row.name}</span>
                </span>
                <span className="money shrink-0 text-right">
                  {money(row.amount, { fractionDigits: 0 })}
                  <span className="text-caption text-muted-foreground ml-2">
                    {permille(row.permille)}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {allRows.length > chartRows.length && (
            <details className="mt-2 text-sm">
              <summary className="flex min-h-11 cursor-pointer items-center font-medium">
                All categories
              </summary>
              <ul className="money space-y-1.5 pb-1">
                {allRows.map((row) => (
                  <li key={row.categoryId} className="flex justify-between gap-3">
                    <span>{row.name}</span>
                    <span>
                      {money(row.amount)} · {permille(row.permille)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </Card>
  );
}
