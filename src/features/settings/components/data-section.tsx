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
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return (
    <Card aria-labelledby="data-title">
      <CardHeader
        title={t("Your data")}
        titleId="data-title"
        description={t("Everything is stored only in this browser. Nothing is sent anywhere, and clearing site data removes it.")}
      />
      <div className="space-y-4">
        <p className="text-sm">
          {count(data.transactions.length, t("transaction"), t("transactions"))} ·{" "}
          {count(data.budgets.length, t("budget"), t("budgets"))} ·{" "}
          {count(data.goals.length, t("savings goal"), t("savings goals"))}
        </p>
        <div>
          <Button variant="outline" onClick={() => setConfirming(true)}>
            <RotateCcw aria-hidden className="size-4" />
           {t("Reset demo data")}
          </Button>
        </div>
      </div>
      {confirming && <ResetDemoDialog open={confirming} onClose={() => setConfirming(false)} />}
    </Card>
  );
}
