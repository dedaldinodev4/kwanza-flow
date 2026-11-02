import { z } from "zod";

import { message } from "@/i18n/utils";
import { getCategory } from "@/lib/categories";
import { MAX_MINOR_UNITS } from "@/constants";
import { parseMoneyInput } from "@/lib/money/parse-money";

import { isoDateSchema, transactionTypeSchema, type TransactionType } from "@/types/domain";

//* Form values are all strings (what inputs hold); `toTransactionInput` converts them once they validate. *//
export const transactionFormSchema = z
  .object({
    type: transactionTypeSchema,
    description: z
      .string()
      .trim()
      .min(1, message("Enter a description."))
      .max(120, message("Use 120 characters or fewer.")),
    amount: z.string().trim().min(1, message("Enter an amount.")),
    categoryId: z.string().min(1, message("Choose a category.")),
    date: z.string().min(1, message("Choose a date.")),
    notes: z.string().trim().max(500, message("Use 500 characters or fewer.")),
  })
  .superRefine((values, ctx) => {
    if (values.amount.length > 0) {
      const minor = parseMoneyInput(values.amount);
      if (minor === null) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: message("Enter a valid amount, for example 1.500,50."),
        });
      } else if (minor <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: message("Amount must be greater than zero."),
        });
      } else if (minor > MAX_MINOR_UNITS) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: message("That amount is too large.") });
      }
    }

    if (values.categoryId.length > 0) {
      const category = getCategory(values.categoryId);
      if (!category || category.type !== values.type) {
        ctx.addIssue({
          code: "custom",
          path: ["categoryId"],
          message: message(`Choose an ${values.type} category.`),
        });
      }
    }

    if (values.date.length > 0) {
      const valid = isoDateSchema.safeParse(values.date).success;
      const year = Number(values.date.slice(0, 4));
      if (!valid) ctx.addIssue({ 
        code: "custom", 
        path: ["date"], 
        message: message("Enter a valid date.") 
      });
      else if (year < 2000 || year > 2100) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: message("Choose a date between 2000 and 2100."),
        });
      }
    }
  });

export type TransactionFormValues = z.input<typeof transactionFormSchema>;

//* The validated, normalised shape handed to the services. Amount is integer minor units. *//
export interface TransactionInput {
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  date: string;
  notes?: string;
}

//* Call only with values that passed `transactionFormSchema`. *//
export function toTransactionInput(values: TransactionFormValues): TransactionInput {
  const amount = parseMoneyInput(values.amount);
  if (amount === null) throw new Error("toTransactionInput called with an invalid amount.");
  const notes = values.notes.trim();
  return {
    type: values.type,
    description: values.description.trim(),
    amount,
    categoryId: values.categoryId,
    date: values.date,
    ...(notes ? { notes } : {}),
  };
}

export const EMPTY_FORM_VALUES = (today: string): TransactionFormValues => ({
  type: "expense",
  description: "",
  amount: "",
  categoryId: "",
  date: today,
  notes: "",
});
