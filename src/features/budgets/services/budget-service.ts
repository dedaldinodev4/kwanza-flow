import { getCategory } from "@/lib/categories";
import { formatMonth } from "@/lib/formatters/date";
import { generateId } from "@/lib/generate-id";
import { budgetSchema, type AppData, type Budget } from "@/types/domain";
import type { BudgetInput } from "../schemas/budget-form";

/*
 * Pure budget services: (data, input) → new data, or a reason for refusing. Unlike the form schema,
 * these enforce the rules the UI cannot be trusted with: one budget per category per month,
 * expense categories only, valid amounts.
 */

export type BudgetResult =
  { ok: true; data: AppData; budget: Budget } | { ok: false; error: string };
export type CopyResult = { ok: true; data: AppData; copied: number } | { ok: false; error: string };

interface Context {
  now: string;
  makeId?: () => string;
}

function validate(candidate: Budget): string | null {
  if (getCategory(candidate.categoryId)?.type !== "expense")
    return "Budgets can only be set for expense categories.";

  return budgetSchema.safeParse(candidate).success ? null : "The budget details are not valid.";
}

//* createBudget - create a budget *//
export function createBudget(data: AppData, input: BudgetInput, ctx: Context): BudgetResult {
  const budget: Budget = {
    id: (ctx.makeId ?? (() => generateId("budget")))(),
    ...input,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
  const error = validate(budget);
  if (error)
    return { ok: false, error };

  if (data.budgets.some((b) => b.categoryId === input.categoryId && b.month === input.month)) {
    const name = getCategory(input.categoryId)?.name ?? "that category";
    return {
      ok: false,
      error: `There is already a ${name} budget for ${formatMonth(input.month)}.`,
    };
  }

  if (data.budgets.some((b) => b.id === budget.id))
    return { ok: false, error: "Duplicate budget id." };

  return {
    ok: true,
    data: { ...data, budgets: [...data.budgets, budget] },
    budget
  };
}

//* updateBudgetLimit - only the limit can change: category and month are what identify a budget. *//
export function updateBudgetLimit(
  data: AppData,
  id: string,
  limit: number,
  ctx: Context,
): BudgetResult {
  const existing = data.budgets.find((b) => b.id === id);
  if (!existing)
    return { ok: false, error: "That budget no longer exists." };

  const updated: Budget = { ...existing, limit, updatedAt: ctx.now };
  const error = validate(updated);

  if (error)
    return { ok: false, error };

  return {
    ok: true,
    data: { ...data, budgets: data.budgets.map((b) => (b.id === id ? updated : b)) },
    budget: updated,
  };
}

//* deleteBudget - delete a budget *//
export function deleteBudget(data: AppData, id: string): BudgetResult {
  const existing = data.budgets.find((b) => b.id === id);
  if (!existing)
    return { ok: false, error: "That budget no longer exists." };

  return {
    ok: true,
    data: { ...data, budgets: data.budgets.filter((b) => b.id !== id) },
    budget: existing,
  };
}


//copyBudgets - Copies every budget of `fromMonth` into `toMonth`, skipping categories that already have one,
// so existing budgets are never overwritten.
export function copyBudgets(
  data: AppData,
  fromMonth: string,
  toMonth: string,
  ctx: Context,
): CopyResult {
  if (fromMonth === toMonth)
    return {
      ok: false,
      error: "Choose a different month to copy from."
    };

  const source = data.budgets.filter((b) => b.month === fromMonth);
  if (source.length === 0)
    return { ok: false, error: `There are no budgets in ${formatMonth(fromMonth)} to copy.` };

  const taken = new Set(data.budgets.filter((b) => b.month === toMonth).map((b) => b.categoryId));
  const toCopy = source.filter((b) => !taken.has(b.categoryId));
  if (toCopy.length === 0) {
    return {
      ok: false,
      error: `${formatMonth(toMonth)} already has every budget from ${formatMonth(fromMonth)}.`,
    };
  }
  const copies: Budget[] = toCopy.map((b) => ({
    id: (ctx.makeId ?? (() => generateId("budget")))(),
    categoryId: b.categoryId,
    month: toMonth,
    limit: b.limit,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  }));
  return {
    ok: true,
    data: { ...data, budgets: [...data.budgets, ...copies] },
    copied: copies.length,
  };
}
