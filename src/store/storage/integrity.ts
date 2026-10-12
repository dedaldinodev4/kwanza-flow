import { getCategory } from "@/lib/categories";
import type { AppData } from "@/types/domain";

/**
 * Rules a schema cannot express: references must resolve and keys must be unique.
 * Returns human-readable problems (empty array = consistent).
 */

export function checkIntegrity(data: AppData): string[] {
  const problems: string[] = [];

  const seen = new Set<string>();
  for (const t of data.transactions) {
    if (seen.has(t.id)) problems.push(`Duplicate transaction id "${t.id}".`);
    seen.add(t.id);
    const category = getCategory(t.categoryId);
    if (!category) problems.push(`Transaction "${t.id}" uses unknown category "${t.categoryId}".`);
    else if (category.type !== t.type)
      problems.push(
        `Transaction "${t.id}" is ${t.type} but category "${t.categoryId}" is ${category.type}.`,
      );
  }

  const budgetKeys = new Set<string>();
  for (const b of data.budgets) {
    const key = `${b.categoryId}|${b.month}`;
    if (budgetKeys.has(key))
      problems.push(`More than one budget for "${b.categoryId}" in ${b.month}.`);
    budgetKeys.add(key);
    if (getCategory(b.categoryId)?.type !== "expense")
      problems.push(`Budget "${b.id}" must use an expense category.`);
  }

  const goalIds = new Set<string>();
  for (const g of data.goals) {
    if (goalIds.has(g.id)) problems.push(`Duplicate goal id "${g.id}".`);
    goalIds.add(g.id);
  }
  return problems;
}
