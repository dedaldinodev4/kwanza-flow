"use client";

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { money, ratio } = useFormat();
  const used = totals.limit > 0 ? totals.spent / totals.limit : 0;
  return (
    <Card aria-label={t("Budget summary for {{month}}", { month: monthLabel})}>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-label text-muted-foreground">{t("Budgeted")}</dt>
          <dd className="money text-kpi">{money(totals.limit)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">{t("Spent")}</dt>
          <dd className="money text-kpi">{money(totals.spent)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">
            {totals.remaining < 0 ? t("Over by") : t("Remaining")}
          </dt>
          <dd className={`money text-kpi ${totals.remaining < 0 ? "text-destructive" : ""}`}>
            {money(Math.abs(totals.remaining))}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <ProgressBar
          ratio={used}
          label={t("Total budget used")}
          tone={budgetStatus(totals.spent, totals.limit)}
        />
        <p className="text-caption text-muted-foreground mt-2">
          {t("{{ratioUsed}} of your total budget used", { ratioUsed: ratio(used)})}
          {totals.overCount > 0 &&
            ` · ${totals.overCount} ${totals.overCount === 1 ? t("category is") : t("categories are")}`}{t(" over budget")}
        </p>
      </div>
    </Card>
  );
}
