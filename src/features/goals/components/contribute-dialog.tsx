"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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

export function ContributeDialog({
  goal,
  onClose,
}: {
  goal: SavingsGoal | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={goal !== null} onOpenChange={(open) => !open && onClose()}>
      {goal && (
        <DialogContent
          title={`Add money to ${goal.name}`}
          description="Record an amount you have set aside for this goal."
        >
          <ContributeForm goal={goal} onDone={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ContributeForm({ goal, onDone }: { goal: SavingsGoal; onDone: () => void }) {
  const uid = useId();
  const { money } = useFormat();
  const { tryMutate } = useAppActions();
  const submitting = useRef(false);
  const { remaining } = goalProgress(goal);

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
        setError("root.server", { message: result.error });
        submitting.current = false;
        return;
      }
      const reached = amount >= remaining;
      const message = reached
        ? `Goal reached: ${goal.name}`
        : `Added ${money(amount)} to ${goal.name}`;
      if (!result.ok)
        toast.warning(`${result.error} Your contribution is kept for this session only.`);
      else toast.success(message);
      onDone();
    } catch (error) {
      submitting.current = false;
      throw error;
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate className="space-y-5">
      <p className="money rounded-control bg-muted p-3 text-sm">
        {money(goal.currentAmount)} saved of {money(goal.targetAmount)} · {money(remaining)} to go
      </p>
      <div>
        <Label htmlFor={`${uid}-amount`}>Amount (Kz)</Label>
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
        <Button variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add money"}
        </Button>
      </div>
    </form>
  );
}
