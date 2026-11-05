"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { Card, CardHeader } from "@/components/ui/card";

import type { AppData } from "@/types/domain";

const ResetDemoDialog = dynamic(
  () => import("./reset-demo-dialog").then((m) => m.ResetDemoDialog),
  { ssr: false },
);

export function DataSection({ data }: { data: AppData }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false);

  const transactionsCount = data.transactions.length;
  const budgetsCount = data.budgets.length;
  const goalsCount = data.goals.length;

  return (
    <Card aria-labelledby="data-title">
      <CardHeader
        title={t("Your data")}
        titleId="data-title"
        description={t("Everything is stored only in this browser. Nothing is sent anywhere, and clearing site data removes it.")}
      />
      <div className="space-y-4">
        <p className="text-sm">
          {transactionsCount === 1 ? t("{{count}} transactions_one", { count: transactionsCount }) : t("{{count}} transactions", { count: transactionsCount })} ·{" "}
          {budgetsCount === 1 ? t("{{count}} budgets_one", { count: budgetsCount }) : t("{{count}} budgets", { count: budgetsCount })} ·{" "}
          {transactionsCount === 1 ? t("{{count}} savings goals_one", { count: goalsCount }) : t("{{count}} savings goals", { count: goalsCount })}
        </p>
        <div>
          <Button className="cursor-pointer" variant="outline" onClick={() => setConfirming(true)}>
            <RotateCcw aria-hidden className="size-4" />
            {t("Reset demo data")}
          </Button>
        </div>
      </div>
      {confirming && <ResetDemoDialog open={confirming} onClose={() => setConfirming(false)} />}
    </Card>
  );
}
