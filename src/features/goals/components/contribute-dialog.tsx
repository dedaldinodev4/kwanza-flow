"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button, FieldError, Input, Label } from "@/components/ui";

import { goalProgress } from "@/lib/calculations";
import { parseMoneyInput } from "@/lib/money/parse-money";
import { useAppActions } from "@/providers/app-data-provider";
import { useFormat } from "@/providers/use-format";
import type { SavingsGoal } from "@/types/domain";

import {
  contributionFormSchema,
  type ContributionFormValues
} from "../schemas/goal-form";
import { contributeToGoal } from "../services/goal-service";
import { useDemoText, useMessage } from "@/hooks/use-i18n";

export function ContributeDialog({
  goal,
  onClose,
}: {
  goal: SavingsGoal | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const demoText = useDemoText();

  return (
    <Dialog open={goal !== null} onOpenChange={(open) => !open && onClose()}>
      {goal && (
        <DialogContent
          title={t("Add money to {{name}}", { name: demoText(goal.name) })}
          description={t("Record an amount you have set aside for this goal.")}
        >
          <ContributeForm goal={goal} onDone={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ContributeForm({ goal, onDone }: { goal: SavingsGoal; onDone: () => void }) {
  const { t } = useTranslation()
  const message = useMessage();
  const demoText = useDemoText();
  const uid = useId();
  const { money } = useFormat();
  const { tryMutate } = useAppActions();
  const submitting = useRef(false);
  const { remaining } = goalProgress(goal);
  const name = demoText(goal.name);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: { amount: "" },
    mode: "onTouched",
  });

  async function onValid(values: ContributionFormValues) {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const amount = parseMoneyInput(values.amount);
      if (amount === null) throw new Error("Contribution amount was not validated.");
      const now = new Date().toISOString();
      const result = tryMutate((data) => contributeToGoal(data, goal.id, amount, { now }));
      if (!result.ok && result.reason === "rejected") {
        setError("root.server", { message: message(result.error, result.params) });
        submitting.current = false;
        return;
      }
      const reached = amount >= remaining;
      const toastText = reached
        ? t("Goal reached: {{name}}", { name })
        : t("Added {{amount}} to {{name}}", { amount: money(amount), name });
      if (!result.ok)
        toast.warning(t("{{error}} Your contribution is kept for this session only.", {
          error: message(result.error, result.params),
        }));
      else toast.success(toastText);
      onDone();
    } catch (error) {
      submitting.current = false;
      throw error;
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate className="space-y-5">
      <p className="money rounded-control bg-muted p-3 text-sm">
        {t("{{current}} saved of {{target}} · {{remaining}} to go", {
          current: money(goal.currentAmount),
          target: money(goal.targetAmount),
          remaining: money(remaining)
        })}

      </p>
      <div>
        <Label htmlFor={`${uid}-amount`}>{t("Amount (Kz)")}</Label>
        <Input
          id={`${uid}-amount`}
          inputMode="decimal"
          autoComplete="off"
          placeholder="25.000"
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? `${uid}-amount-error` : undefined}
          {...register("amount")}
        />
        <FieldError id={`${uid}-amount-error`} message={errors.amount?.message} />
      </div>
      {errors.root?.server && (
        <p
          role="alert"
          className="rounded-control bg-destructive-surface text-destructive p-3 text-sm font-medium"
        >
          {errors.root.server.message}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="cursor-pointer" variant="outline" onClick={onDone} disabled={isSubmitting}>
          {t("Cancel")}
        </Button>
        <Button className="cursor-pointer" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("Saving…") : t("Add money")}
        </Button>
      </div>
    </form>
  );
}
