"use client";

import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button, FieldError, Input, Label, Select } from "@/components/ui";

import { categoriesOfType } from "@/lib/categories";
import { formatMonth } from "@/lib/formatters/date";
import { formatMinorForInput } from "@/lib/money/parse-money";
import { useAppActions } from "@/providers/app-data-provider";
import type { Budget } from "@/types/domain";

import { budgetFormSchema, toBudgetInput, type BudgetFormValues } from "../schemas/budget-form";
import { createBudget, updateBudgetLimit } from "../services/budget-service";
import { useLanguage } from "@/providers/i18n-provider";
import { useCategoryName, useDemoText, useMessage } from "@/hooks/use-i18n";
import { useFormat } from "@/providers/use-format";

export type BudgetFormMode =
  | {
    kind: "create";
    month: string;
    takenCategoryIds: string[];
  }
  | { kind: "edit"; budget: Budget };

interface BudgetFormDialogProps {
  mode: BudgetFormMode | null;
  onClose: () => void;
}

export function BudgetFormDialog({ mode, onClose }: BudgetFormDialogProps) {
  const { t } = useTranslation();
  const { month: getMonth } = useFormat()

  const month = mode?.kind === "create" ? mode.month : mode?.budget.month;
  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      {mode && month && (
        <DialogContent
          title={mode.kind === "create" ? t("Add budget") : t("Edit budget")}
          description={
            mode.kind === "create"
              ? t(`Set a spending limit for {{month}}.`, { month: getMonth(month) })
              : t(`Change the {{month}} limit. Spending is tracked automatically.`, { month: getMonth(month) })
          }
        >
          <BudgetForm mode={mode} month={month} onDone={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function BudgetForm({
  mode,
  month,
  onDone,
}: {
  mode: BudgetFormMode;
  month: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const message = useMessage();
  const uid = useId();
  const { tryMutate } = useAppActions();
  const { language } = useLanguage();
  const categoryName = useCategoryName()
  const submitting = useRef(false);
  const available =
    mode.kind === "create"
      ? categoriesOfType("expense").filter((c) => !mode.takenCategoryIds.includes(c.id))
      : [];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues:
      mode.kind === "edit"
        ? { categoryId: mode.budget.categoryId, limit: formatMinorForInput(mode.budget.limit) }
        : { categoryId: "", limit: "" },
    mode: "onTouched",
  });

  const id = (name: string) => `${uid}-${name}`;

  async function onValid(values: BudgetFormValues) {
    if (submitting.current) return; // stays locked after success (the form unmounts); released only on refusal
    submitting.current = true;
    try {
      const input = toBudgetInput(values, month);
      const now = new Date().toISOString();
      const result = tryMutate((data) =>
        mode.kind === "create"
          ? createBudget(data, input, { now })
          : updateBudgetLimit(data, mode.budget.id, input.limit, { now }),
      );
      if (!result.ok && result.reason === "rejected") {
        setError("root.server", { message: message(result.error, result.params) });
        submitting.current = false;
        return;
      }
      if (!result.ok) toast.warning(t("{{error}} Your change is kept for this session only.", {
        error: message(result.error, result.params),
      }));
      else toast.success(mode.kind === "create" ? t("Budget added") : t("Budget updated"));
      onDone();
    } catch (error) {
      submitting.current = false;
      throw error;
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate className="space-y-5">
      {mode.kind === "create" ? (
        <div>
          <Label htmlFor={id("category")}>{t("Category")}</Label>
          <Select
            id={id("category")}
            aria-invalid={!!errors.categoryId}
            aria-describedby={errors.categoryId ? id("category-error") : undefined}
            {...register("categoryId")}
          >
            <option value="">{t("Choose a category")}</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryName(c.id)}
              </option>
            ))}
          </Select>
          <FieldError id={id("category-error")} message={errors.categoryId?.message} />
        </div>
      ) : (
        <div>
          <p className="text-label mb-1.5">{t("Category")}</p>
          <p className="text-sm">
            {categoryName(mode.budget.categoryId) ?? t("Unknown category")}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor={id("limit")}>{t("Monthly limit (Kz)")}</Label>
        <Input
          id={id("limit")}
          inputMode="decimal"
          autoComplete="off"
          placeholder="130.000"
          aria-invalid={!!errors.limit}
          aria-describedby={[id("limit-hint"), errors.limit ? id("limit-error") : null]
            .filter(Boolean)
            .join(" ")}
          {...register("limit")}
        />
        <p id={id("limit-hint")} className="text-caption text-muted-foreground mt-1.5">
          {t("The most you plan to spend on this category in {{month}}.", { month: formatMonth(month, language) })}
        </p>
        <FieldError id={id("limit-error")} message={errors.limit?.message} />
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
          {isSubmitting ? t("Saving…") : mode.kind === "create" ? t("Add budget") : t("Save changes")}
        </Button>
      </div>
    </form>
  );
}
