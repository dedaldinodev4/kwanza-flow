import { describe, expect, it } from "vitest";
import { resolvePeriod } from "@/lib/dates/periods";
import { makeTx } from "@/test/factories";
import {
  accountBalance,
  allocatePermille,
  filterByPeriod,
  groupSmallCategories,
  incomeExpenseSeries,
  recentTransactions,
  spendingByCategory,
  summarize,
} from "./transactions";

const OCTOBER = resolvePeriod("this-month", "2026-10-10");

describe("summarize", () => {
  it("returns zeros for no transactions", () => {
    expect(summarize([])).toEqual({ income: 0, expenses: 0, net: 0, count: 0 });
  });

  it("totals income, expenses and net cash flow", () => {
    const result = summarize([
      makeTx({ type: "income", amount: 500_000_00 }),
      makeTx({ type: "expense", amount: 120_000_00 }),
      makeTx({ type: "expense", amount: 30_000_50 }),
    ]);
    expect(result).toEqual({ income: 500_000_00, expenses: 150_000_50, net: 349_999_50, count: 3 });
  });

  it("reports a negative net when spending exceeds income", () => {
    expect(summarize([makeTx({ type: "expense", amount: 10_00 })]).net).toBe(-10_00);
  });

  it("stays exact with many small amounts (no floating-point drift)", () => {
    const many = Array.from({ length: 1000 }, () => makeTx({ amount: 10 })); // 0.10 Kz each
    expect(summarize(many).expenses).toBe(10_000);
  });
});

describe("filterByPeriod (month boundaries)", () => {
  it("includes the first and last day and excludes neighbouring months", () => {
    const txs = [
      makeTx({ date: "2026-09-30" }),
      makeTx({ date: "2026-10-01" }),
      makeTx({ date: "2026-10-31" }),
      makeTx({ date: "2026-11-01" }),
    ];
    expect(filterByPeriod(txs, OCTOBER).map((t) => t.date)).toEqual(["2026-10-01", "2026-10-31"]);
  });
});

describe("accountBalance", () => {
  it("adds derived net to the opening balance, as of a date", () => {
    const txs = [
      makeTx({ type: "income", amount: 1_000_00, date: "2026-10-05" }),
      makeTx({ type: "expense", amount: 300_00, date: "2026-10-08" }),
      makeTx({ type: "expense", amount: 999_00, date: "2026-10-20" }), // scheduled, not yet applied
    ];
    expect(accountBalance(5_000_00, txs, "2026-10-10")).toBe(5_700_00);
    expect(accountBalance(5_000_00, txs, "2026-10-20")).toBe(4_701_00);
  });

  it("equals the opening balance with no transactions", () => {
    expect(accountBalance(123_00, [], "2026-10-10")).toBe(123_00);
  });
});

describe("editing and deleting recalculates dependent metrics", () => {
  const base = [
    makeTx({ id: "a", type: "income", amount: 1_000_00 }),
    makeTx({ id: "b", type: "expense", amount: 400_00, categoryId: "dining" }),
  ];

  it("reflects an edited amount", () => {
    const edited = base.map((t) => (t.id === "b" ? { ...t, amount: 250_00 } : t));
    expect(summarize(edited).net).toBe(750_00);
    expect(spendingByCategory(edited)[0].amount).toBe(250_00);
  });

  it("reflects a changed type", () => {
    const edited = base.map((t) => (t.id === "b" ? { ...t, type: "income" as const } : t));
    expect(summarize(edited)).toMatchObject({ income: 1_400_00, expenses: 0 });
    expect(spendingByCategory(edited)).toEqual([]);
  });

  it("reflects a deletion", () => {
    expect(summarize(base.filter((t) => t.id !== "b"))).toMatchObject({
      expenses: 0,
      net: 1_000_00,
    });
  });
});

