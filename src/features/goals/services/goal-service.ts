import { applyContribution } from "@/lib/calculations";
import { generateId } from "@/lib/generate-id";
import { savingsGoalSchema, type AppData, type SavingsGoal } from "@/types/domain";
import type { GoalInput } from "../schemas/goal-form";

export type GoalResult =
  { ok: true; data: AppData; goal: SavingsGoal } | { ok: false; error: string };

interface Context {
  now: string;
  makeId?: () => string;
}

//* validate goal *//
function validate(candidate: SavingsGoal): string | null {
  return savingsGoalSchema.safeParse(candidate).success ? null : "The goal details are not valid.";
}

//* createGoal - create a new goal *//
export function createGoal(data: AppData, input: GoalInput, ctx: Context): GoalResult {
  const goal: SavingsGoal = {
    id: (ctx.makeId ?? (() => generateId("goal")))(),
    ...input,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  };

  const error = validate(goal);
  if (error)
    return { ok: false, error };

  if (data.goals.some((g) => g.id === goal.id))
    return { ok: false, error: "Duplicate goal id." };

  return {
    ok: true,
    data: { ...data, goals: [...data.goals, goal] },
    goal
  };
}

//* updateGoal - update an goal *//
export function updateGoal(data: AppData, id: string, input: GoalInput, ctx: Context): GoalResult {
  const existing = data.goals.find((g) => g.id === id);
  if (!existing)
    return { ok: false, error: "That goal no longer exists." };

  const updated: SavingsGoal = {
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
    data: {
      ...data,
      goals: data.goals.map((g) => (g.id === id ? updated : g))
    },
    goal: updated,
  };
}

//* deleteGoal - delete or remove an goal *//
export function deleteGoal(data: AppData, id: string): GoalResult {
  const existing = data.goals.find((g) => g.id === id);
  if (!existing)
    return { ok: false, error: "That goal no longer exists." };

  return {
    ok: true,
    data: {
      ...data,
      goals: data.goals.filter((g) => g.id !== id)
    },
    goal: existing,
  };
}

//* Adds a positive contribution. The balance can only grow, so it can never become negative. *//
export function contributeToGoal(
  data: AppData,
  id: string,
  amount: number,
  ctx: Pick<Context, "now">,
): GoalResult {
  const existing = data.goals.find((g) => g.id === id);
  if (!existing)
    return { ok: false, error: "That goal no longer exists." };

  const result = applyContribution(existing, amount, ctx.now);
  if (!result.ok)
    return { ok: false, error: result.error };

  return {
    ok: true,
    data: {
      ...data,
      goals: data.goals.map((g) => (g.id === id ? result.goal : g))
    },
    goal: result.goal,
  };
}
