"use client";

import { useTranslation } from "react-i18next";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

import { useCategoryName } from "@/hooks/use-i18n";
import { useLanguage } from "@/providers/i18n-provider";
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
  const { language } = useLanguage();
  const categoryName = useCategoryName();

  const name = budget ? (categoryName(budget.categoryId) ?? t("this category")) : "";
  return (
    <AlertDialog open={budget !== null} onOpenChange={(open) => !open && onCancel()}>
      {budget && (
        <AlertDialogContent
          title={t("Delete this budget?")}
          description={t("The {{category}} limit for {{month}} ({{amount}}) will be removed. Your transactions are not affected.", {
            amount: money(budget.limit),
            category: name,
            month: formatMonth(budget.month, language)
          })}
          confirmLabel={t("Delete budget")}
          onConfirm={() => onConfirm(budget)}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </AlertDialog>
  );
}
