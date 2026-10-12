"use client";

import { Pencil, Trash2 } from "lucide-react";

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
  const { money, ratio } = useFormat();
  return (
    <li className="rounded-card bg-card shadow-card border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{progress.name}</h3>
          <p className="money text-caption text-muted-foreground">
            {money(progress.spent)} of {money(progress.limit)} · {ratio(progress.ratio)}
          </p>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${progress.name} budget`}
            onClick={onEdit}
          >
            <Pencil aria-hidden className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${progress.name} budget`}
            onClick={onDelete}
          >
            <Trash2 aria-hidden className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar
          ratio={progress.ratio}
          label={`${progress.name} budget used`}
          tone={progress.status}
        />
      </div>
      <div className="mt-2">
        <BudgetStatusLine progress={progress} />
      </div>
    </li>
  );
}
