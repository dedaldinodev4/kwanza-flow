"use client";

import {
  AlertTriangle, CheckCircle2,
  Pencil, Plus, Trash2
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, ProgressBar } from "@/components/ui";
import { goalProgress, isGoalOverdue } from "@/lib/calculations";
import { formatDay } from "@/lib/formatters/date";
import { useFormat } from "@/providers/use-format";
import type { SavingsGoal } from "@/types/domain";
import { useLanguage } from "@/providers/i18n-provider";

interface GoalCardProps {
  goal: SavingsGoal;
  today: string;
  onContribute: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, today, onContribute, onEdit, onDelete }: GoalCardProps) {
  const { t } = useTranslation()
  const { money, ratio, month } = useFormat();
  const { language } = useLanguage()
  const progress = goalProgress(goal);
  const overdue = isGoalOverdue(goal, today);
  const year = today.slice(0, 4);

  return (
    <li className="rounded-card bg-card shadow-card border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{t("{{name}}", { name: goal.name })}</h3>
          <p className="money text-caption text-muted-foreground">
            {t("{{amount}} of {{target}}", { amount: money(goal.currentAmount), target: money(goal.targetAmount) })}
          </p>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <Button variant="ghost" size="icon" aria-label={t("Edit {{name}}", { name: goal.name })} onClick={onEdit}>
            <Pencil aria-hidden className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("Delete {{name}}", { name: goal.name })} onClick={onDelete}>
            <Trash2 aria-hidden className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          ratio={progress.ratio}
          label={t("{{name}} progress", { name: goal.name })}
          tone={progress.completed ? "complete" : overdue ? "warning" : "ok"}
        />
      </div>

      <div className="text-caption mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-muted-foreground">{ratio(progress.ratio)}</span>
        {progress.completed ? (
          <span className="text-success flex items-center gap-1.5 font-medium">
            <CheckCircle2 aria-hidden className="size-3.5" />
            {t("Goal reached")}
          </span>
        ) : (
          <span className="money text-muted-foreground">
            {t("{{amount}} to go · by {{date}}", {
              amount: money(progress.remaining),
              date: goal.targetDate ? formatDay(goal.targetDate, year, language) : ""
            })}
          </span>
        )}
      </div>

      {overdue && (
        <p className="text-caption text-warning mt-2 flex items-center gap-1.5 font-medium">
          <AlertTriangle aria-hidden className="size-3.5" />
          {t("Target date passed")}
        </p>
      )}

      {!progress.completed && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          aria-label={t("Add money to {{name}}", { name: goal.name })}
          onClick={onContribute}
        >
          <Plus aria-hidden className="size-4" />
          {t("Add money")}
        </Button>
      )}
    </li>
  );
}
