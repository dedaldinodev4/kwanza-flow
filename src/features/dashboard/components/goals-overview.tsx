"use client";

import { CheckCircle2, Target } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

import { useFormat } from "@/providers/use-format";
import type { DashboardModel } from "../utils/dashboard-model";
import { useDemoText } from "@/hooks/use-i18n";


interface GoalsOverviewProps {
  goals: DashboardModel["goals"];
  today: string;
}

export function GoalsOverview({ goals, today }: GoalsOverviewProps) {
  const { t } = useTranslation();
  const { money, ratio, day } = useFormat();
  const demoText = useDemoText();

  return (
    <Card aria-labelledby="goals-title">
      <CardHeader
        title={t("Savings goals")}
        titleId="goals-title"
        description={t("Current progress, regardless of the selected period")}
        action={
          <Link
            href="/goals"
            className="text-success inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("All goals")}
          </Link>
        }
      />
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t("No savings goals yet")}
          description={t("Set a target and track what you have saved toward it.")}
          action={{ href: "/goals", label: t("Go to goals") }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(({ goal, progress }) => {
            const name = demoText(goal.name);
            const remaining = money(progress.remaining, { fractionDigits: 0 });
            return (
              <li key={goal.id} className="rounded-control border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{name}</p>
                  {progress.completed && (
                    <span className="bg-success-surface text-caption text-success inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium">
                      <CheckCircle2 aria-hidden className="size-3.5" />
                      {t("Completed")}
                    </span>
                  )}
                </div>
                <p className="money text-caption text-muted-foreground mt-1">
                  {t("{{current}} of {{target}}", {
                    current: money(goal.currentAmount, { fractionDigits: 0 }),
                    target: money(goal.targetAmount, { fractionDigits: 0 }),
                  })}
                </p>
                <div className="mt-3">
                  <ProgressBar
                    ratio={progress.ratio}
                    label={t("{{name}} progress", { name })}
                    tone={progress.completed ? "complete" : "ok"}
                  />
                </div>
                <p className="text-caption text-muted-foreground mt-2 flex justify-between gap-2">
                  <span>{ratio(progress.ratio)}</span>
                  <span className="money">
                    {progress.completed
                      ? t("Goal reached")
                      : goal.targetDate
                        ? t("{{amount}} to go · by {{date}}", {
                          amount: remaining,
                          date: day(goal.targetDate, today.slice(0, 4)),
                        })
                        : t("{{amount}} to go", { amount: remaining })}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
