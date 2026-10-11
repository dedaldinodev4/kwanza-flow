"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import dynamic from "next/dynamic";

import { EmptyState } from "@/components/feedback/empty-state";
import { Skeleton } from "@/components/feedback/skeleton";

import { useAppData } from "@/providers/app-data-provider";

import { usePeriodParam } from "../hooks/use-period-param";

import { buildDashboardModel } from "../utils/dashboard-model";

import { BudgetProgress } from "./budget-progress";
import { GoalsOverview } from "./goals-overview";
import { KpiCards } from "./kpi-cards";
import { PeriodSelector } from "./period-selector";
import { RecentTransactions } from "./recent-transactions";

// Recharts is the heaviest dependency; loading it lazily keeps it out of the initial route bundle.
const ChartSkeleton = () => <Skeleton className="h-80 w-full" />;
const IncomeExpenseChart = dynamic(
  () => import("./income-expense-chart").then((m) => m.IncomeExpenseChart),
  { ssr: false, loading: ChartSkeleton },
);
const SpendingChart = dynamic(() => import("./spending-chart").then((m) => m.SpendingChart), {
  ssr: false,
  loading: ChartSkeleton,
});

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading your overview…</span>
      <Skeleton className="h-24 w-full sm:h-12 sm:max-w-md" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 sm:h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const state = useAppData();
  const [periodId, setPeriodId] = usePeriodParam();
  const model = useMemo(
    () =>
      state.status === "ready" ? buildDashboardModel(state.data, state.today, periodId) : null,
    [state, periodId],
  );

  if (state.status !== "ready" || !model) return <DashboardSkeleton />;

  if (!model.hasAnyTransactions) {
    return (
      <EmptyState
        icon={Wallet}
        title="No transactions yet"
        description="Add your first income or expense and your overview will appear here."
        action={{ href: "/transactions", label: "Go to transactions" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PeriodSelector
        value={periodId}
        onChange={setPeriodId}
        description={model.periodDescription}
      />
      <KpiCards
        balance={model.balance}
        asOf={state.today}
        summary={model.summary}
        periodLabel={model.period.label}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <IncomeExpenseChart series={model.series} periodLabel={model.period.label} />
        <SpendingChart
          chartRows={model.chartCategories}
          allRows={model.categories}
          total={model.summary.expenses}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RecentTransactions
          transactions={model.recent}
          periodLabel={model.period.label}
          today={state.today}
        />
        <BudgetProgress budgets={model.budgets} periodLabel={model.period.label} />
      </div>
      <GoalsOverview goals={model.goals} today={state.today} />
    </div>
  );
}
