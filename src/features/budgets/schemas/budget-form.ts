import { z } from "zod";
import { getCategory } from "@/lib/categories";
import { amountError } from "@/lib/money/amount-validation";
import { parseMoneyInput } from "@/lib/money/parse-money";


export const budgetFormSchema = z
  .object({
    categoryId: z.string().min(1, "Choose a category."),
    limit: z.string().trim().min(1, "Enter a monthly limit."),
  })
  .superRefine((values, ctx) => {
    if (values.categoryId && getCategory(values.categoryId)?.type !== "expense") {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Choose an expense category.",
      });
    }
    if (values.limit) {
      const message = amountError(values.limit);
      if (message) ctx.addIssue({ code: "custom", path: ["limit"], message });
    }
  });

export type BudgetFormValues = z.input<typeof budgetFormSchema>;

export interface BudgetInput {
  categoryId: string;
  month: string;
  limit: number;
}

//* Call only with values that passed `budgetFormSchema`. *//
export function toBudgetInput(values: BudgetFormValues, month: string): BudgetInput {
  const limit = parseMoneyInput(values.limit);
  if (limit === null)
    throw new Error("toBudgetInput called with an invalid limit.");

  return {
    categoryId: values.categoryId,
    month, 
    limit
  };
}
