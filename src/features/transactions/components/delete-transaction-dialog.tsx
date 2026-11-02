"use client";

import { useTranslation } from "react-i18next";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

import { useCategoryName, useDemoText } from "@/hooks/use-i18n";
import { useFormat } from "@/providers/use-format";
import type { Transaction } from "@/types/domain";

interface DeleteTransactionDialogProps {
  transaction: Transaction | null;
  today: string;
  onConfirm: (t: Transaction) => void;
  onCancel: () => void;
  onCloseAutoFocus: (event: Event) => void;
}

export function DeleteTransactionDialog({
  transaction,
  today,
  onConfirm,
  onCancel,
  onCloseAutoFocus,
}: DeleteTransactionDialogProps) {

  const { t } = useTranslation();
  const { signed, day } = useFormat();
  const categoryName = useCategoryName();
  const demoText = useDemoText();

  return (
    <AlertDialog open={transaction !== null} onOpenChange={(open) => !open && onCancel()}>
      {transaction && (
        <AlertDialogContent
          title={t("Delete this transaction?")}
          description={t(
            "This permanently removes it. Your balance, totals, charts and budgets will update. This cannot be undone.",
          )}
          confirmLabel={t("Delete transaction")}
          onConfirm={() => onConfirm(transaction)}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <dl className="rounded-control bg-muted space-y-1 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("Description")}</dt>
              <dd className="font-medium">{demoText(transaction.description)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("Amount")}</dt>
              <dd className="money font-medium">{signed(transaction.amount, transaction.type)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("Category · date")}</dt>
              <dd>
                {categoryName(transaction.categoryId)} · {day(transaction.date, today.slice(0, 4))}
              </dd>
            </div>
          </dl>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
