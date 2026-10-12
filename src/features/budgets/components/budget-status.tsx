"use client";

import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import type { BudgetProgress, BudgetStatus } from "@/lib/calculations";
import { cn } from "@/lib/utils";

import { useFormat } from "@/providers/use-format";

const STATUS_STYLE: Record<BudgetStatus, { icon: typeof CheckCircle2; className: string }> = {
  ok: { icon: CheckCircle2, className: "text-success" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  over: { icon: OctagonAlert, className: "text-destructive" },
};


export function BudgetStatusLine({ progress }: { progress: BudgetProgress }) {
  const { money } = useFormat();
  const { icon: Icon, className } = STATUS_STYLE[progress.status];
  const text =
    progress.status === "over"
      ? `Over budget by ${money(-progress.remaining)}`
      : progress.status === "warning"
        ? `Close to limit · ${money(progress.remaining)} left`
        : `On track · ${money(progress.remaining)} left`;
  return (
    <p className={cn("text-caption flex items-center gap-1.5 font-medium", className)}>
      <Icon aria-hidden className="size-3.5" />
      {text}
    </p>
  );
}
