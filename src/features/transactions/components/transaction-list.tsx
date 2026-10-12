"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { getCategory } from "@/lib/categories";
import { formatDay } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";
import { useFormat } from "@/providers/use-format";
import type { Transaction } from "@/types/domain";

interface TransactionListProps {
  transactions: Transaction[];
  today: string;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

function Amount({ t }: { t: Transaction }) {
  const { signed } = useFormat();
  return (
    <span
      className={cn(
        "money font-semibold",
        t.type === "income" ? "text-success" : "text-destructive",
      )}
    >
      <span className="sr-only">{t.type === "income" ? "Income: " : "Expense: "}</span>
      {signed(t.amount, t.type)}
    </span>
  );
}

function Actions({
  t,
  onEdit,
  onDelete,
}: Pick<TransactionListProps, "onEdit" | "onDelete"> & { t: Transaction }) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${t.description}`}
        onClick={() => onEdit(t)}
      >
        <Pencil aria-hidden className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${t.description}`}
        onClick={() => onDelete(t)}
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>
    </div>
  );
}


export function TransactionList({ transactions, today, onEdit, onDelete }: TransactionListProps) {
  const year = today.slice(0, 4);
  const categoryName = (id: string) => getCategory(id)?.name ?? "Unknown category";

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Transactions</caption>
          <thead>
            <tr className="text-caption text-muted-foreground border-b">
              <th scope="col" className="py-3 pr-4 font-medium">
                Date
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Description
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Category
              </th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">
                  {formatDay(t.date, year)}
                </td>
                <th scope="row" className="max-w-xs py-2 pr-4 font-medium">
                  <span className="block truncate">{t.description}</span>
                  {t.notes && (
                    <span className="text-caption text-muted-foreground block truncate font-normal">
                      {t.notes}
                    </span>
                  )}
                </th>
                <td className="py-2 pr-4 whitespace-nowrap">{categoryName(t.categoryId)}</td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">
                  <Amount t={t} />
                </td>
                <td className="py-2">
                  <div className="flex justify-end">
                    <Actions t={t} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label="Transactions" className="divide-y md:hidden">
        {transactions.map((t) => (
          <li key={t.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium">{t.description}</p>
              <p className="shrink-0 text-sm">
                <Amount t={t} />
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-caption text-muted-foreground min-w-0 truncate">
                {categoryName(t.categoryId)} · {formatDay(t.date, year)}
              </p>
              <Actions t={t} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
