import { getCategory } from "@/lib/categories";
import { monthRange } from "@/lib/dates/iso";
import { monthsInPeriod, type Period } from "@/lib/dates/periods";
import type { Budget, Transaction } from "@/types/domain";
import { filterByPeriod } from "./transactions";

export const WARNING_RATIO = 0.8;

export type BudgetStatus = "ok" | "warning" | "over";

export interface BudgetProgress {
  categoryId: string;
  name: string;
  limit: number;
  spent: number;
  remaining: number;
  ratio: number;
  status: BudgetStatus;
}

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent > limit) return "over";
  return spent >= limit * WARNING_RATIO ? "warning" : "ok";
}

function toProgress(categoryId: string, limit: number, spent: number): BudgetProgress {
  return {
    categoryId,
    name: getCategory(categoryId)?.name ?? "Unknown category",
    limit,
    spent,
    remaining: limit - spent,
    ratio: limit > 0 ? spent / limit : 0,
    status: budgetStatus(spent, limit),
  };
}

/** Spending against one month's budgets. Only expenses in the budget's category and month count. */
export function budgetProgressForMonth(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  month: string,
): BudgetProgress[] {
  const monthTransactions = filterByPeriod(transactions, monthRange(month));
  return budgets
    .filter((b) => b.month === month)
    .map((b) => {
      const spent = monthTransactions
        .filter((t) => t.type === "expense" && t.categoryId === b.categoryId)
        .reduce((total, t) => total + t.amount, 0);
      return toProgress(b.categoryId, b.limit, spent);
    })
    .sort(byUrgency);
}

/**
 * Budgets across a (possibly multi-month) period: per category, limits and spending are
 * summed over the months in the period that HAVE a budget for that category. Spending in a
 * month without a budget is not counted against a limit that did not exist.
 */
export function budgetProgressForPeriod(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  period: Pick<Period, "start" | "end">,
): BudgetProgress[] {
  const totals = new Map<string, { limit: number; spent: number }>();
  for (const month of monthsInPeriod(period)) {
    for (const p of budgetProgressForMonth(budgets, transactions, month)) {
      const current = totals.get(p.categoryId) ?? { limit: 0, spent: 0 };
      totals.set(p.categoryId, { limit: current.limit + p.limit, spent: current.spent + p.spent });
    }
  }
  return [...totals.entries()]
    .map(([categoryId, { limit, spent }]) => toProgress(categoryId, limit, spent))
    .sort(byUrgency);
}

/** Most at-risk first; ties by name so the order is stable. */
function byUrgency(a: BudgetProgress, b: BudgetProgress): number {
  return b.ratio - a.ratio || a.name.localeCompare(b.name);
}

export interface BudgetTotals {
  limit: number;
  spent: number;
  remaining: number;
  overCount: number;
}

export function budgetTotals(progress: readonly BudgetProgress[]): BudgetTotals {
  const limit = progress.reduce((t, p) => t + p.limit, 0);
  const spent = progress.reduce((t, p) => t + p.spent, 0);
  return {
    limit,
    spent,
    remaining: limit - spent,
    overCount: progress.filter((p) => p.status === "over").length,
  };
}

export interface UnbudgetedSpending {
  categoryId: string;
  name: string;
  spent: number;
}

/**
 * Expense categories that have spending in `month` but no budget for it, largest first.
 * Shown beside the budgets so spending that is not being tracked is visible, not hidden.
 */
export function unbudgetedSpending(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  month: string,
): UnbudgetedSpending[] {
  const budgeted = new Set(budgets.filter((b) => b.month === month).map((b) => b.categoryId));
  const totals = new Map<string, number>();
  for (const t of filterByPeriod(transactions, monthRange(month))) {
    if (t.type === "expense" && !budgeted.has(t.categoryId)) {
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    }
  }
  return [...totals.entries()]
    .map(([categoryId, spent]) => ({
      categoryId,
      name: getCategory(categoryId)?.name ?? "Unknown category",
      spent,
    }))
    .sort((a, b) => b.spent - a.spent || a.name.localeCompare(b.name));
}

