import {
  accountBalance,
  budgetProgressForPeriod,
  budgetTotals,
  filterByPeriod,
  goalProgress,
  goalsSummary,
  groupSmallCategories,
  incomeExpenseSeries,
  recentTransactions,
  spendingByCategory,
  summarize,
  type BudgetProgress,
  type BudgetTotals,
  type CashFlowSummary,
  type CategorySpending,
  type GoalProgress,
  type SeriesPoint,
} from "@/lib/calculations";
import { describePeriod, resolvePeriod, type Period, type PeriodId } from "@/lib/dates/periods";
import type { AppData, SavingsGoal, Transaction } from "@/types/domain";

export const RECENT_LIMIT = 6;
export const MAX_DONUT_SLICES = 6;

export interface DashboardModel {
  period: Period;
  periodDescription: string;
  balance: number; //Balance as of today. It is deliberately independent of the selected period.
  summary: CashFlowSummary;
  series: SeriesPoint[];
  categories: CategorySpending[]; //Every expense category, for tables and text alternatives.
  chartCategories: CategorySpending[];
  recent: Transaction[];
  budgets: BudgetProgress[];
  budgetTotals: BudgetTotals;
  goals: { goal: SavingsGoal; progress: GoalProgress }[];
  goalsSummary: ReturnType<typeof goalsSummary>;
  hasAnyTransactions: boolean;
  periodHasTransactions: boolean;
}

/**
 * The single place the dashboard's numbers come from. Everything is derived from the same
 * period-filtered transaction list, which is what keeps KPIs, charts and lists in agreement.
 */
export function buildDashboardModel(
  data: AppData,
  today: string,
  periodId: PeriodId,
): DashboardModel {
  const period = resolvePeriod(periodId, today);
  const inPeriod = filterByPeriod(data.transactions, period);
  const categories = spendingByCategory(inPeriod);
  const budgets = budgetProgressForPeriod(data.budgets, data.transactions, period);

  return {
    period,
    periodDescription: describePeriod(period),
    balance: accountBalance(data.preferences.openingBalance, data.transactions, today),
    summary: summarize(inPeriod),
    series: incomeExpenseSeries(data.transactions, period),
    categories,
    chartCategories: groupSmallCategories(categories, MAX_DONUT_SLICES),
    recent: recentTransactions(inPeriod, RECENT_LIMIT),
    budgets,
    budgetTotals: budgetTotals(budgets),
    goals: data.goals.map((goal) => ({ goal, progress: goalProgress(goal) })),
    goalsSummary: goalsSummary(data.goals),
    hasAnyTransactions: data.transactions.length > 0,
    periodHasTransactions: inPeriod.length > 0,
  };
}
