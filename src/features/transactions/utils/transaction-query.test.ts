import { describe, expect, it } from "vitest";
import { makeTx } from "@/test/factories";
import {
  DEFAULT_QUERY,
  hasActiveFilters,
  normalizeText,
  queryTransactions,
  type TransactionQuery,
} from "./transaction-query";

const q = (overrides: Partial<TransactionQuery> = {}): TransactionQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
});

const txs = [
  makeTx({
    id: "a",
    description: "Café da manhã",
    amount: 2_000_00,
    date: "2026-10-03",
    categoryId: "dining",
  }),
  makeTx({
    id: "b",
    description: "Supermarket",
    amount: 38_000_00,
    date: "2026-10-05",
    categoryId: "groceries",
  }),
  makeTx({
    id: "c",
    description: "Monthly salary",
    type: "income",
    categoryId: "salary",
    amount: 780_000_00,
    date: "2026-10-05",
  }),
  makeTx({
    id: "d",
    description: "Taxi",
    amount: 38_000_00,
    date: "2026-09-30",
    categoryId: "transport",
  }),
  makeTx({
    id: "e",
    description: "taxi again",
    amount: 1_500_00,
    date: "2026-10-01",
    categoryId: "transport",
  }),
];
const ids = (r: { items: { id: string }[] }) => r.items.map((t) => t.id);

describe("search", () => {
  it("is case-insensitive and accent-insensitive", () => {
    expect(ids(queryTransactions(txs, q({ search: "CAFE" })))).toEqual(["a"]);
    expect(ids(queryTransactions(txs, q({ search: "manha" })))).toEqual(["a"]);
    expect(normalizeText("  SALÁRIO ")).toBe("salario");
  });

  it("matches substrings and ignores surrounding whitespace", () => {
    expect(ids(queryTransactions(txs, q({ search: "  tax ", sort: "date-asc" })))).toEqual([
      "d",
      "e",
    ]);
  });

  it("returns nothing (not everything) when there is no match", () => {
    const r = queryTransactions(txs, q({ search: "zzz" }));
    expect(r.items).toEqual([]);
    expect(r.totalMatches).toBe(0);
    expect(r.hasActiveFilters).toBe(true);
  });
});

describe("filters", () => {
  it("filters by type and by category", () => {
    expect(ids(queryTransactions(txs, q({ type: "income" })))).toEqual(["c"]);
    expect(ids(queryTransactions(txs, q({ categoryId: "transport", sort: "date-asc" })))).toEqual([
      "d",
      "e",
    ]);
  });

  it("combines filters with AND", () => {
    expect(
      ids(queryTransactions(txs, q({ type: "expense", categoryId: "transport", search: "again" }))),
    ).toEqual(["e"]);
    expect(
      queryTransactions(txs, q({ type: "income", categoryId: "transport" })).totalMatches,
    ).toBe(0);
  });

  it("treats the date range as inclusive on both ends", () => {
    expect(
      ids(queryTransactions(txs, q({ from: "2026-10-01", to: "2026-10-03", sort: "date-asc" }))),
    ).toEqual(["e", "a"]);
    expect(ids(queryTransactions(txs, q({ from: "2026-10-05" })))).toEqual(
      expect.arrayContaining(["b", "c"]),
    );
    expect(ids(queryTransactions(txs, q({ to: "2026-09-30" })))).toEqual(["d"]);
  });

  it("reports a reversed range instead of silently returning data", () => {
    const r = queryTransactions(txs, q({ from: "2026-10-10", to: "2026-10-01" }));
    expect(r.rangeError).toMatch(/start date/i);
    expect(r.items).toEqual([]);
  });

  it("knows when filters are active", () => {
    expect(hasActiveFilters(DEFAULT_QUERY)).toBe(false);
    expect(hasActiveFilters(q({ search: "x" }))).toBe(true);
    expect(hasActiveFilters(q({ sort: "amount-asc", page: 3 }))).toBe(false); // sorting/paging are not filters
  });
});

describe("sorting is stable", () => {
  it("sorts by date, amount and description", () => {
    expect(ids(queryTransactions(txs, q({ sort: "date-asc" })))).toEqual(["d", "e", "a", "b", "c"]); // b/c tie on date → id order
    expect(ids(queryTransactions(txs, q({ sort: "amount-desc" })))[0]).toBe("c");
    expect(ids(queryTransactions(txs, q({ sort: "amount-asc" })))[0]).toBe("e");
    expect(ids(queryTransactions(txs, q({ sort: "description-asc" })))[0]).toBe("a"); // "Café" before "Monthly"
  });

  it("breaks ties deterministically (equal amounts keep newest first)", () => {
    // Reversed input puts the OLDER 38 000 Kz item (d) first, so without a tie-break it would win.
    const reversed = [...txs].reverse();
    const r = queryTransactions(reversed, q({ sort: "amount-desc" }));
    expect(ids(r).indexOf("b")).toBeLessThan(ids(r).indexOf("d")); // b (5 Oct) is newer than d (30 Sep)
    expect(ids(queryTransactions(txs, q({ sort: "amount-desc" })))).toEqual(ids(r)); // independent of input order
  });

  it("does not mutate the input array", () => {
    const copy = [...txs];
    queryTransactions(txs, q({ sort: "amount-asc" }));
    expect(txs).toEqual(copy);
  });
});

describe("pagination boundaries", () => {
  const many = Array.from({ length: 25 }, (_, i) =>
    makeTx({
      id: `t${String(i).padStart(2, "0")}`,
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      createdAt: `2026-10-${String(i + 1).padStart(2, "0")}T08:00:00.000Z`,
    }),
  );

  it("splits into pages with correct counts and ranges", () => {
    const p1 = queryTransactions(many, q({ page: 1 }));
    expect(p1).toMatchObject({
      page: 1,
      pageCount: 3,
      totalMatches: 25,
      firstIndex: 1,
      lastIndex: 10,
    });
    expect(p1.items).toHaveLength(10);
    const p3 = queryTransactions(many, q({ page: 3 }));
    expect(p3).toMatchObject({ page: 3, firstIndex: 21, lastIndex: 25 });
    expect(p3.items).toHaveLength(5);
  });

  it("never shows the same transaction on two pages", () => {
    const all = [1, 2, 3].flatMap((page) => ids(queryTransactions(many, q({ page }))));
    expect(new Set(all).size).toBe(25);
  });

  it("clamps a page that is out of range (for example after deleting the last item on a page)", () => {
    expect(queryTransactions(many, q({ page: 99 })).page).toBe(3);
    expect(queryTransactions(many, q({ page: 0 })).page).toBe(1);
    expect(queryTransactions(many, q({ page: -4 })).page).toBe(1);
    expect(queryTransactions(many, q({ page: Number.NaN })).page).toBe(1);
  });

  it("handles an exact multiple of the page size and an empty list", () => {
    expect(queryTransactions(many.slice(0, 20), q()).pageCount).toBe(2);
    expect(queryTransactions([], q())).toMatchObject({
      items: [],
      pageCount: 1,
      page: 1,
      firstIndex: 0,
      lastIndex: 0,
      totalMatches: 0,
    });
  });
});
