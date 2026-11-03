"use client";

import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { useFormat } from "@/providers/use-format";

interface GoalsSummaryProps {
  saved: number;
  target: number;
  completedCount: number;
  goalCount: number;
}

export function GoalsSummary({ saved, target, completedCount, goalCount }: GoalsSummaryProps) {
  const { t } = useTranslation()
  const { money } = useFormat();
  return (
    <Card aria-label={t("Savings summary")}>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-label text-muted-foreground">{t("Saved so far")}</dt>
          <dd className="money text-kpi">{money(saved)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">{t("Total target")}</dt>
          <dd className="money text-kpi">{money(target)}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">{t("Goals completed")}</dt>
          <dd className="money text-kpi">
            {t("{{completed}} of {{goals}}", { completed: completedCount, goals: goalCount})}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
