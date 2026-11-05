"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation()
  const { money } = useFormat();

  return (
    <AlertDialog open={goal !== null} onOpenChange={(open) => !open && onCancel()}>
      {goal && (
        <AlertDialogContent
          title={t("Delete this goal?")}
          description={t("“{{name}}” and its progress ({{amount}} saved) will be removed. This cannot be undone.", { name: goal.name, amount: money(goal.currentAmount) })}
          confirmLabel={t("Delete goal")}
          onConfirm={() => onConfirm(goal)}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </AlertDialog>
  );
}
