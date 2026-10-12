"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useFormat } from "@/providers/use-format";
import type { SavingsGoal } from "@/types/domain";

interface DeleteGoalDialogProps {
  goal: SavingsGoal | null;
  onConfirm: (g: SavingsGoal) => void;
  onCancel: () => void;
  onCloseAutoFocus: (event: Event) => void;
}

export function DeleteGoalDialog({
  goal,
  onConfirm,
  onCancel,
  onCloseAutoFocus,
}: DeleteGoalDialogProps) {
  const { money } = useFormat();
  return (
    <AlertDialog open={goal !== null} onOpenChange={(open) => !open && onCancel()}>
      {goal && (
        <AlertDialogContent
          title="Delete this goal?"
          description={`“${goal.name}” and its progress (${money(goal.currentAmount)} saved) will be removed. This cannot be undone.`}
          confirmLabel="Delete goal"
          onConfirm={() => onConfirm(goal)}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </AlertDialog>
  );
}
