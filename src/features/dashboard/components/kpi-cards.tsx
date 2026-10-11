"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatDay } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";
import { useFormat } from "@/providers/use-format";
import type { CashFlowSummary } from "@/lib/calculations";

interface KpiCardsProps {
  balance: number;
  asOf: string;
  summary: CashFlowSummary;
  periodLabel: string;
}

interface KpiProps {
  label: string;
  hint: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}

/** Mobile: compact label-left / value-right rows. From `sm` up: stacked label over value. */
function Kpi({ label, hint, value, valueClassName, icon }: KpiProps) {
  return (
    <div className="rounded-card bg-card shadow-card flex items-center justify-between gap-3 border p-4 sm:flex-col sm:items-start sm:justify-start sm:gap-2 sm:p-5">
      <dt className="flex min-w-0 flex-col">
        <span className="text-label text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-caption text-muted-foreground">{hint}</span>
      </dt>
      <dd
        className={cn(
          "money sm:text-kpi text-right text-xl font-semibold tracking-tight sm:text-left",
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function KpiCards({ balance, asOf, summary, periodLabel }: KpiCardsProps) {
  const { money, net } = useFormat();
  const NetIcon = summary.net > 0 ? TrendingUp : summary.net < 0 ? TrendingDown : Minus;
  const netTone = summary.net > 0 ? "text-success" : summary.net < 0 ? "text-destructive" : "";

  return (
    <section aria-label="Key figures">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Current balance" hint={`As of ${formatDay(asOf)}`} value={money(balance)} />
        <Kpi label="Income" hint={periodLabel} value={money(summary.income)} />
        <Kpi label="Expenses" hint={periodLabel} value={money(summary.expenses)} />
        <Kpi
          label="Net cash flow"
          hint={periodLabel}
          value={net(summary.net)}
          valueClassName={netTone}
          icon={<NetIcon aria-hidden className={cn("size-4", netTone)} />}
        />
      </dl>
    </section>
  );
}
