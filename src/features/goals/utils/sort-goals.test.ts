import { describe, expect, it } from "vitest";

import { isGoalOverdue } from "@/lib/calculations";
import { makeGoal } from "@/test/factories";

import { sortGoals } from "./sort-goals";

const g = (id: string, o: Parameters<typeof makeGoal>[0] = {}) => makeGoal({ id, name: id, ...o });

describe("sortGoals", () => {
  it("puts active goals first by soonest date, undated goals after dated ones, completed last", () => {
    const sorted = sortGoals([
      g("done", { targetAmount: 100, currentAmount: 100 }),
      g("none"),
      g("late", { targetDate: "2027-12-01" }),
      g("soon", { targetDate: "2026-11-01" }),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["soon", "late", "none", "done"]);
  });

  it("breaks ties by name and is independent of input order", () => {
    const a = [g("b", { targetDate: "2027-01-01" }), g("a", { targetDate: "2027-01-01" })];
    expect(sortGoals(a).map((x) => x.id)).toEqual(["a", "b"]);
    expect(sortGoals([...a].reverse()).map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("does not mutate its input", () => {
    const input = [g("b"), g("a")];
    sortGoals(input);
    expect(input.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("isGoalOverdue", () => {
  const today = "2026-10-10";
  it("flags an unfunded goal whose date has passed", () => {
    expect(isGoalOverdue(g("x", { targetDate: "2026-10-09" }), today)).toBe(true);
  });
  it("does not flag today, a future date, no date, or a completed goal", () => {
    expect(isGoalOverdue(g("x", { targetDate: today }), today)).toBe(false);
    expect(isGoalOverdue(g("x", { targetDate: "2027-01-01" }), today)).toBe(false);
    expect(isGoalOverdue(g("x"), today)).toBe(false);
    expect(
      isGoalOverdue(g("x", { targetDate: "2026-01-01", targetAmount: 5, currentAmount: 5 }), today),
    ).toBe(false);
  });
});
