import { describe, expect, it } from "vitest";

import { budgetProgressForMonth } from "@/lib/calculations";
import { buildMockData } from "@/mocks/mock-data";
import { makeBudget, makeTx } from "@/test/factories";
import { copyBudgets, createBudget, deleteBudget, updateBudgetLimit } from "./budget-service";

const NOW = "2026-10-10T12:00:00.000Z";
const empty = { ...buildMockData("2026-10-10"), budgets: [], transactions: [] };

describe("budgetService - createBudget()", () => {
  it("adds a budget without mutating the original data", () => {
    const result = createBudget(
      empty,
      { categoryId: "dining", month: "2026-10", limit: 55_000_00 },
      { now: NOW, makeId: () => "b1" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.budget).toMatchObject({
      id: "b1",
      categoryId: "dining",
      month: "2026-10",
      limit: 55_000_00,
      createdAt: NOW,
    });
    expect(result.data.budgets).toHaveLength(1);
    expect(empty.budgets).toHaveLength(0);
  });

  it("allows the same category in a different month, but not twice in the same month", () => {
    const first = createBudget(
      empty,
      { categoryId: "dining", month: "2026-10", limit: 1_00 },
      { now: NOW },
    );
    if (!first.ok) throw new Error("expected ok");
    expect(
      createBudget(
        first.data,
        { categoryId: "dining", month: "2026-11", limit: 1_00 },
        { now: NOW },
      ).ok,
    ).toBe(true);
    const dup = createBudget(
      first.data,
      { categoryId: "dining", month: "2026-10", limit: 9_00 },
      { now: NOW },
    );
    expect(dup).toEqual({
      ok: false,
      error: "There is already a Dining out budget for October 2026.",
    });
  });

  it("rejects income categories, unknown categories and invalid limits", () => {
    for (const input of [
      { categoryId: "salary", month: "2026-10", limit: 100 },
      { categoryId: "ghost", month: "2026-10", limit: 100 },
      { categoryId: "dining", month: "2026-10", limit: 0 },
      { categoryId: "dining", month: "2026-10", limit: 10.5 },
      { categoryId: "dining", month: "2026-13", limit: 100 },
    ]) {
      expect(createBudget(empty, input, { now: NOW }).ok, JSON.stringify(input)).toBe(false);
    }
  });
});

describe("budgetService - updateBudgetLimit()", () => {
  const withBudget = {
    ...empty,
    budgets: [makeBudget({ id: "b", categoryId: "groceries", month: "2026-10", limit: 100_00 })],
  };

  it("changes only the limit and refreshes updatedAt", () => {
    const result = updateBudgetLimit(withBudget, "b", 250_00, { now: NOW });
    if (!result.ok) throw new Error("expected ok");
    expect(result.budget).toMatchObject({
      id: "b",
      categoryId: "groceries",
      month: "2026-10",
      limit: 250_00,
      updatedAt: NOW,
    });
  });

  it("changes progress immediately: a limit raised above spending clears the overspend", () => {
    const data = {
      ...withBudget,
      transactions: [makeTx({ categoryId: "groceries", amount: 150_00, date: "2026-10-05" })],
    };
    expect(budgetProgressForMonth(data.budgets, data.transactions, "2026-10")[0].status).toBe(
      "over",
    );
    const raised = updateBudgetLimit(data, "b", 400_00, { now: NOW });
    if (!raised.ok) throw new Error("expected ok");
    expect(
      budgetProgressForMonth(raised.data.budgets, raised.data.transactions, "2026-10")[0].status,
    ).toBe("ok");
  });

  it("fails for an unknown id or an invalid limit", () => {
    expect(updateBudgetLimit(withBudget, "missing", 100, { now: NOW })).toMatchObject({
      ok: false,
    });
    expect(updateBudgetLimit(withBudget, "b", 0, { now: NOW })).toMatchObject({ ok: false });
  });
});

describe("budgetService - deleteBudget()", () => {
  it("removes only that budget, leaving transactions untouched", () => {
    const data = {
      ...empty,
      budgets: [
        makeBudget({ id: "a", categoryId: "dining" }),
        makeBudget({ id: "b", categoryId: "transport" }),
      ],
      transactions: [makeTx({ categoryId: "dining" })],
    };
    const result = deleteBudget(data, "a");
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.budgets.map((b) => b.id)).toEqual(["b"]);
    expect(result.data.transactions).toHaveLength(1);
    expect(deleteBudget(data, "missing")).toMatchObject({ ok: false });
  });
});

describe("budgetService - copyBudgets()", () => {
  const data = {
    ...empty,
    budgets: [
      makeBudget({ categoryId: "groceries", month: "2026-09", limit: 130_000_00 }),
      makeBudget({ categoryId: "dining", month: "2026-09", limit: 55_000_00 }),
      makeBudget({ categoryId: "dining", month: "2026-10", limit: 99_00 }), // already set for the target month
    ],
  };

  it("copies missing budgets and never overwrites an existing one", () => {
    const result = copyBudgets(data, "2026-09", "2026-10", { now: NOW });
    if (!result.ok) throw new Error("expected ok");
    expect(result.copied).toBe(1);
    const october = result.data.budgets.filter((b) => b.month === "2026-10");
    expect(october.find((b) => b.categoryId === "groceries")?.limit).toBe(130_000_00);
    expect(october.find((b) => b.categoryId === "dining")?.limit).toBe(99_00); // untouched
    expect(new Set(october.map((b) => b.id)).size).toBe(october.length);
  });

  it("explains why nothing was copied", () => {
    expect(copyBudgets(data, "2026-01", "2026-10", { now: NOW })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/no budgets in January 2026/),
    });
    expect(copyBudgets(data, "2026-10", "2026-10", { now: NOW })).toMatchObject({ ok: false });
    const full = copyBudgets(data, "2026-09", "2026-10", { now: NOW });
    if (!full.ok) throw new Error("expected ok");
    expect(copyBudgets(full.data, "2026-09", "2026-10", { now: NOW })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/already has every budget/),
    });
  });
});
