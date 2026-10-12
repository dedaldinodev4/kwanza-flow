import { describe, expect, it } from "vitest";

import {
  contributionFormSchema,
  createGoalFormSchema,
  toGoalInput,
  type GoalFormValues,
} from "./goal-form";

const TODAY = "2026-10-10";
const valid: GoalFormValues = {
  name: "Trip",
  targetAmount: "450.000",
  currentAmount: "",
  targetDate: "2027-03-15",
};
const errorsOf = (values: Partial<GoalFormValues>, opts: { originalTargetDate?: string } = {}) => {
  const r = createGoalFormSchema({ today: TODAY, ...opts }).safeParse({ ...valid, ...values });
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe("goal form schema", () => {
  it("accepts a full goal, and a goal with only a name and target", () => {
    expect(errorsOf({})).toEqual({});
    expect(errorsOf({ currentAmount: "", targetDate: "" })).toEqual({});
  });

  it("requires a name and a target", () => {
    expect(errorsOf({ name: "  ", targetAmount: "" })).toEqual({
      name: "Enter a name for the goal.",
      targetAmount: "Enter a target amount.",
    });
  });

  it("requires a target above zero but allows nothing saved yet", () => {
    expect(errorsOf({ targetAmount: "0" }).targetAmount).toMatch(/greater than zero/);
    expect(errorsOf({ currentAmount: "0" })).toEqual({});
    expect(errorsOf({ currentAmount: "-1" }).currentAmount).toMatch(/valid amount/);
  });

  it("does not accept a new target date in the past, but accepts today", () => {
    expect(errorsOf({ targetDate: "2026-10-09" }).targetDate).toBe("Choose today or a later date.");
    expect(errorsOf({ targetDate: TODAY })).toEqual({});
  });

  it("keeps an unchanged past date valid when editing, but not a different past date", () => {
    expect(errorsOf({ targetDate: "2026-06-01" }, { originalTargetDate: "2026-06-01" })).toEqual(
      {},
    );
    expect(
      errorsOf({ targetDate: "2026-07-01" }, { originalTargetDate: "2026-06-01" }).targetDate,
    ).toBeDefined();
  });

  it("rejects impossible dates", () => {
    expect(errorsOf({ targetDate: "2027-02-30" }).targetDate).toBe("Enter a valid date.");
  });

  it("converts blanks sensibly: no saved amount is 0 and no date is omitted", () => {
    expect(toGoalInput({ ...valid, targetDate: "" })).toEqual({
      name: "Trip",
      targetAmount: 45_000_000,
      currentAmount: 0,
    });
    expect(toGoalInput({ ...valid, currentAmount: "1.500,50" })).toMatchObject({
      currentAmount: 150_050,
      targetDate: "2027-03-15",
    });
  });
});

describe("contribution form schema", () => {
  const check = (amount: string) => {
    const r = contributionFormSchema.safeParse({ amount });
    return r.success ? null : r.error.issues[0].message;
  };
  it("accepts positive amounts only", () => {
    expect(check("250")).toBeNull();
    expect(check("")).toBe("Enter an amount.");
    expect(check("0")).toMatch(/greater than zero/);
    expect(check("-10")).toMatch(/valid amount/);
    expect(check("abc")).toMatch(/valid amount/);
  });
});
