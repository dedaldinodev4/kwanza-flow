import { describe, expect, it } from "vitest";
import { resolvePeriod } from "@/lib/dates/periods";
import { makeBudget, makeTx } from "@/test/factories";
import {
  budgetProgressForMonth,
  budgetProgressForPeriod,
  budgetStatus,
  budgetTotals,
} from "./budgets";

describe("budgetStatus", () => {
  it("is ok below 80%, warning from 80% up to and including 100%, over above 100%", () => {
    expect(budgetStatus(799, 1000)).toBe("ok");
    expect(budgetStatus(800, 1000)).toBe("warning");
    expect(budgetStatus(1000, 1000)).toBe("warning");
    expect(budgetStatus(1001, 1000)).toBe("over");
  });
});

describe("budgetProgressForMonth", () => {
  const budget = makeBudget({ categoryId: "groceries", month: "2026-10", limit: 1_000_00 });

  it("handles a budget with no matching expenses", () => {
    const [p] = budgetProgressForMonth([budget], [], "2026-10");
    expect(p).toMatchObject({ spent: 0, remaining: 1_000_00, ratio: 0, status: "ok" });
  });

  it("counts only expenses in the same category and month", () => {
    const [p] = budgetProgressForMonth(
      [budget],
      [
        makeTx({ categoryId: "groceries", amount: 300_00, date: "2026-10-03" }),
        makeTx({ categoryId: "dining", amount: 700_00, date: "2026-10-03" }), // other category
        makeTx({ categoryId: "groceries", amount: 500_00, date: "2026-09-30" }), // other month
        makeTx({ type: "income", categoryId: "groceries", amount: 400_00, date: "2026-10-04" }), // not spending
      ],
      "2026-10",
    );
    expect(p.spent).toBe(300_00);
    expect(p.remaining).toBe(700_00);
  });

  it("flags overspending with a negative remainder and a ratio above 1", () => {
    const [p] = budgetProgressForMonth([budget], [makeTx({ amount: 1_250_00 })], "2026-10");
    expect(p).toMatchObject({ status: "over", remaining: -250_00, ratio: 1.25 });
  });

  it("reacts when a transaction is edited or deleted", () => {
    const tx = makeTx({ amount: 900_00 });
    expect(budgetProgressForMonth([budget], [tx], "2026-10")[0].status).toBe("warning");
    expect(budgetProgressForMonth([budget], [{ ...tx, amount: 100_00 }], "2026-10")[0].status).toBe(
      "ok",
    );
    expect(budgetProgressForMonth([budget], [], "2026-10")[0].spent).toBe(0);
  });

  it("lists the most at-risk budget first", () => {
    const list = budgetProgressForMonth(
      [budget, makeBudget({ categoryId: "dining", month: "2026-10", limit: 100_00 })],
      [makeTx({ categoryId: "dining", amount: 90_00 })],
      "2026-10",
    );
    expect(list.map((p) => p.categoryId)).toEqual(["dining", "groceries"]);
  });
});

describe("budgetProgressForPeriod", () => {
  const budgets = [
    makeBudget({ categoryId: "groceries", month: "2026-09", limit: 500_00 }),
    makeBudget({ categoryId: "groceries", month: "2026-10", limit: 500_00 }),
  ];

  it("sums limits and spending over the budgeted months in the period", () => {
    const [p] = budgetProgressForPeriod(
      budgets,
      [
        makeTx({ amount: 200_00, date: "2026-09-10" }),
        makeTx({ amount: 400_00, date: "2026-10-10" }),
      ],
      resolvePeriod("last-3-months", "2026-10-10"),
    );
    expect(p).toMatchObject({ limit: 1_000_00, spent: 600_00, remaining: 400_00 });
  });

  it("does not charge spending in an unbudgeted month against a missing limit", () => {
    const [p] = budgetProgressForPeriod(
      budgets,
      [makeTx({ amount: 999_00, date: "2026-08-15" })], // August has no budget
      resolvePeriod("last-3-months", "2026-10-10"),
    );
    expect(p.spent).toBe(0);
  });

  it("returns an empty list when the period has no budgets", () => {
    expect(budgetProgressForPeriod(budgets, [], resolvePeriod("last-month", "2026-01-10"))).toEqual(
      [],
    );
  });
});

describe("budgetTotals", () => {
  it("aggregates and counts overspent budgets", () => {
    const totals = budgetTotals([
      {
        categoryId: "a",
        name: "A",
        limit: 100,
        spent: 150,
        remaining: -50,
        ratio: 1.5,
        status: "over",
      },
      {
        categoryId: "b",
        name: "B",
        limit: 200,
        spent: 50,
        remaining: 150,
        ratio: 0.25,
        status: "ok",
      },
    ]);
    expect(totals).toEqual({ limit: 300, spent: 200, remaining: 100, overCount: 1 });
  });

  it("is all zeros for no budgets", () => {
    expect(budgetTotals([])).toEqual({ limit: 0, spent: 0, remaining: 0, overCount: 0 });
  });
});
