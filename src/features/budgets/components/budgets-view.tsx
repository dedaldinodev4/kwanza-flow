"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Copy, PiggyBank, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout/page-header";
import { Button, Card, CardHeader } from "@/components/ui";

import { budgetProgressForMonth, budgetTotals, unbudgetedSpending } from "@/lib/calculations";
import { categoriesOfType } from "@/lib/categories";
import { monthOf, shiftMonth } from "@/lib/dates/iso";
import { formatMonth } from "@/lib/formatters/date";
import { useAppActions, useAppData } from "@/providers/app-data-provider";
import { useFormat } from "@/providers/use-format";
import type { Budget } from "@/types/domain";

import { copyBudgets, deleteBudget } from "../services/budget-service";

import { BudgetCard } from "./budget-card";
import type { BudgetFormMode } from "./budget-form-dialog";
import { BudgetSummary } from "./budget-summary";
import { MonthSwitcher } from "./month-switcher";


const BudgetFormDialog = dynamic(
  () => import("./budget-form-dialog").then((m) => m.BudgetFormDialog),
  { ssr: false },
);
const DeleteBudgetDialog = dynamic(
  () => import("./delete-budget-dialog").then((m) => m.DeleteBudgetDialog),
  { ssr: false },
);

const HEADER = { title: "Budgets", description: "Monthly limits by category." };

export function BudgetsView() {
  const state = useAppData();
  const { tryMutate } = useAppActions();
  const { money } = useFormat();
  const [selected, setSelected] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<BudgetFormMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const listRef = useRef<HTMLHeadingElement>(null);
  const deleted = useRef(false);

  const data = state.status === "ready" ? state.data : null;
  const currentMonth = state.status === "ready" ? monthOf(state.today) : "";
  const month = selected ?? currentMonth;

  const view = useMemo(() => {
    if (!data) return null;
    const progress = budgetProgressForMonth(data.budgets, data.transactions, month);
    const idByCategory = new Map(
      data.budgets.filter((b) => b.month === month).map((b) => [b.categoryId, b]),
    );
    return {
      progress,
      budgetFor: (categoryId: string) => idByCategory.get(categoryId)!,
      totals: budgetTotals(progress),
      unbudgeted: unbudgetedSpending(data.budgets, data.transactions, month),
      takenCategoryIds: [...idByCategory.keys()],
      // Only offer "copy" when it would actually add something (last month has budgets this month lacks).
      copyableCount: data.budgets.filter(
        (b) => b.month === shiftMonth(month, -1) && !idByCategory.has(b.categoryId),
      ).length,
    };
  }, [data, month]);

  if (state.status !== "ready" || !view) {
    return (
      <div aria-busy="true" className="space-y-6">
        <PageHeader {...HEADER} />
        <span className="sr-only">Loading your budgets…</span>
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const monthLabel = formatMonth(month);
  const previousLabel = formatMonth(shiftMonth(month, -1));
  const allBudgeted = view.takenCategoryIds.length >= categoriesOfType("expense").length;

  function copyFromPrevious() {
    const result = tryMutate((d) =>
      copyBudgets(d, shiftMonth(month, -1), month, { now: new Date().toISOString() }),
    );
    if (!result.ok && result.reason === "rejected") toast.error(result.error);
    else if (!result.ok)
      toast.warning(`${result.error} The copied budgets are kept for this session only.`);
    else toast.success(`Copied budgets from ${previousLabel}`);
  }

  function confirmDelete(target: Budget) {
    const result = tryMutate((d) => deleteBudget(d, target.id));
    deleted.current = true;
    if (result.ok) toast.success("Budget deleted");
    else if (result.reason === "not-saved")
      toast.warning(`${result.error} The deletion is kept for this session only.`);
    else toast.error(result.error);
  }

  const addButton = (
    <Button
      disabled={allBudgeted}
      onClick={() =>
        setFormMode({ kind: "create", month, takenCategoryIds: view.takenCategoryIds })
      }
    >
      <Plus aria-hidden className="size-4" />
      Add budget
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader {...HEADER} actions={addButton} />
      {allBudgeted && (
        <p className="text-caption text-muted-foreground -mt-3">
          Every expense category already has a budget for {monthLabel}.
        </p>
      )}

      <MonthSwitcher month={month} currentMonth={currentMonth} onChange={setSelected} />

      {view.progress.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={`No budgets for ${monthLabel}`}
          description="A budget is a monthly spending limit for one category. You will see your progress and any overspending as soon as you add one."
        />
      ) : (
        <>
          <BudgetSummary totals={view.totals} monthLabel={monthLabel} />
          <section aria-labelledby="budget-list-title">
            <h2
              id="budget-list-title"
              ref={listRef}
              tabIndex={-1}
              className="text-section mb-3 outline-none"
            >
              Budgets for {monthLabel}
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {view.progress.map((p) => {
                const budget = view.budgetFor(p.categoryId);
                return (
                  <BudgetCard
                    key={budget.id}
                    progress={p}
                    onEdit={() => setFormMode({ kind: "edit", budget })}
                    onDelete={() => setDeleteTarget(budget)}
                  />
                );
              })}
            </ul>
          </section>
        </>
      )}

      {view.copyableCount > 0 && (
        <div>
          <Button variant="outline" onClick={copyFromPrevious}>
            <Copy aria-hidden className="size-4" />
            Copy budgets from {previousLabel}
          </Button>
        </div>
      )}

      {view.unbudgeted.length > 0 && (
        <Card aria-labelledby="unbudgeted-title">
          <CardHeader
            title="Spending without a budget"
            titleId="unbudgeted-title"
            description={`Spent in ${monthLabel} on categories with no limit set`}
          />
          <ul className="divide-y">
            {view.unbudgeted.map((row) => (
              <li
                key={row.categoryId}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span>{row.name}</span>
                <span className="money font-medium">{money(row.spent)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {formMode && <BudgetFormDialog mode={formMode} onClose={() => setFormMode(null)} />}
      {deleteTarget && (
        <DeleteBudgetDialog
          budget={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          onCloseAutoFocus={(event) => {
            if (deleted.current) {
              event.preventDefault();
              listRef.current?.focus();
              deleted.current = false;
            }
          }}
        />
      )}
    </div>
  );
}
