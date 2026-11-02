"use client";

import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { useFormat } from "@/providers/use-format";
import type { Transaction } from "@/types/domain";
import { useCategoryName, useDemoText } from "@/hooks/use-i18n";

interface RecentTransactionsProps {
  transactions: Transaction[];
  periodLabel: string;
  today: string;
}

export function RecentTransactions({ transactions, periodLabel, today }: RecentTransactionsProps) {
  const { t } = useTranslation();
  const { signed, day } = useFormat();
  const categoryName = useCategoryName();
  const demoText = useDemoText();

  return (
    <Card aria-labelledby="recent-title" className="lg:col-span-2">
      <CardHeader
        title={t("Recent transactions")}
        titleId="recent-title"
        description={t(periodLabel)}
        action={
          <Link
            href="/transactions"
            aria-label={t("View all transactions")}
            className="text-success inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("View all")}
          </Link>
        }
      />
      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={t("No transactions in this period")}
          description={t("Pick another period, or add transactions to see them here.")}
          action={{ href: "/transactions", label: t("Go to transactions") }}
        />
      ) : (
        <ul className="divide-y">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-4 py-(--row-pad)">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{demoText(tx.description)}</p>
                <p className="text-caption text-muted-foreground truncate">
                  {categoryName(tx.categoryId)} · {day(tx.date, today.slice(0, 4))}
                </p>
              </div>
              <p
                className={cn(
                  "money shrink-0 text-sm font-semibold",
                  tx.type === "income" ? "text-success" : "text-destructive",
                )}
              >
                <span className="sr-only">{t(tx.type === "income" ? "Income" : "Expense")}: </span>
                {signed(tx.amount, tx.type)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
