import { describe, expect, it } from "vitest";
import { summarize } from "@/lib/calculations";
import { buildMockData } from "@/mocks/mock-data";
import type { TransactionInput } from "../schemas/transaction-form";
import { createTransaction, deleteTransaction, updateTransaction } from "./transaction-service";

const data = buildMockData("2026-10-10");
const NOW = "2026-10-10T12:00:00.000Z";
const input: TransactionInput = {
  type: "expense",
  description: "Pharmacy",
  amount: 12_500_00,
  categoryId: "health",
  date: "2026-10-10",
};

describe("Transaction-service - createTransaction()", () => {
  it("appends a transaction with generated id and timestamps, without mutating the input data", () => {
    const before = data.transactions.length;
    const result = createTransaction(data, input, { now: NOW, makeId: () => "txn-new" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.transactions).toHaveLength(before + 1);
    expect(result.transaction).toMatchObject({
      id: "txn-new",
      createdAt: NOW,
      updatedAt: NOW,
      amount: 12_500_00,
    });
    expect(data.transactions).toHaveLength(before); // original untouched
  });

  it("changes the derived totals by exactly the amount", () => {
    const result = createTransaction(data, input, { now: NOW });
    if (!result.ok) throw new Error("expected ok");
    expect(
      summarize(result.data.transactions).expenses - summarize(data.transactions).expenses,
    ).toBe(12_500_00);
  });

  it("generates distinct ids by default", () => {
    const a = createTransaction(data, input, { now: NOW });
    const b = createTransaction(data, input, { now: NOW });
    expect(a.ok && b.ok && a.transaction.id !== b.transaction.id).toBe(true);
  });

  it("rejects a mismatched or unknown category and invalid amounts", () => {
    expect(createTransaction(data, { ...input, type: "income" }, { now: NOW })).toMatchObject({
      ok: false,
    });
    expect(createTransaction(data, { ...input, categoryId: "ghost" }, { now: NOW })).toMatchObject({
      ok: false,
    });
    expect(createTransaction(data, { ...input, amount: 0 }, { now: NOW })).toMatchObject({
      ok: false,
    });
    expect(createTransaction(data, { ...input, amount: 10.5 }, { now: NOW })).toMatchObject({
      ok: false,
    });
  });

  it("refuses a duplicate id", () => {
    const existing = data.transactions[0].id;
    expect(createTransaction(data, input, { now: NOW, makeId: () => existing })).toMatchObject({
      ok: false,
    });
  });
});

describe("Transaction-service - updateTransaction()", () => {
  const target = data.transactions.find((t) => t.type === "expense")!;

  it("replaces the details, keeps id and createdAt, and refreshes updatedAt", () => {
    const result = updateTransaction(
      data,
      target.id,
      { ...input, description: "Edited" },
      { now: NOW },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.transaction).toMatchObject({
      id: target.id,
      createdAt: target.createdAt,
      updatedAt: NOW,
      description: "Edited",
    });
    expect(result.data.transactions).toHaveLength(data.transactions.length);
  });

  it("recalculates totals after an amount or type change", () => {
    const base = summarize(data.transactions);
    const smaller = updateTransaction(data, target.id, { ...input, amount: 1_00 }, { now: NOW });
    if (!smaller.ok) throw new Error("expected ok");
    expect(summarize(smaller.data.transactions).expenses).toBe(
      base.expenses - target.amount + 1_00,
    );

    const toIncome = updateTransaction(
      data,
      target.id,
      { ...input, type: "income", categoryId: "freelance", amount: target.amount },
      { now: NOW },
    );
    if (!toIncome.ok) throw new Error("expected ok");
    const after = summarize(toIncome.data.transactions);
    expect(after.expenses).toBe(base.expenses - target.amount);
    expect(after.income).toBe(base.income + target.amount);
  });

  it("clears notes that were removed in the form", () => {
    const withNotes = {
      ...data,
      transactions: data.transactions.map((t) => (t.id === target.id ? { ...t, notes: "old" } : t)),
    };
    const result = updateTransaction(withNotes, target.id, input, { now: NOW });
    expect(result.ok && result.transaction).not.toHaveProperty("notes");
  });

  it("fails without changing anything for an unknown id or invalid input", () => {
    expect(updateTransaction(data, "missing", input, { now: NOW })).toEqual({
      ok: false,
      error: "That transaction no longer exists.",
    });
    expect(
      updateTransaction(data, target.id, { ...input, amount: -1 }, { now: NOW }),
    ).toMatchObject({ ok: false });
  });
});

describe("Transaction-service - deleteTransaction()", () => {
  it("removes exactly one transaction and reduces totals accordingly", () => {
    const target = data.transactions.find((t) => t.type === "expense")!;
    const result = deleteTransaction(data, target.id);
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.transactions).toHaveLength(data.transactions.length - 1);
    expect(result.data.transactions.some((t) => t.id === target.id)).toBe(false);
    expect(summarize(result.data.transactions).expenses).toBe(
      summarize(data.transactions).expenses - target.amount,
    );
  });

  it("fails cleanly for an unknown id (for example when deleted in another tab)", () => {
    expect(deleteTransaction(data, "missing")).toMatchObject({ ok: false });
  });
});
