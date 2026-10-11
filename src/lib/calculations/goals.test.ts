import { describe, expect, it } from "vitest";
import { makeGoal } from "@/test/factories";
import { applyContribution, goalProgress, goalsSummary } from "./goals";

describe("goalProgress", () => {
  it("is 0% for a new goal", () => {
    expect(goalProgress(makeGoal({ targetAmount: 1000, currentAmount: 0 }))).toEqual({
      ratio: 0,
      remaining: 1000,
      completed: false,
    });
  });

  it("reports partial progress and the remaining amount", () => {
    expect(goalProgress(makeGoal({ targetAmount: 1000, currentAmount: 250 }))).toEqual({
      ratio: 0.25,
      remaining: 750,
      completed: false,
    });
  });

  it("marks an exactly funded goal as completed", () => {
    expect(goalProgress(makeGoal({ targetAmount: 1000, currentAmount: 1000 }))).toEqual({
      ratio: 1,
      remaining: 0,
      completed: true,
    });
  });

  it("clamps an over-funded goal to 100% with no negative remainder", () => {
    expect(goalProgress(makeGoal({ targetAmount: 1000, currentAmount: 1300 }))).toEqual({
      ratio: 1,
      remaining: 0,
      completed: true,
    });
  });
});

describe("applyContribution", () => {
  const goal = makeGoal({ targetAmount: 1_000_00, currentAmount: 400_00 });

  it("adds the amount and refreshes updatedAt without mutating the original", () => {
    const result = applyContribution(goal, 100_00, "2026-10-10T10:00:00.000Z");
    expect(result).toMatchObject({
      ok: true,
      goal: { currentAmount: 500_00, updatedAt: "2026-10-10T10:00:00.000Z" },
    });
    expect(goal.currentAmount).toBe(400_00);
  });

  it.each([0, -50_00, 12.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects %s", (amount) => {
    expect(applyContribution(goal, amount)).toMatchObject({ ok: false });
  });

  it("allows contributing past the target and leaves the goal completed", () => {
    const result = applyContribution(goal, 900_00);
    expect(result.ok && goalProgress(result.goal).completed).toBe(true);
    expect(result.ok && goalProgress(result.goal).ratio).toBe(1);
  });

  it("rejects contributions that would exceed the supported maximum", () => {
    expect(applyContribution(goal, Number.MAX_SAFE_INTEGER)).toMatchObject({ ok: false });
  });
});

describe("goalsSummary", () => {
  it("totals saved and target amounts and counts completed goals", () => {
    expect(
      goalsSummary([
        makeGoal({ targetAmount: 1000, currentAmount: 1000 }),
        makeGoal({ targetAmount: 500, currentAmount: 100 }),
      ]),
    ).toEqual({ saved: 1100, target: 1500, completedCount: 1 });
    expect(goalsSummary([])).toEqual({ saved: 0, target: 0, completedCount: 0 });
  });
});
