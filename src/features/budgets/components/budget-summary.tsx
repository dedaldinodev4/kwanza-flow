"use client";

import { ProgressBar, Card } from "@/components/ui";
import { budgetStatus, type BudgetTotals } from "@/lib/calculations";
import { useFormat } from "@/providers/use-format";

export function BudgetSummary({
  totals,
  monthLabel,
}: {
  totals: BudgetTotals;
  monthLabel: string;
}) {
  const { money, ratio } = useFormat();
  const used = totals.limit > 0 ? totals.spent / totals.limit : 0;
  return (
    <Card aria-label={`Budget summary for ${monthLabel}`}>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-label text-muted-foreground">Budgeted</dt>
          <dd className="money text-kpi">{money(totals.limit)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">Spent</dt>
          <dd className="money text-kpi">{money(totals.spent)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">
            {totals.remaining < 0 ? "Over by" : "Remaining"}
          </dt>
          <dd className={`money text-kpi ${totals.remaining < 0 ? "text-destructive" : ""}`}>
            {money(Math.abs(totals.remaining))}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <ProgressBar
          ratio={used}
          label="Total budget used"
          tone={budgetStatus(totals.spent, totals.limit)}
        />
        <p className="text-caption text-muted-foreground mt-2">
          {ratio(used)} of your total budget used
          {totals.overCount > 0 &&
            ` · ${totals.overCount} ${totals.overCount === 1 ? "category is" : "categories are"} over budget`}
        </p>
      </div>
    </Card>
  );
}
