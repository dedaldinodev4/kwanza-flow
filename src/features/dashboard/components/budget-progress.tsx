"use client";

import { AlertTriangle, CheckCircle2, OctagonAlert, PiggyBank } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

import type { BudgetProgress as BudgetProgressItem, BudgetStatus } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { useFormat } from "@/providers/use-format";

interface BudgetProgressProps {
  budgets: BudgetProgressItem[];
  periodLabel: string;
}

const STATUS_STYLE: Record<BudgetStatus, { icon: typeof CheckCircle2; className: string }> = {
  ok: { icon: CheckCircle2, className: "text-success" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  over: { icon: OctagonAlert, className: "text-destructive" },
};

export function BudgetProgress({ budgets, periodLabel }: BudgetProgressProps) {
  const { money, ratio } = useFormat();

  return (
    <Card aria-labelledby="budgets-title">
      <CardHeader
        title="Budget progress"
        titleId="budgets-title"
        description={periodLabel}
        action={
          <Link
            href="/budgets"
            aria-label="Manage budgets"
            className="text-success inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            Manage
          </Link>
        }
      />
      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets for this period"
          description="Budgets set a monthly limit per category so you can see overspending early."
          action={{ href: "/budgets", label: "Go to budgets" }}
        />
      ) : (
        <ul className="space-y-4">
          {budgets.map((b) => {
            const { icon: StatusIcon, className } = STATUS_STYLE[b.status];
            const statusText =
              b.status === "over"
                ? `Over budget by ${money(-b.remaining)}`
                : b.status === "warning"
                  ? `Close to limit · ${money(b.remaining)} left`
                  : `On track · ${money(b.remaining)} left`;
            return (
              <li key={b.categoryId}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="money text-caption text-muted-foreground shrink-0">
                    {money(b.spent, { fractionDigits: 0 })} of{" "}
                    {money(b.limit, { fractionDigits: 0 })} · {ratio(b.ratio)}
                  </p>
                </div>
                <ProgressBar ratio={b.ratio} label={`${b.name} budget used`} tone={b.status} />
                <p
                  className={cn(
                    "text-caption mt-1.5 flex items-center gap-1.5 font-medium",
                    className,
                  )}
                >
                  <StatusIcon aria-hidden className="size-3.5" />
                  {statusText}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
