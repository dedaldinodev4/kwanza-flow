"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, ProgressBar } from "@/components/ui";
import type { BudgetProgress } from "@/lib/calculations";
import { useFormat } from "@/providers/use-format";
import { BudgetStatusLine } from "./budget-status";


interface BudgetCardProps {
  progress: BudgetProgress;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ progress, onEdit, onDelete }: BudgetCardProps) {
  const { t } = useTranslation();
  const { money, ratio } = useFormat();
  const { name } = progress;


  return (
    <li className="rounded-card bg-card shadow-card border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{t(name)}</h3>
          <p className="money text-caption text-muted-foreground">
            {t("{{spent}} of {{limit}} · {{percent}}",
              {
                spent: money(progress.spent),
                limit: money(progress.limit),
                percent: ratio(progress.ratio)
              })}
          </p>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="icon"
            aria-label={t("Edit {{name}} budget", { name })}
            onClick={onEdit}
          >
            <Pencil aria-hidden className="size-4" />
          </Button>
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="icon"
            aria-label={t("Delete {{name}} budget", { name })}
            onClick={onDelete}
          >
            <Trash2 aria-hidden className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar
          ratio={progress.ratio}
          label={t("{{name}} budget used", { name })}
          tone={progress.status}
        />
      </div>
      <div className="mt-2">
        <BudgetStatusLine progress={progress} />
      </div>
    </li>
  );
}
