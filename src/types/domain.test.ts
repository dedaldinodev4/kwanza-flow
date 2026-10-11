import { describe, expect, it } from "vitest";
import { makeBudget, makeGoal, makeTx } from "@/test/factories";
import {
  budgetSchema,
  isoMonthSchema,
  savingsGoalSchema,
  transactionSchema,
  userPreferencesSchema,
} from "./domain";

describe("transactionSchema", () => {
  it("accepts a valid transaction", () => {
    expect(transactionSchema.safeParse(makeTx()).success).toBe(true);
  });

  it.each([
    ["a fractional amount", { amount: 10.5 }],
    ["a zero amount", { amount: 0 }],
    ["a negative amount", { amount: -100 }],
    ["an amount above the maximum", { amount: Number.MAX_SAFE_INTEGER }],
    ["a blank description", { description: "   " }],
    ["an over-long description", { description: "x".repeat(121) }],
    ["an impossible date", { date: "2026-02-30" }],
    ["a non-ISO date", { date: "10/10/2026" }],
    ["an unknown type", { type: "transfer" }],
    ["over-long notes", { notes: "n".repeat(501) }],
  ])("rejects %s", (_label, overrides) => {
    expect(transactionSchema.safeParse({ ...makeTx(), ...overrides }).success).toBe(false);
  });

  it("trims descriptions", () => {
    const parsed = transactionSchema.parse({ ...makeTx(), description: "  Lunch  " });
    expect(parsed.description).toBe("Lunch");
  });
});

describe("other schemas", () => {
  it("validates months", () => {
    expect(isoMonthSchema.safeParse("2026-10").success).toBe(true);
    expect(isoMonthSchema.safeParse("2026-13").success).toBe(false);
    expect(isoMonthSchema.safeParse("2026-1").success).toBe(false);
  });

  it("rejects a zero budget limit", () => {
    expect(budgetSchema.safeParse(makeBudget({ limit: 0 })).success).toBe(false);
  });

  it("rejects a goal with a negative balance or a zero target", () => {
    expect(savingsGoalSchema.safeParse(makeGoal({ currentAmount: -1 })).success).toBe(false);
    expect(savingsGoalSchema.safeParse(makeGoal({ targetAmount: 0 })).success).toBe(false);
  });

  it("rejects unsupported locales and currencies", () => {
    const valid = {
      displayName: "Demo",
      locale: "pt-AO",
      currency: "AOA",
      density: "compact",
      openingBalance: 0,
    };
    expect(userPreferencesSchema.safeParse(valid).success).toBe(true);
    expect(userPreferencesSchema.safeParse({ ...valid, locale: "xx-XX" }).success).toBe(false);
    expect(userPreferencesSchema.safeParse({ ...valid, currency: "USD" }).success).toBe(false);
  });
});
