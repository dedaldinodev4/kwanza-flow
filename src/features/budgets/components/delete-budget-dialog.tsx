"use client";

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { money } = useFormat();
  const name = budget ? (getCategory(budget.categoryId)?.name ?? "this category") : "";
  return (
    <AlertDialog open={budget !== null} onOpenChange={(open) => !open && onCancel()}>
      {budget && (
        <AlertDialogContent
          title={t("Delete this budget?")}
          description={t("`The {{name}} limit for {{month}} ({{limit}}) will be removed. Your transactions are not affected.", {
            limit: money(budget.limit),
            name: name,
            month: formatMonth(budget.month)
          })}
          confirmLabel={t("Delete budget")}
          onConfirm={() => onConfirm(budget)}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </AlertDialog>
  );
}
