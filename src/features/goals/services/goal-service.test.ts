import { describe, expect, it } from "vitest";

import { goalProgress } from "@/lib/calculations";
import { buildMockData } from "@/mocks/mock-data";
import { makeGoal } from "@/test/factories";

import type { GoalInput } from "../schemas/goal-form";
import { 
  contributeToGoal, 
  createGoal, 
  deleteGoal, 
  updateGoal 
} from "./goal-service";

const NOW = "2026-10-10T12:00:00.000Z";
const base = {
  ...buildMockData("2026-10-10"),
  goals: [
    makeGoal({ id: "g", targetAmount: 1_000_00, currentAmount: 400_00, targetDate: "2027-01-01" }),
  ],
};
const input: GoalInput = { name: "Laptop", targetAmount: 600_00, currentAmount: 0 };

describe("GoalService - createGoal()", () => {
  it("adds a goal without mutating the original data", () => {
    const result = createGoal(base, input, { now: NOW, makeId: () => "new" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.goal).toMatchObject({
      id: "new",
      name: "Laptop",
      currentAmount: 0,
      createdAt: NOW,
    });
    expect(result.data.goals).toHaveLength(2);
    expect(base.goals).toHaveLength(1);
  });

  it("rejects invalid input", () => {
    for (const bad of [
      { ...input, targetAmount: 0 },
      { ...input, currentAmount: -1 },
      { ...input, name: "" },
      { ...input, targetAmount: 1.5 },
    ]) {
      expect(createGoal(base, bad, { now: NOW }).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("GoalService - updateGoal()", () => {
  it("replaces details, keeps id and createdAt, and really removes a cleared target date", () => {
    const result = updateGoal(
      base,
      "g",
      { name: "Renamed", targetAmount: 2_000_00, currentAmount: 400_00 },
      { now: NOW },
    );
    if (!result.ok) throw new Error("expected ok");
    expect(result.goal).toMatchObject({ id: "g", name: "Renamed", updatedAt: NOW });
    expect(result.goal).not.toHaveProperty("targetDate");
    expect(result.goal.createdAt).toBe(base.goals[0].createdAt);
  });

  it("completes a goal whose target is lowered to what is already saved", () => {
    const result = updateGoal(
      base,
      "g",
      { name: "Goal", targetAmount: 400_00, currentAmount: 400_00 },
      { now: NOW },
    );
    if (!result.ok) throw new Error("expected ok");
    expect(goalProgress(result.goal).completed).toBe(true);
  });

  it("fails for an unknown id", () => {
    expect(updateGoal(base, "missing", input, { now: NOW })).toMatchObject({ ok: false });
  });
});

describe("GoalService - deleteGoal()", () => {
  it("removes only that goal", () => {
    const two = { ...base, goals: [...base.goals, makeGoal({ id: "other" })] };
    const result = deleteGoal(two, "g");
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.goals.map((g) => g.id)).toEqual(["other"]);
    expect(deleteGoal(two, "missing")).toMatchObject({ ok: false });
  });
});

describe("GoalService - contributeToGoal()", () => {
  it("adds to the balance and updates progress", () => {
    const result = contributeToGoal(base, "g", 100_00, { now: NOW });
    if (!result.ok) throw new Error("expected ok");
    expect(result.goal.currentAmount).toBe(500_00);
    expect(goalProgress(result.goal)).toMatchObject({
      ratio: 0.5,
      remaining: 500_00,
      completed: false,
    });
    expect(base.goals[0].currentAmount).toBe(400_00); // original untouched
  });

  it("completes the goal when the target is reached exactly", () => {
    const result = contributeToGoal(base, "g", 600_00, { now: NOW });
    if (!result.ok) throw new Error("expected ok");
    expect(goalProgress(result.goal)).toMatchObject({ ratio: 1, remaining: 0, completed: true });
  });

  it("allows contributing past the target and keeps progress clamped", () => {
    const result = contributeToGoal(base, "g", 900_00, { now: NOW });
    if (!result.ok) throw new Error("expected ok");
    expect(result.goal.currentAmount).toBe(1_300_00);
    expect(goalProgress(result.goal)).toMatchObject({ ratio: 1, remaining: 0 });
  });

  it.each([0, -100_00, 12.5, Number.NaN])(
    "never lets %s change the balance (no negative balances)",
    (amount) => {
      const result = contributeToGoal(base, "g", amount, { now: NOW });
      expect(result.ok).toBe(false);
    },
  );

  it("fails for a goal that no longer exists", () => {
    expect(contributeToGoal(base, "missing", 100, { now: NOW })).toMatchObject({ ok: false });
  });
});
