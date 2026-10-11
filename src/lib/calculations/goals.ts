import { MAX_MINOR_UNITS } from "@/constants";
import type { SavingsGoal } from "@/types/domain";

export interface GoalProgress {
  /** 0–1, clamped: an over-funded goal shows 100%, not 130%. */
  ratio: number;
  /** Never negative. */
  remaining: number;
  completed: boolean;
}

export function goalProgress(
  goal: Pick<SavingsGoal, "targetAmount" | "currentAmount">,
): GoalProgress {
  return {
    ratio: goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0,
    remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
    completed: goal.currentAmount >= goal.targetAmount,
  };
}

export type ContributionResult = { ok: true; goal: SavingsGoal } | { ok: false; error: string };


export function applyContribution(
  goal: SavingsGoal,
  amount: number,
  now: string = new Date().toISOString(),
): ContributionResult {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { ok: false, error: "Contribution must be a positive amount." };
  }
  const next = goal.currentAmount + amount;
  if (next > MAX_MINOR_UNITS) return { ok: false, error: "That contribution is too large." };
  return { ok: true, goal: { ...goal, currentAmount: next, updatedAt: now } };
}

export function goalsSummary(goals: readonly SavingsGoal[]): {
  saved: number;
  target: number;
  completedCount: number;
} {
  return {
    saved: goals.reduce((t, g) => t + g.currentAmount, 0),
    target: goals.reduce((t, g) => t + g.targetAmount, 0),
    completedCount: goals.filter((g) => goalProgress(g).completed).length,
  };
}
