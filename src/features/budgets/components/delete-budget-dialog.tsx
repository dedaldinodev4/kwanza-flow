"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { getCategory } from "@/lib/categories";
import { formatMonth } from "@/lib/formatters/date";
import { useFormat } from "@/providers/use-format";
import type { Budget } from "@/types/domain";

interface DeleteBudgetDialogProps {
  budget: Budget | null;
  onConfirm: (b: Budget) => void;
  onCancel: () => void;
  onCloseAutoFocus: (event: Event) => void;
}

export function DeleteBudgetDialog({
  budget,
  onConfirm,
  onCancel,
  onCloseAutoFocus,
}: DeleteBudgetDialogProps) {
  const { money } = useFormat();
  const name = budget ? (getCategory(budget.categoryId)?.name ?? "this category") : "";
  return (
    <AlertDialog open={budget !== null} onOpenChange={(open) => !open && onCancel()}>
      {budget && (
        <AlertDialogContent
          title="Delete this budget?"
          description={`The ${name} limit for ${formatMonth(budget.month)} (${money(budget.limit)}) will be removed. Your transactions are not affected.`}
          confirmLabel="Delete budget"
          onConfirm={() => onConfirm(budget)}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </AlertDialog>
  );
}
