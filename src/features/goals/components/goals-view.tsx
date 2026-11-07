"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Target } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { EmptyState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import { goalsSummary } from "@/lib/calculations";
import { useAppActions, useAppData } from "@/providers/app-data-provider";
import type { SavingsGoal } from "@/types/domain";

import { deleteGoal } from "../services/goal-service";
import { sortGoals } from "../utils/sort-goals";

import type { GoalFormMode } from "./goal-form-dialog";
import { GoalCard } from "./goal-card";
import { GoalsSummary } from "./goals-summary";
import { useTranslation } from "react-i18next";
import { useMessage } from "@/hooks/use-i18n";


const GoalFormDialog = dynamic(() => import("./goal-form-dialog").then((m) => m.GoalFormDialog), {
  ssr: false,
});
const ContributeDialog = dynamic(
  () => import("./contribute-dialog").then((m) => m.ContributeDialog),
  { ssr: false },
);
const DeleteGoalDialog = dynamic(
  () => import("./delete-goal-dialog").then((m) => m.DeleteGoalDialog),
  { ssr: false },
);

const HEADER = { title: "Savings goals", description: "Plan and track what you are saving for." };

export function GoalsView() {
  const { t } = useTranslation()
  const message = useMessage();
  const state = useAppData();
  const { tryMutate } = useAppActions();
  const [formMode, setFormMode] = useState<GoalFormMode | null>(null);
  const [contributeTarget, setContributeTarget] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const listRef = useRef<HTMLHeadingElement>(null);
  const deleted = useRef(false);

  const goals = state.status === "ready" ? state.data.goals : null;
  const sorted = useMemo(() => (goals ? sortGoals(goals) : null), [goals]);
  const summary = useMemo(() => (goals ? goalsSummary(goals) : null), [goals]);

  if (state.status !== "ready" || !sorted || !summary) {
    return (
      <div aria-busy="true" className="space-y-6">
        <PageHeader {...HEADER} />
        <span className="sr-only">{t("Loading your goals…")}</span>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  function confirmDelete(target: SavingsGoal) {
    const result = tryMutate((d) => deleteGoal(d, target.id));
    deleted.current = true;
    if (result.ok) toast.success(t("Goal deleted"));
    else if (result.reason === "not-saved")
      toast.warning( t("{{error}} The deletion is kept for this session only.", {
        error: message(result.error, result.params),
      }),);
    else toast.error(message(result.error, result.params));
  }

  const addButton = (
    <Button className="cursor-pointer" onClick={() => setFormMode({ kind: "create" })}>
      <Plus aria-hidden className="size-4" />
      {t("Add goal")}
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader {...HEADER} actions={addButton} />

      {sorted.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t("No savings goals yet")}
          description={t("Set a target for something you are saving toward, then add money as you go and watch your progress.")}
        />
      ) : (
        <>
          <GoalsSummary
            saved={summary.saved}
            target={summary.target}
            completedCount={summary.completedCount}
            goalCount={sorted.length}
          />
          <section aria-labelledby="goal-list-title">
            <h2
              id="goal-list-title"
              ref={listRef}
              tabIndex={-1}
              className="text-section mb-3 outline-none"
            >
              {t("Your goals")}
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sorted.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  today={state.today}
                  onContribute={() => setContributeTarget(goal)}
                  onEdit={() => setFormMode({ kind: "edit", goal })}
                  onDelete={() => setDeleteTarget(goal)}
                />
              ))}
            </ul>
          </section>
        </>
      )}

      {formMode && <GoalFormDialog mode={formMode} onClose={() => setFormMode(null)} />}
      {contributeTarget && (
        <ContributeDialog goal={contributeTarget} onClose={() => setContributeTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteGoalDialog
          goal={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          onCloseAutoFocus={(event) => {
            if (deleted.current) {
              event.preventDefault();
              listRef.current?.focus();
              deleted.current = false;
            }
          }}
        />
      )}
    </div>
  );
}
