import { describe, expect, it } from "vitest";
import { budgetFormSchema, toBudgetInput } from "./budget-form";

const errorsOf = (values: { categoryId: string; limit: string }) => {
  const r = budgetFormSchema.safeParse(values);
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
}; 

describe("budgetFormSchema", () => {
  it("accepts an expense category and a valid limit", () => {
    expect(errorsOf({ categoryId: "groceries", limit: "130.000" })).toEqual({});
  });

  it("requires both fields", () => {
    expect(errorsOf({ categoryId: "", limit: "" })).toEqual({
      categoryId: "Choose a category.",
      limit: "Enter a monthly limit.",
    });
  });

  it("refuses income categories, which cannot be budgeted", () => {
    expect(errorsOf({ categoryId: "salary", limit: "100" }).categoryId).toBe(
      "Choose an expense category.",
    );
  });

  it.each(["abc", "0", "-5", "12,345"])("refuses the limit %j", (limit) => {
    expect(errorsOf({ categoryId: "dining", limit }).limit).toBeDefined();
  });

  it("converts to integer minor units for the chosen month", () => {
    expect(toBudgetInput({ categoryId: "dining", limit: "55.000,50" }, "2026-10")).toEqual({
      categoryId: "dining",
      month: "2026-10",
      limit: 5_500_050,
    });
  });
});
 