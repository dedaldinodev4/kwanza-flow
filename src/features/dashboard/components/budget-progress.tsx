"use client";

import { PiggyBank } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BudgetStatusLine } from "@/features/budgets/components/budget-status";

import type { BudgetProgress as BudgetProgressItem } from "@/lib/calculations";
import { useFormat } from "@/providers/use-format";
import { useCategoryName } from "@/hooks/use-i18n";

interface BudgetProgressProps {
  budgets: BudgetProgressItem[];
  periodLabel: string;
}


export function BudgetProgress({ budgets, periodLabel }: BudgetProgressProps) {
  const { money, ratio } = useFormat();
  const { t } = useTranslation();
  const categoryName = useCategoryName();

  return (
    <Card aria-labelledby="budgets-title">
      <CardHeader
        title={t("Budget progress")}
        titleId="budgets-title"
        description={t(periodLabel)}
        action={
          <Link
            href="/budgets"
            aria-label={t("Manage budgets")}
            className="text-success inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("Manage")}
          </Link>
        }
      />
      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={t("No budgets for this period")}
          description={t(
            "Budgets set a monthly limit per category so you can see overspending early.",
          )}
          action={{ href: "/budgets", label: t("Go to budgets") }}
        />
      ) : (
        <ul className="space-y-4">
          {budgets.map((b) => (
            <li key={b.categoryId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium">{categoryName(b.categoryId)}</p>
                <p className="money text-caption text-muted-foreground shrink-0">
                  {t("{{spent}} of {{limit}} · {{percent}}", {
                    spent: money(b.spent, { fractionDigits: 0 }),
                    limit: money(b.limit, { fractionDigits: 0 }),
                    percent: ratio(b.ratio),
                  })}
                </p>
              </div>
              <ProgressBar
                ratio={b.ratio}
                label={t("{{name}} budget used", { name: categoryName(b.categoryId) })}
                tone={b.status}
              />
              <div className="mt-1.5">
                <BudgetStatusLine progress={b} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
