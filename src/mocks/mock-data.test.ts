import { describe, expect, it } from "vitest";
import {
  budgetProgressForPeriod,
  filterByPeriod,
  incomeExpenseSeries,
  spendingByCategory,
  summarize,
} from "@/lib/calculations";
import { getCategory } from "@/lib/categories";
import { PERIOD_IDS, resolvePeriod } from "@/lib/dates/periods";
import { appDataSchema } from "@/types/domain";
import { buildMockData, mockMonths } from "./mock-data";

const REFERENCE = "2026-10-10";

describe("buildDemoData", () => {
  it("is deterministic: the same reference date gives identical data", () => {
    expect(buildMockData(REFERENCE)).toEqual(buildMockData(REFERENCE));
  });

  it("passes the application schema for many reference dates, including edge cases", () => {
    for (const date of [
      "2026-01-01",
      "2026-01-31",
      "2026-02-28",
      "2028-02-29",
      "2026-12-31",
      "2026-10-10",
    ]) {
      expect(appDataSchema.safeParse(buildMockData(date)).success, date).toBe(true);
    }
  });

  it("uses unique ids", () => {
    const { transactions, budgets, goals } = buildMockData(REFERENCE);
    for (const list of [transactions, budgets, goals]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    }
  });

  it("references only real categories of the matching type", () => {
    const { transactions, budgets } = buildMockData(REFERENCE);
    for (const t of transactions) expect(getCategory(t.categoryId)?.type, t.id).toBe(t.type);
    for (const b of budgets) expect(getCategory(b.categoryId)?.type, b.id).toBe("expense");
  });

  it("never contains future-dated transactions", () => {
    const { transactions } = buildMockData(REFERENCE);
    expect(transactions.every((t) => t.date <= REFERENCE)).toBe(true);
  });

  it("has at most one budget per category and month", () => {
    const keys = buildMockData(REFERENCE).budgets.map((b) => `${b.categoryId}|${b.month}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("covers the year to date or the last six months, whichever is longer", () => {
    expect(mockMonths("2026-10-10")[0]).toBe("2026-01");
    expect(mockMonths("2026-02-10")[0]).toBe("2025-09");
    expect(mockMonths("2026-10-10").at(-1)).toBe("2026-10");
  });

  it("includes a completed goal and an in-progress goal, with no negative balances", () => {
    const { goals } = buildMockData(REFERENCE);
    expect(goals.some((g) => g.currentAmount >= g.targetAmount)).toBe(true);
    expect(goals.some((g) => g.currentAmount < g.targetAmount)).toBe(true);
    expect(goals.every((g) => g.currentAmount >= 0)).toBe(true);
  });

  it("gives the current month realistic positive cash flow", () => {
    const { transactions } = buildMockData(REFERENCE);
    const october = summarize(filterByPeriod(transactions, resolvePeriod("this-month", REFERENCE)));
    expect(october.income).toBeGreaterThan(0);
    expect(october.expenses).toBeGreaterThan(0);
  });
});

describe("financial consistency across every period (brief §9)", () => {
  const data = buildMockData(REFERENCE);

  it.each(PERIOD_IDS)("KPIs, chart, categories and budgets agree for %s", (id) => {
    const period = resolvePeriod(id, REFERENCE);
    const inPeriod = filterByPeriod(data.transactions, period);
    const kpis = summarize(inPeriod);
    const series = incomeExpenseSeries(data.transactions, period);
    const categories = spendingByCategory(inPeriod);

    expect(series.reduce((t, p) => t + p.income, 0)).toBe(kpis.income);
    expect(series.reduce((t, p) => t + p.expenses, 0)).toBe(kpis.expenses);
    expect(categories.reduce((t, c) => t + c.amount, 0)).toBe(kpis.expenses);
    expect(kpis.net).toBe(kpis.income - kpis.expenses);

    // Budgeted spending can never exceed total spending in the same period.
    const budgetSpent = budgetProgressForPeriod(data.budgets, data.transactions, period).reduce(
      (t, p) => t + p.spent,
      0,
    );
    expect(budgetSpent).toBeLessThanOrEqual(kpis.expenses);
  });
});