describe("allocatePermille", () => {
  it("always sums to exactly 1000", () => {
    expect(allocatePermille([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(1000);
    expect(allocatePermille([1, 1, 1])).toEqual([334, 333, 333]);
    expect(allocatePermille([7, 3]).reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it("does not overshoot when plain rounding would (six equal shares round up to 167 each)", () => {
    const shares = allocatePermille([1, 1, 1, 1, 1, 1]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000);
    expect([...shares].sort()).toEqual([166, 166, 167, 167, 167, 167]);
  });

  it("sums to 1000 and stays within 1 of the exact share for many generated inputs", () => {
    let seed = 12345; // small deterministic LCG: no Math.random(), so failures reproduce
    const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    for (let run = 0; run < 500; run += 1) {
      const amounts = Array.from({ length: 1 + (next() % 9) }, () => 1 + (next() % 100_000));
      const total = amounts.reduce((a, b) => a + b, 0);
      const shares = allocatePermille(amounts);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(1000);
      shares.forEach((share, i) =>
        expect(Math.abs(share - (amounts[i] * 1000) / total)).toBeLessThan(1),
      );
    }
  });

  it("gives the leftover permille to the largest fractional remainder", () => {
    // exact: 555.56 / 222.22 / 222.22 → floors sum to 999 → the extra 1 belongs to the .56
    expect(allocatePermille([5, 2, 2])).toEqual([556, 222, 222]);
    // exact: 142.86 / 285.71 / 571.43 → floors 142/285/571 = 998 → extras go to .86 and .71
    expect(allocatePermille([1, 2, 4])).toEqual([143, 286, 571]);
  });

  it("returns zeros when there is nothing to split", () => {
    expect(allocatePermille([])).toEqual([]);
    expect(allocatePermille([0, 0])).toEqual([0, 0]);
  });
});

describe("spendingByCategory", () => {
  it("returns nothing when there are no expenses", () => {
    expect(spendingByCategory([makeTx({ type: "income", categoryId: "salary" })])).toEqual([]);
  });

  it("aggregates only expenses, largest first, with shares summing to 100%", () => {
    const rows = spendingByCategory([
      makeTx({ categoryId: "groceries", amount: 300_00 }),
      makeTx({ categoryId: "groceries", amount: 200_00 }),
      makeTx({ categoryId: "dining", amount: 100_00 }),
      makeTx({ type: "income", categoryId: "salary", amount: 9_999_00 }),
    ]);
    expect(rows.map((r) => [r.categoryId, r.amount])).toEqual([
      ["groceries", 500_00],
      ["dining", 100_00],
    ]);
    expect(rows.reduce((t, r) => t + r.permille, 0)).toBe(1000);
  });

  it("orders ties by name so the result is stable", () => {
    const rows = spendingByCategory([
      makeTx({ categoryId: "transport", amount: 100_00 }),
      makeTx({ categoryId: "dining", amount: 100_00 }),
    ]);
    expect(rows.map((r) => r.categoryId)).toEqual(["dining", "transport"]);
  });
});

describe("incomeExpenseSeries", () => {
  const txs = [
    makeTx({ type: "income", amount: 800_00, date: "2026-10-01" }),
    makeTx({ type: "expense", amount: 100_00, date: "2026-10-04" }),
    makeTx({ type: "expense", amount: 50_00, date: "2026-10-05" }),
    makeTx({ type: "expense", amount: 70_00, date: "2026-10-31" }),
    makeTx({ type: "expense", amount: 999_00, date: "2026-09-30" }), // outside the period
  ];

  it("buckets a single month by Monday–Sunday weeks clipped to the month", () => {
    const series = incomeExpenseSeries(txs, OCTOBER);
    expect(series.map((p) => p.label)).toEqual([
      "1–4 Oct",
      "5–11 Oct",
      "12–18 Oct",
      "19–25 Oct",
      "26–31 Oct",
    ]);
    expect(series[0]).toMatchObject({ income: 800_00, expenses: 100_00 });
    expect(series[1].expenses).toBe(50_00);
    expect(series[4].expenses).toBe(70_00);
  });

  it("covers every day exactly once (contiguous, no gaps or overlaps)", () => {
    const series = incomeExpenseSeries([], resolvePeriod("this-month", "2028-02-10")); // leap February
    expect(series[0].from).toBe("2028-02-01");
    expect(series.at(-1)?.to).toBe("2028-02-29");
    series.slice(1).forEach((p, i) => {
      const prevTo = new Date(`${series[i].to}T00:00:00Z`).getTime();
      expect(new Date(`${p.from}T00:00:00Z`).getTime() - prevTo).toBe(86_400_000);
    });
  });

  it("buckets longer periods by month", () => {
    const series = incomeExpenseSeries(txs, resolvePeriod("last-3-months", "2026-10-10"));
    expect(series.map((p) => p.label)).toEqual(["Aug", "Sep", "Oct"]);
    expect(series[1].expenses).toBe(999_00);
  });

  it("bucket totals always equal the period summary", () => {
    for (const id of ["this-month", "last-month", "last-3-months", "this-year"] as const) {
      const period = resolvePeriod(id, "2026-10-10");
      const series = incomeExpenseSeries(txs, period);
      const summary = summarize(filterByPeriod(txs, period));
      expect(series.reduce((t, p) => t + p.income, 0)).toBe(summary.income);
      expect(series.reduce((t, p) => t + p.expenses, 0)).toBe(summary.expenses);
    }
  });

  it("returns zero-filled buckets when there is no data", () => {
    const series = incomeExpenseSeries([], OCTOBER);
    expect(series.length).toBeGreaterThan(0);
    expect(series.every((p) => p.income === 0 && p.expenses === 0)).toBe(true);
  });
});

describe("recentTransactions", () => {
  it("sorts newest first with stable tie-breaking and respects the limit", () => {
    const list = recentTransactions(
      [
        makeTx({ id: "old", date: "2026-10-01" }),
        makeTx({ id: "b", date: "2026-10-09" }),
        makeTx({ id: "a", date: "2026-10-09" }),
        makeTx({ id: "new", date: "2026-10-10" }),
      ],
      3,
    );
    expect(list.map((t) => t.id)).toEqual(["new", "a", "b"]);
  });
});

describe("groupSmallCategories", () => {
  const rows = spendingByCategory(
    ["groceries", "dining", "transport", "health", "education", "utilities", "housing"].map(
      (categoryId, i) => makeTx({ categoryId, amount: (10 - i) * 100_00 }),
    ),
  );

  it("returns the rows unchanged when they already fit", () => {
    expect(groupSmallCategories(rows, 7)).toEqual(rows);
    expect(groupSmallCategories([], 5)).toEqual([]);
  });

  it("folds the smallest categories into one row without changing totals", () => {
    const grouped = groupSmallCategories(rows, 5);
    expect(grouped).toHaveLength(5);
    expect(grouped.at(-1)?.name).toBe("Other categories");
    expect(grouped.reduce((t, r) => t + r.amount, 0)).toBe(rows.reduce((t, r) => t + r.amount, 0));
    expect(grouped.reduce((t, r) => t + r.permille, 0)).toBe(1000);
  });
});
