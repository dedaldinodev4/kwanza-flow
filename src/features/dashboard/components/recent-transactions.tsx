"use client";

import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";

import { getCategory } from "@/lib/categories";
import { formatDay } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";
import { useFormat } from "@/providers/use-format";
import type { Transaction } from "@/types/domain";

interface RecentTransactionsProps {
  transactions: Transaction[];
  periodLabel: string;
  today: string;
}

export function RecentTransactions({ transactions, periodLabel, today }: RecentTransactionsProps) {
  const { signed } = useFormat();
  return (
    <Card aria-labelledby="recent-title" className="lg:col-span-2">
      <CardHeader
        title="Recent transactions"
        titleId="recent-title"
        description={periodLabel}
        action={
          <Link
            href="/transactions"
            aria-label="View all transactions"
            className="text-success inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            View all
          </Link>
        }
      />
      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions in this period"
          description="Pick another period, or add transactions to see them here."
          action={{ href: "/transactions", label: "Go to transactions" }}
        />
      ) : (
        <ul className="divide-y">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.description}</p>
                <p className="text-caption text-muted-foreground truncate">
                  {getCategory(t.categoryId)?.name ?? "Unknown category"} ·{" "}
                  {formatDay(t.date, today.slice(0, 4))}
                </p>
              </div>
              <p
                className={cn(
                  "money shrink-0 text-sm font-semibold",
                  t.type === "income" ? "text-success" : "text-destructive",
                )}
              >
                <span className="sr-only">{t.type === "income" ? "Income: " : "Expense: "}</span>
                {signed(t.amount, t.type)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
