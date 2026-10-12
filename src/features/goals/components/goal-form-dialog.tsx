"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button, FieldError, Input, Label } from "@/components/ui";

import { todayIso } from "@/lib/dates/iso";
import { formatMinorForInput } from "@/lib/money/parse-money";
import { useAppActions, useAppData } from "@/providers/app-data-provider";
import type { SavingsGoal } from "@/types/domain";

import {
  createGoalFormSchema,
  toGoalInput,
  type GoalFormValues
} from "../schemas/goal-form";
import {
  createGoal,
  updateGoal
} from "../services/goal-service";

export type GoalFormMode = { kind: "create" } | { kind: "edit"; goal: SavingsGoal };

export function GoalFormDialog({
  mode,
  onClose,
}: {
  mode: GoalFormMode | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      {mode && (
        <DialogContent
          title={mode.kind === "create" ? "Add savings goal" : "Edit goal"}
          description={
            mode.kind === "create"
              ? "Name what you are saving for and set a target in kwanza (Kz)."
              : "Update the details. You can also correct how much is saved so far."
          }
        >
          <GoalForm mode={mode} onDone={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function GoalForm({ mode, onDone }: { mode: GoalFormMode; onDone: () => void }) {
  const uid = useId();
  const state = useAppData();
  const { tryMutate } = useAppActions();
  const submitting = useRef(false);
  const today = state.status === "ready" ? state.today : todayIso();
  const original = mode.kind === "edit" ? mode.goal : undefined;

  const schema = useMemo(
    () => createGoalFormSchema({ today, originalTargetDate: original?.targetDate }),
    [today, original?.targetDate],
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: original
      ? {
        name: original.name,
        targetAmount: formatMinorForInput(original.targetAmount),
        currentAmount: formatMinorForInput(original.currentAmount),
        targetDate: original.targetDate ?? "",
      }
      : { name: "", targetAmount: "", currentAmount: "", targetDate: "" },
    mode: "onTouched",
  });

  const id = (name: string) => `${uid}-${name}`;
  const describedBy = (field: keyof GoalFormValues, hint?: boolean) =>
    [hint ? id(`${field}-hint`) : null, errors[field] ? id(`${field}-error`) : null]
      .filter(Boolean)
      .join(" ") || undefined;

  async function onValid(values: GoalFormValues) {
    if (submitting.current) return; // stays locked after success (the form unmounts); released only on refusal
    submitting.current = true;
    try {
      const input = toGoalInput(values);
      const now = new Date().toISOString();
      const result = tryMutate((data) =>
        mode.kind === "create"
          ? createGoal(data, input, { now })
          : updateGoal(data, mode.goal.id, input, { now }),
      );
      if (!result.ok && result.reason === "rejected") {
        setError("root.server", { message: result.error });
        submitting.current = false;
        return;
      }
      if (!result.ok) toast.warning(`${result.error} Your change is kept for this session only.`);
      else toast.success(mode.kind === "create" ? "Goal added" : "Goal updated");
      onDone();
    } catch (error) {
      submitting.current = false;
      throw error;
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate className="space-y-5">
      <div>
        <Label htmlFor={id("name")}>Goal name</Label>
        <Input
          id={id("name")}
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          {...register("name")}
        />
        <FieldError id={id("name-error")} message={errors.name?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={id("target")}>Target amount (Kz)</Label>
          <Input
            id={id("target")}
            inputMode="decimal"
            autoComplete="off"
            placeholder="450.000"
            aria-invalid={!!errors.targetAmount}
            aria-describedby={describedBy("targetAmount")}
            {...register("targetAmount")}
          />
          <FieldError id={id("targetAmount-error")} message={errors.targetAmount?.message} />
        </div>
        <div>
          <Label htmlFor={id("current")}>
            {mode.kind === "create" ? "Already saved (Kz)" : "Saved so far (Kz)"}
            {mode.kind === "create" && (
              <span className="text-muted-foreground font-normal"> (optional)</span>
            )}
          </Label>
          <Input
            id={id("current")}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            aria-invalid={!!errors.currentAmount}
            aria-describedby={describedBy("currentAmount")}
            {...register("currentAmount")}
          />
          <FieldError id={id("currentAmount-error")} message={errors.currentAmount?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor={id("date")}>
          Target date <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id={id("date")}
          type="date"
          min={original?.targetDate && original.targetDate < today ? undefined : today}
          aria-invalid={!!errors.targetDate}
          aria-describedby={describedBy("targetDate")}
          {...register("targetDate")}
        />
        <FieldError id={id("targetDate-error")} message={errors.targetDate?.message} />
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
          {isSubmitting ? "Saving…" : mode.kind === "create" ? "Add goal" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
