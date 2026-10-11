import type { Budget, SavingsGoal, Transaction } from "@/types/domain";

const STAMP = "2026-01-01T08:00:00.000Z";
let counter = 0;

//* Test factory. Amounts are minor units (cêntimos). *//
export function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  counter += 1;
  return {
    id: `t-${counter}`,
    type: "expense",
    description: "Test transaction",
    amount: 100_00,
    categoryId: "groceries",
    date: "2026-10-10",
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

export function makeBudget(overrides: Partial<Budget> = {}): Budget {
  counter += 1;
  return {
    id: `b-${counter}`,
    categoryId: "groceries",
    month: "2026-10",
    limit: 1_000_00,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

export function makeGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  counter += 1;
  return {
    id: `g-${counter}`,
    name: "Test goal",
    targetAmount: 1_000_00,
    currentAmount: 0,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}
