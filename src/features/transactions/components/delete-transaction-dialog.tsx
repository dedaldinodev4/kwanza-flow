"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { getCategory } from "@/lib/categories";
import { formatDay } from "@/lib/formatters/date";
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
  const { signed } = useFormat();
  return (
    <AlertDialog open={transaction !== null} onOpenChange={(open) => !open && onCancel()}>
      {transaction && (
        <AlertDialogContent
          title="Delete this transaction?"
          description="This permanently removes it. Your balance, totals, charts and budgets will update. This cannot be undone."
          confirmLabel="Delete transaction"
          onConfirm={() => onConfirm(transaction)}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <dl className="rounded-control bg-muted space-y-1 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Description</dt>
              <dd className="font-medium">{transaction.description}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="money font-medium">{signed(transaction.amount, transaction.type)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Category · date</dt>
              <dd>
                {getCategory(transaction.categoryId)?.name ?? "Unknown category"} ·{" "}
                {formatDay(transaction.date, today.slice(0, 4))}
              </dd>
            </div>
          </dl>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
