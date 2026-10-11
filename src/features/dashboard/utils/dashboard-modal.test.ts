import { describe, expect, it } from "vitest";
import { PERIOD_IDS } from "@/lib/dates/periods";
import { buildMockData } from "@/mocks/mock-data";
import { makeTx } from "@/test/factories";
import { buildDashboardModel, MAX_DONUT_SLICES, RECENT_LIMIT } from "./dashboard-model";

const TODAY = "2026-10-11";
const data = buildMockData(TODAY);

describe("buildDashboardModel", () => {
  it.each(PERIOD_IDS)("derives every figure from the same period data (%s)", (id) => {
    const m = buildDashboardModel(data, TODAY, id);
    expect(m.summary.net).toBe(m.summary.income - m.summary.expenses);
    expect(m.series.reduce((t, p) => t + p.income, 0)).toBe(m.summary.income);
    expect(m.series.reduce((t, p) => t + p.expenses, 0)).toBe(m.summary.expenses);
    expect(m.categories.reduce((t, c) => t + c.amount, 0)).toBe(m.summary.expenses);
    expect(m.chartCategories.reduce((t, c) => t + c.amount, 0)).toBe(m.summary.expenses);
    expect(m.chartCategories.length).toBeLessThanOrEqual(MAX_DONUT_SLICES);
  });

  it.each(PERIOD_IDS)("keeps the recent list inside the period and newest first (%s)", (id) => {
    const { recent, period } = buildDashboardModel(data, TODAY, id);
    expect(recent.length).toBeLessThanOrEqual(RECENT_LIMIT);
    expect(recent.every((t) => t.date >= period.start && t.date <= period.end)).toBe(true);
    expect(recent.map((t) => t.date)).toEqual([...recent.map((t) => t.date)].sort().reverse());
  });

  it("keeps the balance and goals independent of the selected period", () => {
    const a = buildDashboardModel(data, TODAY, "this-month");
    const b = buildDashboardModel(data, TODAY, "this-year");
    expect(a.balance).toBe(b.balance);
    expect(a.goals).toEqual(b.goals);
  });

  it("changes figures when the period changes", () => {
    const month = buildDashboardModel(data, TODAY, "this-month").summary;
    const year = buildDashboardModel(data, TODAY, "this-year").summary;
    expect(year.income).toBeGreaterThan(month.income);
  });

  it("recalculates after a transaction is added, edited and removed", () => {
    // A transaction created now carries a current timestamp, so it sorts first among same-day items.
    const extra = makeTx({
      id: "extra",
      amount: 50_000_00,
      date: TODAY,
      categoryId: "health",
      createdAt: "2026-10-10T12:00:00.000Z",
    });
    const base = buildDashboardModel(data, TODAY, "this-month");

    const added = buildDashboardModel(
      { ...data, transactions: [...data.transactions, extra] },
      TODAY,
      "this-month",
    );
    expect(added.summary.expenses).toBe(base.summary.expenses + 50_000_00);
    expect(added.balance).toBe(base.balance - 50_000_00);
    expect(added.recent[0].id).toBe("extra");

    const edited = buildDashboardModel(
      { ...data, transactions: [...data.transactions, { ...extra, amount: 10_000_00 }] },
      TODAY,
      "this-month",
    );
    expect(edited.summary.expenses).toBe(base.summary.expenses + 10_000_00);

    const removed = buildDashboardModel(data, TODAY, "this-month");
    expect(removed.summary).toEqual(base.summary);
  });

  it("reports empty states for a user with no transactions", () => {
    const empty = buildDashboardModel(
      { ...data, transactions: [], budgets: [] },
      TODAY,
      "this-month",
    );
    expect(empty.hasAnyTransactions).toBe(false);
    expect(empty.periodHasTransactions).toBe(false);
    expect(empty.summary).toEqual({ income: 0, expenses: 0, net: 0, count: 0 });
    expect(empty.categories).toEqual([]);
    expect(empty.budgets).toEqual([]);
    expect(empty.balance).toBe(data.preferences.openingBalance);
  });

  it("distinguishes an empty period from an empty account", () => {
    const januaryOnly = {
      ...data,
      transactions: data.transactions.filter((t) => t.date.startsWith("2026-01")),
    };
    const m = buildDashboardModel(januaryOnly, TODAY, "this-month");
    expect(m.hasAnyTransactions).toBe(true);
    expect(m.periodHasTransactions).toBe(false);
  });
});
