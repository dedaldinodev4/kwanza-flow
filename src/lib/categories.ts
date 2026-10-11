import type { Category, TransactionType } from "@/types/domain";

//* Fixed category list for the MVP (custom categories are out of scope). *//
export const CATEGORIES: readonly Category[] = [
  { id: "salary", name: "Salary", type: "income" },
  { id: "freelance", name: "Freelance", type: "income" },
  { id: "other-income", name: "Other income", type: "income" },
  { id: "housing", name: "Housing", type: "expense" },
  { id: "groceries", name: "Groceries", type: "expense" },
  { id: "transport", name: "Transport", type: "expense" },
  { id: "utilities", name: "Utilities & bills", type: "expense" },
  { id: "dining", name: "Dining out", type: "expense" },
  { id: "health", name: "Health", type: "expense" },
  { id: "education", name: "Education", type: "expense" },
  { id: "entertainment", name: "Entertainment", type: "expense" },
  { id: "other-expense", name: "Other expenses", type: "expense" },
] as const;

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((category) => category.id === id);
}

export function categoriesOfType(type: TransactionType): Category[] {
  return CATEGORIES.filter((category) => category.type === type);
}
