import { MAX_MINOR_UNITS } from "@/constants";
import { parseMoneyInput } from "./parse-money";

/**
 * One set of rules and messages for every amount field (transactions, budgets, goals).
 * Returns an error message, or null when the text is a usable amount.
 */
export function amountError(text: string, options: { allowZero?: boolean } = {}): string | null {
  const minor = parseMoneyInput(text);
  if (minor === null) 
    return "Enter a valid amount, for example 1.500,50.";
  
  if (minor === 0 && !options.allowZero) 
    return "Amount must be greater than zero.";

  if (minor > MAX_MINOR_UNITS) 
    return "That amount is too large.";
  
  return null;
}
