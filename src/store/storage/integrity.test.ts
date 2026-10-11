import { describe, expect, it } from "vitest";

import { buildMockData } from "@/mocks/mock-data";
import { makeBudget, makeGoal, makeTx } from "@/test/factories";

import { checkIntegrity } from "./integrity";

const base = buildMockData("2026-10-10");

describe("storage - checkIntegrity", () => {
  it("accepts the demo data", () => {
    expect(checkIntegrity(base)).toEqual([]);
  });

  it("rejects an unknown category", () => {
    const data = { ...base, transactions: [makeTx({ categoryId: "does-not-exist" })] };
    expect(checkIntegrity(data)[0]).toMatch(/unknown category/);
  });

  it("rejects a transaction whose category type does not match", () => {
    const data = { ...base, transactions: [makeTx({ type: "income", categoryId: "groceries" })] };
    expect(checkIntegrity(data)[0]).toMatch(/is income but category/);
  });

  it("rejects duplicate ids for transactions and goals", () => {
    const dupTx = makeTx({ id: "same" });
    expect(checkIntegrity({ ...base, transactions: [dupTx, { ...dupTx }] })[0]).toMatch(
      /Duplicate transaction id/,
    );
    const goal = makeGoal({ id: "g" });
    expect(checkIntegrity({ ...base, goals: [goal, { ...goal }] })[0]).toMatch(/Duplicate goal id/);
  });

  it("rejects two budgets for the same category and month, and budgets on income categories", () => {
    const a = makeBudget({ categoryId: "dining", month: "2026-10" });
    expect(
      checkIntegrity({
        ...base,
        budgets: [a, makeBudget({ categoryId: "dining", month: "2026-10" })],
      })[0],
    ).toMatch(/More than one budget/);
    expect(checkIntegrity({ ...base, budgets: [makeBudget({ categoryId: "salary" })] })[0]).toMatch(
      /expense category/,
    );
  });
});
