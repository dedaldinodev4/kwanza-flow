import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { buildDashboardModel } from "@/features/dashboard/utils/dashboard-model";

import { formatMoney } from "@/lib/formatters/currency";
import { buildMockData } from "@/mocks/mock-data";
import { renderWithData, TODAY } from "@/test/render";

import { TransactionsView } from "./transactions-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

const data = buildMockData(TODAY);
const base = buildDashboardModel(data, TODAY, "this-month");
const kz = (minor: number) => formatMoney(minor, { locale: "pt-AO" }).replace(/\s/g, " ");

const kpi = (label: string) =>
  within(screen.getByRole("region", { name: "Key figures" }))
    .getByText(label)
    .closest("dt")
    ?.nextElementSibling?.textContent?.replace(/\s/g, " ");
const groceriesBar = () => screen.getByRole("progressbar", { name: "Groceries budget used" });
const table = () => screen.getByRole("table", { name: "Transactions" });

beforeEach(() => vi.clearAllMocks());

describe("user journey across the dashboard and transactions (brief §12 journeys 1–6)", () => {
  it("create → edit → delete keeps balance, KPIs, recent list, chart and budget in agreement", async () => {
    const user = userEvent.setup();
    renderWithData(
      <>
        <DashboardView />
        <TransactionsView />
      </>,
    );

    // 1. The dashboard shows the baseline.
    expect(kpi("Expenses")).toBe(kz(base.summary.expenses));
    expect(kpi("Current balance")).toBe(kz(base.balance));
    const baselineBudget = Number(groceriesBar().getAttribute("aria-valuenow"));

    // 2. Create a Kz 10.000,00 groceries expense dated today.
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await user.type(await screen.findByLabelText("Description"), "Journey groceries");
    await user.type(screen.getByLabelText("Amount (Kz)"), "10.000,00");
    await user.selectOptions(
      within(screen.getByRole("dialog")).getByLabelText("Category"),
      "groceries",
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Add transaction" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // 3. Every dependent number moved by exactly that amount.
    const TEN_K = 10_000_00;
    expect(kpi("Expenses")).toBe(kz(base.summary.expenses + TEN_K));
    expect(kpi("Net cash flow")).toContain(kz(Math.abs(base.summary.net - TEN_K)));
    expect(kpi("Current balance")).toBe(kz(base.balance - TEN_K));
    expect(Number(groceriesBar().getAttribute("aria-valuenow"))).toBeGreaterThan(baselineBudget);
    const recent = screen.getByRole("region", { name: "Recent transactions" });
    expect(within(recent).getAllByRole("listitem")[0]).toHaveTextContent("Journey groceries");
    const chartTable = await screen.findByRole(
      "table",
      { name: /Income and expenses/ },
      { timeout: 4000 },
    );
    expect(
      within(chartTable).getAllByRole("row").at(-1)!.textContent?.replace(/\s/g, " "),
    ).toContain(kz(base.summary.expenses + TEN_K));

    // 4. Filter to it, then edit the amount to Kz 5.000,00.
    await user.type(screen.getByLabelText("Search description"), "journey groceries");
    expect(within(table()).getAllByRole("row")).toHaveLength(2); // header + the one match
    await user.click(within(table()).getByRole("button", { name: "Edit Journey groceries" }));
    const amount = await screen.findByLabelText("Amount (Kz)");
    expect(amount).toHaveValue("10000");
    await user.clear(amount);
    await user.type(amount, "5.000");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(kpi("Expenses")).toBe(kz(base.summary.expenses + 5_000_00));
    expect(kpi("Current balance")).toBe(kz(base.balance - 5_000_00));

    // 5. Delete it (with confirmation): everything returns exactly to the baseline.
    await user.click(within(table()).getByRole("button", { name: "Delete Journey groceries" }));
    await user.click(await screen.findByRole("button", { name: "Delete transaction" }));
    await waitFor(() => expect(kpi("Expenses")).toBe(kz(base.summary.expenses)));
    expect(kpi("Current balance")).toBe(kz(base.balance));
    expect(Number(groceriesBar().getAttribute("aria-valuenow"))).toBe(baselineBudget);
    expect(within(recent).queryByText("Journey groceries")).not.toBeInTheDocument();
  });
});
