"use client";

import { Card } from "@/components/ui/card";
import { useFormat } from "@/providers/use-format";

interface GoalsSummaryProps {
  saved: number;
  target: number;
  completedCount: number;
  goalCount: number;
}

export function GoalsSummary({ saved, target, completedCount, goalCount }: GoalsSummaryProps) {
  const { money } = useFormat();
  return (
    <Card aria-label="Savings summary">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-label text-muted-foreground">Saved so far</dt>
          <dd className="money text-kpi">{money(saved)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">Total target</dt>
          <dd className="money text-kpi">{money(target)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">Goals completed</dt>
          <dd className="money text-kpi">
            {completedCount} of {goalCount}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
