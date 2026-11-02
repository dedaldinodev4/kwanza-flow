"use client";

import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { BudgetProgress, BudgetStatus } from "@/lib/calculations";
import { cn } from "@/lib/utils";

import { useFormat } from "@/providers/use-format";

const STATUS_STYLE: Record<BudgetStatus, { icon: typeof CheckCircle2; className: string }> = {
  ok: { icon: CheckCircle2, className: "text-success" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  over: { icon: OctagonAlert, className: "text-destructive" },
};


export function BudgetStatusLine({ progress }: { progress: BudgetProgress }) {
  const { t } = useTranslation();
  const { money } = useFormat();

  const { icon: Icon, className } = STATUS_STYLE[progress.status];
  const text =
    progress.status === "over"
      ? t("Over budget by {{amount}}", { amount: money(-progress.remaining) })
      : progress.status === "warning"
        ? t("Close to limit · {{amount}} left", { amount: money(progress.remaining) })
        : t("On track · {{amount}} left", { amount: money(progress.remaining) });
  return (
    <p className={cn("text-caption flex items-center gap-1.5 font-medium", className)}>
      <Icon aria-hidden className="size-3.5" />
      {text}
    </p>
  );
}
