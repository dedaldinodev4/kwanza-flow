import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { createTransaction } from "@/features/transactions/services/transaction-service";
import { budgetProgressForMonth } from "@/lib/calculations";
import { buildMockData } from "@/mocks/mock-data";
import { useAppActions } from "@/providers/app-data-provider";
import { renderWithData, TODAY } from "@/test/render";

import { BudgetsView } from "./budgets-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

/** Records an expense through the same store path the transaction form uses. */
function SpendButton({ categoryId, amount }: { categoryId: string; amount: number }) {
  const { tryMutate } = useAppActions();
  return (
    <button
      type="button"
      onClick={() =>
        tryMutate((d) =>
          createTransaction(
            d,
            { type: "expense", description: "Journey spend", amount, categoryId, date: TODAY },
            { now: new Date().toISOString() },
          ),
        )
      }
    >
      spend
    </button>
  );
}

const data = buildMockData(TODAY);
const dashboardBudgets = () => screen.getByRole("region", { name: "Budget progress" });
const dashboardGoals = () => screen.getByRole("region", { name: "Savings goals" });
const valueNow = (el: HTMLElement) => Number(el.getAttribute("aria-valuenow"));

beforeEach(() => vi.clearAllMocks());

describe("budgets stay consistent with the dashboard and with transactions", () => {
  it("create → spend → edit limit → delete moves the dashboard's budget panel each time", async () => {
    const user = userEvent.setup();
    renderWithData(
      <>
        <DashboardView />
        <BudgetsView />
        <SpendButton categoryId="health" amount={10_000_00} />
      </>,
    );
    const healthSpent = budgetProgressForMonth(
      [{ ...data.budgets[0], categoryId: "health", month: "2026-10", limit: 40_000_00 }],
      data.transactions,
      "2026-10",
    )[0].spent;
    expect(within(dashboardBudgets()).queryByText("Health")).not.toBeInTheDocument();

    // 1. Create a Kz 40.000 health budget on the budgets page.
    await user.click(screen.getByRole("button", { name: "Add budget" }));
    const dialog = await screen.findByRole("dialog", { name: "Add budget" });
    await user.selectOptions(within(dialog).getByLabelText("Category"), "health");
    await user.type(within(dialog).getByLabelText("Monthly limit (Kz)"), "40.000");
    await user.click(within(dialog).getByRole("button", { name: "Add budget" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // 2. The dashboard shows it, with the month's real spending.
    const bar = () =>
      within(dashboardBudgets()).getByRole("progressbar", { name: "Health budget used" });
    expect(valueNow(bar())).toBe(Math.round((healthSpent / 40_000_00) * 100));

    // 3. Spending 10.000 more in that category moves the dashboard bar by exactly that share.
    await user.click(screen.getByRole("button", { name: "spend" }));
    expect(valueNow(bar())).toBe(Math.round(((healthSpent + 10_000_00) / 40_000_00) * 100));

    // 4. Halving the limit on the budgets page doubles the share on the dashboard.
    const budgetsPage = screen.getByRole("region", { name: /Budgets for/ });
    await user.click(within(budgetsPage).getByRole("button", { name: "Edit Health budget" }));
    const limit = await screen.findByLabelText("Monthly limit (Kz)");
    await user.clear(limit);
    await user.type(limit, "20.000");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(valueNow(bar())).toBe(Math.round(((healthSpent + 10_000_00) / 20_000_00) * 100));

    // 5. Deleting the budget removes it from the dashboard; the spending itself is untouched.
    await user.click(within(budgetsPage).getByRole("button", { name: "Delete Health budget" }));
    await user.click(await screen.findByRole("button", { name: "Delete budget" }));
    await waitFor(() =>
      expect(within(dashboardBudgets()).queryByText("Health")).not.toBeInTheDocument(),
    );
    const unbudgeted = screen.getByRole("region", { name: "Spending without a budget" });
    expect(within(unbudgeted).getByText("Health")).toBeInTheDocument(); // it reappears as untracked spending
  });
});


