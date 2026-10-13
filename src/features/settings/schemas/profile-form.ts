import { z } from "zod";
import { amountError } from "@/lib/money/amount-validation";
import { parseMoneyInput } from "@/lib/money/parse-money";

//* ProfileFormSchema *//
export const profileFormSchema = z
  .object({
    displayName: z.string().trim().min(1, "Enter a name.").max(60, "Use 60 characters or fewer."),
    openingBalance: z.string().trim().min(1, "Enter an opening balance (0 is fine)."),
  })
  .superRefine((values, ctx) => {
    if (values.openingBalance) {
      const message = amountError(values.openingBalance, { allowZero: true });
      if (message) ctx.addIssue({ code: "custom", path: ["openingBalance"], message });
    }
  });

export type ProfileFormValues = z.input<typeof profileFormSchema>;

//* Call only with values that passed `profileFormSchema`. *//
export function toProfilePatch(values: ProfileFormValues): {
  displayName: string;
  openingBalance: number;
} {
  const openingBalance = parseMoneyInput(values.openingBalance);
  if (openingBalance === null)
    throw new Error("toProfilePatch called with an invalid opening balance.");
  return { displayName: values.displayName.trim(), openingBalance };
}
