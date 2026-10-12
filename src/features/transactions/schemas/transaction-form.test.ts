import { describe, expect, it } from "vitest";

import {
  EMPTY_FORM_VALUES,
  toTransactionInput,
  transactionFormSchema,
  type TransactionFormValues,
} from "./transaction-form";

const valid: TransactionFormValues = {
  type: "expense",
  description: "Supermarket",
  amount: "1.500,50",
  categoryId: "groceries",
  date: "2026-10-10",
  notes: "",
};

const errorsOf = (values: Partial<TransactionFormValues>) => {
  const result = transactionFormSchema.safeParse({ ...valid, ...values });
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe("transactionFormSchema", () => {
  it("accepts valid values", () => {
    expect(transactionFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires every mandatory field with a clear message", () => {
    expect(errorsOf({ description: "", amount: "", categoryId: "", date: "" })).toEqual({
      description: "Enter a description.",
      amount: "Enter an amount.",
      categoryId: "Choose a category.",
      date: "Choose a date.",
    });
  });

  it("treats a whitespace-only description as empty", () => {
    expect(errorsOf({ description: "    " }).description).toBe("Enter a description.");
  });

  it.each([
    ["abc", /valid amount/],
    ["-50", /valid amount/],
    ["12,345", /valid amount/],
    ["0", /greater than zero/],
    ["0,00", /greater than zero/],
    ["100000000001", /too large/], // just over the Kz 100 billion limit
  ])("rejects the amount %j", (amount, message) => {
    expect(errorsOf({ amount }).amount).toMatch(message);
  });

  it("rejects a category that does not belong to the chosen type", () => {
    expect(errorsOf({ type: "income", categoryId: "groceries" }).categoryId).toBe(
      "Choose an income category.",
    );
    expect(errorsOf({ type: "expense", categoryId: "salary" }).categoryId).toBe(
      "Choose an expense category.",
    );
    expect(errorsOf({ categoryId: "no-such-category" }).categoryId).toBeDefined();
  });

  it("rejects impossible and out-of-range dates", () => {
    expect(errorsOf({ date: "2026-02-30" }).date).toBe("Enter a valid date.");
    expect(errorsOf({ date: "1999-12-31" }).date).toMatch(/between 2000 and 2100/);
    expect(errorsOf({ date: "2101-01-01" }).date).toMatch(/between 2000 and 2100/);
  });

  it("limits description and notes length", () => {
    expect(errorsOf({ description: "x".repeat(121) }).description).toMatch(/120/);
    expect(errorsOf({ notes: "n".repeat(501) }).notes).toMatch(/500/);
  });
});

describe("toTransactionInput", () => {
  it("converts to integer minor units and trims text", () => {
    expect(toTransactionInput({ ...valid, description: "  Lunch  ", notes: "  nice  " })).toEqual({
      type: "expense",
      description: "Lunch",
      amount: 150_050,
      categoryId: "groceries",
      date: "2026-10-10",
      notes: "nice",
    });
  });

  it("omits empty notes entirely", () => {
    expect(toTransactionInput(valid)).not.toHaveProperty("notes");
  });

  it("refuses values that were never validated", () => {
    expect(() => toTransactionInput({ ...valid, amount: "oops" })).toThrow();
  });

  it("provides empty defaults that start on the given day", () => {
    expect(EMPTY_FORM_VALUES("2026-10-10")).toMatchObject({
      type: "expense",
      date: "2026-10-10",
      amount: "",
      categoryId: "",
    });
  });
});
