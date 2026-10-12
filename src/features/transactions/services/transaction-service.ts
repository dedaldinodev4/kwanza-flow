import { getCategory } from "@/lib/categories";
import { generateId } from "@/lib/generate-id";
import { transactionSchema, type AppData, type Transaction } from "@/types/domain";
import type { TransactionInput } from "../schemas/transaction-form";

/*
 * Domain services: pure functions from (data, input) to new data. No React, no storage.
 * Persisting the result is the store's job, so these are trivial to test and to move behind an API later.
 * Balances, totals and budgets are derived from the transaction list, so there is nothing else to update.
 */

export type ServiceResult =
  { ok: true; data: AppData; transaction: Transaction } | { ok: false; error: string };

interface Context {
  now: string;
  makeId?: () => string;
}

//* validate transaction *//
function validate(candidate: Transaction): string | null {
  const category = getCategory(candidate.categoryId);
  if (!category) {
    return "That category does not exist.";
  }

  if (category.type !== candidate.type) {
    return `That category cannot be used for ${candidate.type}.`;
  }

  const parsed = transactionSchema.safeParse(candidate);
  return parsed.success ? null : "The transaction details are not valid.";
}

//* creteTransaction - create a transaction *//
export function createTransaction(
  data: AppData,
  input: TransactionInput,
  ctx: Context,
): ServiceResult {
  const transaction: Transaction = {
    id: (ctx.makeId ?? (() => generateId("txn")))(),
    ...input,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };
  const error = validate(transaction);
  if (error)
    return { ok: false, error };

  if (data.transactions.some((t) => t.id === transaction.id))
    return { ok: false, error: "Duplicate transaction id." };

  return {
    ok: true,
    data: { ...data, transactions: [...data.transactions, transaction] },
    transaction,
  };
}

//* updateTransaction - update a transaction *//
export function updateTransaction(
  data: AppData,
  id: string,
  input: TransactionInput,
  ctx: Context,
): ServiceResult {
  const existing = data.transactions.find((t) => t.id === id);

  if (!existing)
    return {
      ok: false,
      error: "That transaction no longer exists."
    };

  const updated: Transaction = {
    id: existing.id,
    createdAt: existing.createdAt,
    ...input,
    updatedAt: ctx.now,
  };

  const error = validate(updated);
  if (error)
    return { ok: false, error };

  return {
    ok: true,
    data: { ...data, transactions: data.transactions.map((t) => (t.id === id ? updated : t)) },
    transaction: updated,
  };
}

//* deleteTransaction - delete a transaction *//
export function deleteTransaction(data: AppData, id: string): ServiceResult {
  const existing = data.transactions.find((t) => t.id === id);
  if (!existing)
    return {
      ok: false,
      error: "That transaction no longer exists."
    };
    
  return {
    ok: true,
    data: { ...data, transactions: data.transactions.filter((t) => t.id !== id) },
    transaction: existing,
  };
}
