"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, SearchX } from "lucide-react";

import { EmptyState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout/page-header";
import { Button, Card } from "@/components/ui";

import { useAppActions, useAppData } from "@/providers/app-data-provider";
import type { Transaction } from "@/types/domain";

import { useTransactionQuery } from "../hooks/use-transaction-query";
import { deleteTransaction } from "../services/transaction-service";
import { queryTransactions } from "../utils/transaction-query";
import { Pagination } from "./pagination";
import { TransactionFilters } from "./transaction-filters";
import type { FormMode } from "./transaction-form-dialog";
import { TransactionList } from "./transaction-list";


const TransactionFormDialog = dynamic(
  () => import("./transaction-form-dialog").then((m) => m.TransactionFormDialog),
  { ssr: false },
);
const DeleteTransactionDialog = dynamic(
  () => import("./delete-transaction-dialog").then((m) => m.DeleteTransactionDialog),
  { ssr: false },
);

const HEADER = {
  title: "Transactions",
  description: "Every income and expense in one place.",
};

export function TransactionsView() {
  const state = useAppData();
  const { tryMutate } = useAppActions();
  const [query, dispatch] = useTransactionQuery();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const deleted = useRef(false);

  const transactions = state.status === "ready" ? state.data.transactions : null;
  const result = useMemo(
    () => (transactions ? queryTransactions(transactions, query) : null),
    [transactions, query],
  );

  if (state.status !== "ready" || !result) {
    return (
      <div aria-busy="true" className="space-y-6">
        <PageHeader {...HEADER} />
        <span className="sr-only">Loading your transactions…</span>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  function confirmDelete(target: Transaction) {
    const outcome = tryMutate((data) => deleteTransaction(data, target.id));
    deleted.current = true; // after a delete, focus moves to the results summary (the row is gone)
    if (outcome.ok) toast.success("Transaction deleted");
    else if (outcome.reason === "not-saved")
      toast.warning(`${outcome.error} The deletion is kept for this session only.`);
    else toast.error(outcome.error);
  }

  const addButton = (
    <Button onClick={() => setFormMode({ kind: "create" })}>
      <Plus aria-hidden className="size-4" />
      Add transaction
    </Button>
  );

  const summary =
    result.totalMatches === 0
      ? "No transactions to show"
      : `Showing ${result.firstIndex}–${result.lastIndex} of ${result.totalMatches} ${result.totalMatches === 1 ? "transaction" : "transactions"}${result.hasActiveFilters ? " matching your filters" : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader {...HEADER} actions={addButton} />

      {state.data.transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Add your first income or expense to start tracking your money."
        />
      ) : (
        <>
          <Card aria-label="Filters">
            <TransactionFilters query={query} dispatch={dispatch} result={result} />
          </Card>

          <Card aria-label="Results">
            <p
              ref={summaryRef}
              tabIndex={-1}
              aria-live="polite"
              className="text-muted-foreground mb-3 text-sm outline-none"
            >
              {summary}
            </p>
            {result.items.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={
                  query.search.trim()
                    ? `No matches for “${query.search.trim()}”`
                    : "No matching transactions"
                }
                description={
                  result.rangeError
                    ? "Fix the date range to see results."
                    : "Try different words, or clear the filters to see everything."
                }
              />
            ) : (
              <>
                <TransactionList
                  transactions={result.items}
                  today={state.today}
                  onEdit={(t) => setFormMode({ kind: "edit", transaction: t })}
                  onDelete={setDeleteTarget}
                />
                <Pagination
                  page={result.page}
                  pageCount={result.pageCount}
                  onPageChange={(page) => dispatch({ type: "page", value: page })}
                />
              </>
            )}
          </Card>
        </>
      )}

      {formMode && <TransactionFormDialog mode={formMode} onClose={() => setFormMode(null)} />}
      {deleteTarget && (
        <DeleteTransactionDialog
          transaction={deleteTarget}
          today={state.today}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          onCloseAutoFocus={(event) => {
            if (deleted.current) {
              event.preventDefault();
              summaryRef.current?.focus();
              deleted.current = false;
            }
          }}
        />
      )}
    </div>
  );
}
