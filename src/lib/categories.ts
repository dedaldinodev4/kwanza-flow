import type { Category, TransactionType } from "@/types/domain";
import { message } from "@/i18n/utils/message";

//* Fixed category list for the MVP (custom categories are out of scope). *//
export const CATEGORIES: readonly Category[] = [
  { id: "salary", name: message("Salary"), type: "income" },
  { id: "freelance", name: message("Freelance"), type: "income" },
  { id: "other-income", name: message("Other income"), type: "income" },
  { id: "housing", name: message("Housing"), type: "expense" },
  { id: "groceries", name: message("Groceries"), type: "expense" },
  { id: "transport", name: message("Transport"), type: "expense" },
  { id: "utilities", name: message("Utilities & bills"), type: "expense" },
  { id: "dining", name: message("Dining out"), type: "expense" },
  { id: "health", name: message("Health"), type: "expense" },
  { id: "education", name: message("Education"), type: "expense" },
  { id: "entertainment", name: message("Entertainment"), type: "expense" },
  { id: "other-expense", name:message( "Other expenses"), type: "expense" },
] as const;

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((category) => category.id === id);
}

export function categoriesOfType(type: TransactionType): Category[] {
  return CATEGORIES.filter((category) => category.type === type);
}
