import { goalProgress } from "@/lib/calculations";
import type { SavingsGoal } from "@/types/domain";


export function sortGoals(goals: readonly SavingsGoal[]): SavingsGoal[] {
  return [...goals].sort((a, b) => {
    const aDone = goalProgress(a).completed;
    const bDone = goalProgress(b).completed;
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (aDone)
      return (
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.name.localeCompare(b.name) ||
        a.id.localeCompare(b.id)
      );
    const aDate = a.targetDate ?? "9999-12-31";
    const bDate = b.targetDate ?? "9999-12-31";
    return aDate.localeCompare(bDate) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
