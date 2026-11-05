"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { useCategoryName, useDemoText } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { useFormat } from "@/providers/use-format";
import type { Transaction } from "@/types/domain";

interface TransactionListProps {
  transactions: Transaction[];
  today: string;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

function Amount({ tx }: { tx: Transaction }) {
  const { t } = useTranslation();
  const { signed } = useFormat();
  return (
    <span
      className={cn(
        "money font-semibold",
        tx.type === "income" ? "text-success" : "text-destructive",
      )}
    >
      <span className="sr-only">{t(tx.type === "income" ? "Income" : "Expense")}: </span>
      {signed(tx.amount, tx.type)}
    </span>
  );
}

function Actions({
  tx,
  onEdit,
  onDelete,
}: Pick<TransactionListProps, "onEdit" | "onDelete"> & { tx: Transaction }) {
  const { t } = useTranslation();
  const demoText = useDemoText();
  const name = demoText(tx.description);

  return (
    <div className="flex items-center gap-1">
      <Button
        className="cursor-pointer"
        variant="ghost"
        size="icon"
        aria-label={t("Edit {{name}}", { name })}
        onClick={() => onEdit(tx)}
      >
        <Pencil aria-hidden className="size-4" />
      </Button>
      <Button
        className="cursor-pointer"
        variant="ghost"
        size="icon"
        aria-label={t("Delete {{name}}", { name })}
        onClick={() => onDelete(tx)}
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>
    </div>
  );
}


export function TransactionList({ transactions, today, onEdit, onDelete }: TransactionListProps) {
  const { t } = useTranslation();
  const { day } = useFormat();
  const categoryName = useCategoryName();
  const demoText = useDemoText();
  const year = today.slice(0, 4);

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t("Transactions")}</caption>
          <thead>
            <tr className="text-caption text-muted-foreground border-b">
              <th scope="col" className="py-3 pr-4 font-medium">
                {t("Date")}
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                {t("Description")}
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                {t("Category")}
              </th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">
                {t("Amount")}
              </th>
              <th scope="col" className="py-3 text-right font-medium">
                <span className="sr-only">{t("Actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0">
                <td className="text-muted-foreground py-[calc(var(--row-pad)-0.25rem)] pr-4 whitespace-nowrap">
                  {day(tx.date, year)}
                </td>
                <th
                  scope="row"
                  className="max-w-xs py-[calc(var(--row-pad)-0.25rem)] pr-4 font-medium"
                >
                  <span className="block truncate">{demoText(tx.description)}</span>
                  {tx.notes && (
                    <span className="text-caption text-muted-foreground block truncate font-normal">
                      {tx.notes}
                    </span>
                  )}
                </th>
                <td className="py-[calc(var(--row-pad)-0.25rem)] pr-4 whitespace-nowrap">
                  {categoryName(tx.categoryId)}
                </td>
                <td className="py-[calc(var(--row-pad)-0.25rem)] pr-4 text-right whitespace-nowrap">
                  <Amount tx={tx} />
                </td>
                <td className="py-[calc(var(--row-pad)-0.25rem)]">
                  <div className="flex justify-end">
                    <Actions tx={tx} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={t("Transactions")} className="divide-y md:hidden">
        {transactions.map((tx) => (
          <li key={tx.id} className="py-(--row-pad)">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium">{demoText(tx.description)}</p>
              <p className="shrink-0 text-sm">
                <Amount tx={tx} />
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-caption text-muted-foreground min-w-0 truncate">
                {categoryName(tx.categoryId)} · {day(tx.date, year)}
              </p>
              <Actions tx={tx} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
