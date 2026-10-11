"use client";

import { CheckCircle2, Target } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

import { formatDay } from "@/lib/formatters/date";
import { useFormat } from "@/providers/use-format";
import type { DashboardModel } from "../utils/dashboard-model";

interface GoalsOverviewProps {
  goals: DashboardModel["goals"];
  today: string;
}

export function GoalsOverview({ goals, today }: GoalsOverviewProps) {
  const { money, ratio } = useFormat();

  return (
    <Card aria-labelledby="goals-title">
      <CardHeader
        title="Savings goals"
        titleId="goals-title"
        description="Current progress, regardless of the selected period"
        action={
          <Link
            href="/goals"
            className="text-success inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            All goals
          </Link>
        }
      />
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals yet"
          description="Set a target and track what you have saved toward it."
          action={{ href: "/goals", label: "Go to goals" }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(({ goal, progress }) => (
            <li key={goal.id} className="rounded-control border p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{goal.name}</p>
                {progress.completed && (
                  <span className="bg-success-surface text-caption text-success inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium">
                    <CheckCircle2 aria-hidden className="size-3.5" />
                    Completed
                  </span>
                )}
              </div>
              <p className="money text-caption text-muted-foreground mt-1">
                {money(goal.currentAmount, { fractionDigits: 0 })} of{" "}
                {money(goal.targetAmount, { fractionDigits: 0 })}
              </p>
              <div className="mt-3">
                <ProgressBar
                  ratio={progress.ratio}
                  label={`${goal.name} progress`}
                  tone={progress.completed ? "complete" : "ok"}
                />
              </div>
              <p className="text-caption text-muted-foreground mt-2 flex justify-between gap-2">
                <span>{ratio(progress.ratio)}</span>
                <span className="money">
                  {progress.completed
                    ? "Goal reached"
                    : `${money(progress.remaining, { fractionDigits: 0 })} to go${goal.targetDate ? ` · by ${formatDay(goal.targetDate, today.slice(0, 4))}` : ""}`}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
