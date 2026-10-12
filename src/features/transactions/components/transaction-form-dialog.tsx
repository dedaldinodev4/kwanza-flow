"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui";
import { categoriesOfType, getCategory } from "@/lib/categories";
import { todayIso } from "@/lib/dates/iso";
import { formatMinorForInput } from "@/lib/money/parse-money";
import { useAppActions, useAppData } from "@/providers/app-data-provider";
import type { Transaction, TransactionType } from "@/types/domain";
import {
  EMPTY_FORM_VALUES,
  toTransactionInput,
  transactionFormSchema,
  type TransactionFormValues,
} from "../schemas/transaction-form";
import { createTransaction, updateTransaction } from "../services/transaction-service";

export type FormMode = { kind: "create" } | { kind: "edit"; transaction: Transaction };

interface TransactionFormDialogProps {
  mode: FormMode | null;
  onClose: () => void;
}

export function TransactionFormDialog({ mode, onClose }: TransactionFormDialogProps) {
  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      {mode && (
        <DialogContent
          title={mode.kind === "create" ? "Add transaction" : "Edit transaction"}
          description={
            mode.kind === "create"
              ? "Record an income or an expense. Amounts are in kwanza (Kz)."
              : "Update the details. Your totals, charts and budgets update automatically."
          }
        >
          {/* Mounted only while open, so every opening starts from fresh default values. */}
          <TransactionForm mode={mode} onDone={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function valuesFromTransaction(t: Transaction): TransactionFormValues {
  return {
    type: t.type,
    description: t.description,
    amount: formatMinorForInput(t.amount),
    categoryId: t.categoryId,
    date: t.date,
    notes: t.notes ?? "",
  };
}

const TYPE_LABELS: Record<TransactionType, string> = { expense: "Expense", income: "Income" };

function TransactionForm({ mode, onDone }: { mode: FormMode; onDone: () => void }) {
  const uid = useId();
  const state = useAppData();
  const { tryMutate } = useAppActions();
  const submitting = useRef(false);

  const today = state.status === "ready" ? state.today : todayIso();
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues:
      mode.kind === "edit" ? valuesFromTransaction(mode.transaction) : EMPTY_FORM_VALUES(today),
    mode: "onTouched", // validate a field when it loses focus, then live as it is corrected
  });
  const type = useWatch({ control, name: "type" });

  const id = (field: string) => `${uid}-${field}`;
  const describedBy = (field: keyof TransactionFormValues, hint?: boolean) =>
    [hint ? id(`${field}-hint`) : null, errors[field] ? id(`${field}-error`) : null]
      .filter(Boolean)
      .join(" ") || undefined;

  async function onValid(values: TransactionFormValues) {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const input = toTransactionInput(values);
      const now = new Date().toISOString();
      const result = tryMutate((data) =>
        mode.kind === "create"
          ? createTransaction(data, input, { now })
          : updateTransaction(data, mode.transaction.id, input, { now }),
      );

      if (!result.ok && result.reason === "rejected") {
        setError("root.server", { message: result.error }); // nothing changed: stay open and explain
        submitting.current = false;
        return;
      }
      if (!result.ok) {
        toast.warning(`${result.error} Your change is kept for this session only.`);
      } else {
        toast.success(mode.kind === "create" ? "Transaction added" : "Transaction updated");
      }
      onDone();
    } catch (error) {
      submitting.current = false;
      throw error;
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate className="space-y-5">
      <fieldset>
        <legend className="text-label mb-1.5">Type</legend>
        <div className="rounded-control bg-muted grid grid-cols-2 gap-1 border p-1">
          {(["expense", "income"] as const).map((option) => (
            <label key={option} className="relative">
              <input
                type="radio"
                value={option}
                className="peer sr-only"
                {...register("type", {
                  onChange: (event) => {
                    if (getCategory(getValues("categoryId"))?.type !== event.target.value) {
                      setValue("categoryId", "");
                    }
                  },
                })}
              />
              <span className="transition-ui text-muted-foreground peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-card peer-focus-visible:outline-ring flex min-h-11 cursor-pointer items-center justify-center rounded-[8px] text-sm font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                {TYPE_LABELS[option]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor={id("description")}>Description</Label>
        <Input
          id={id("description")}
          autoComplete="off"
          aria-invalid={!!errors.description}
          aria-describedby={describedBy("description")}
          {...register("description")}
        />
        <FieldError id={id("description-error")} message={errors.description?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={id("amount")}>Amount (Kz)</Label>
          <Input
            id={id("amount")}
            inputMode="decimal"
            autoComplete="off"
            placeholder="1.500,50"
            aria-invalid={!!errors.amount}
            aria-describedby={describedBy("amount", true)}
            {...register("amount")}
          />
          <p id={id("amount-hint")} className="text-caption text-muted-foreground mt-1.5">
            Use a comma for cêntimos.
          </p>
          <FieldError id={id("amount-error")} message={errors.amount?.message} />
        </div>
        <div>
          <Label htmlFor={id("date")}>Date</Label>
          <Input
            id={id("date")}
            type="date"
            aria-invalid={!!errors.date}
            aria-describedby={describedBy("date")}
            {...register("date")}
          />
          <FieldError id={id("date-error")} message={errors.date?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor={id("category")}>Category</Label>
        <Select
          id={id("category")}
          aria-invalid={!!errors.categoryId}
          aria-describedby={describedBy("categoryId")}
          {...register("categoryId")}
        >
          <option value="">Choose a category</option>
          {categoriesOfType(type).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <FieldError id={id("categoryId-error")} message={errors.categoryId?.message} />
      </div>

      <div>
        <Label htmlFor={id("notes")}>
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={id("notes")}
          aria-invalid={!!errors.notes}
          aria-describedby={describedBy("notes")}
          {...register("notes")}
        />
        <FieldError id={id("notes-error")} message={errors.notes?.message} />
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
          {isSubmitting ? "Saving…" : mode.kind === "create" ? "Add transaction" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
