import { z } from "zod";
import { amountError } from "@/lib/money/amount-validation";
import { parseMoneyInput } from "@/lib/money/parse-money";
import { isoDateSchema } from "@/types/domain";

interface GoalSchemaOptions {
  today: string;
  originalTargetDate?: string;
}

export function createGoalFormSchema({ today, originalTargetDate }: GoalSchemaOptions) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Enter a name for the goal.")
        .max(80, "Use 80 characters or fewer."),
      targetAmount: z.string().trim().min(1, "Enter a target amount."),
      currentAmount: z.string().trim(),
      targetDate: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.targetAmount) {
        const message = amountError(values.targetAmount);
        if (message) ctx.addIssue({ code: "custom", path: ["targetAmount"], message });
      }
      if (values.currentAmount) {
        const message = amountError(values.currentAmount, { allowZero: true });
        if (message) ctx.addIssue({ code: "custom", path: ["currentAmount"], message });
      }
      if (values.targetDate) {
        if (!isoDateSchema.safeParse(values.targetDate).success) {
          ctx.addIssue({ code: "custom", path: ["targetDate"], message: "Enter a valid date." });
        } else if (values.targetDate < today && values.targetDate !== originalTargetDate) {
          ctx.addIssue({
            code: "custom",
            path: ["targetDate"],
            message: "Choose today or a later date.",
          });
        } else if (Number(values.targetDate.slice(0, 4)) > 2100) {
          ctx.addIssue({
            code: "custom",
            path: ["targetDate"],
            message: "Choose a date before 2101.",
          });
        }
      }
    });
}

export type GoalFormValues = z.input<ReturnType<typeof createGoalFormSchema>>;

export interface GoalInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
}

/** Call only with values that passed the goal schema. Blank "saved so far" becomes 0, blank date is omitted. */
export function toGoalInput(values: GoalFormValues): GoalInput {
  const targetAmount = parseMoneyInput(values.targetAmount);
  const currentAmount = values.currentAmount ? parseMoneyInput(values.currentAmount) : 0;

  if (targetAmount === null || currentAmount === null)
    throw new Error("toGoalInput called with invalid amounts.");

  return {
    name: values.name.trim(),
    targetAmount,
    currentAmount,
    ...(values.targetDate ? { targetDate: values.targetDate } : {}),
  };
}

export const contributionFormSchema = z
  .object({ amount: z.string().trim().min(1, "Enter an amount.") })
  .superRefine((values, ctx) => {
    if (values.amount) {
      const message = amountError(values.amount);
      if (message) ctx.addIssue({ code: "custom", path: ["amount"], message });
    }
  });

export type ContributionFormValues = z.input<typeof contributionFormSchema>;
