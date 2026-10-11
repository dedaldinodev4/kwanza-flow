import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatMoney } from "@/lib/formatters/currency";
import { buildMockData } from "@/mocks/mock-data";
import { renderWithData, TODAY } from "@/test/render";
import { buildDashboardModel } from "../utils/dashboard-model";

import { DashboardView } from "./dashboard-view";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(search),
}));

const kz = (minor: number) => formatMoney(minor, { locale: "pt-AO" }).replace(/\s/g, " ");
/** Scoped to the key-figures region: "Income" also appears in the chart legend and table. */
const valueOf = (label: string) =>
  within(screen.getByRole("region", { name: "Key figures" }))
    .getByText(label)
    .closest("dt")
    ?.nextElementSibling?.textContent?.replace(/\s/g, " ");

beforeEach(() => {
  replace.mockClear();
  search = "";
});

describe("DashboardView (integration)", () => {
  it("renders figures that match the calculation model for the default period", async () => {
    const m = buildDashboardModel(buildMockData(TODAY), TODAY, "this-month");
    renderWithData(<DashboardView />);
    expect(valueOf("Income")).toBe(kz(m.summary.income));
    expect(valueOf("Expenses")).toBe(kz(m.summary.expenses));
    expect(valueOf("Current balance")).toBe(kz(m.balance));
    expect(screen.getByText("Showing 1 – 31 Oct 2026")).toBeInTheDocument();
  });

  it("agrees across KPIs, the chart table and the recent list", async () => {
    const m = buildDashboardModel(buildMockData(TODAY), TODAY, "this-month");
    renderWithData(<DashboardView />);
    const table = await screen.findByRole(
      "table",
      { name: /Income and expenses/ },
      { timeout: 4000 },
    );
    const footer = within(table).getAllByRole("row").at(-1)!;
    expect(footer.textContent?.replace(/\s/g, " ")).toContain(kz(m.summary.income));
    expect(footer.textContent?.replace(/\s/g, " ")).toContain(kz(m.summary.expenses));
    const recent = screen.getByRole("region", { name: "Recent transactions" });
    expect(within(recent).getAllByRole("listitem")).toHaveLength(m.recent.length);
  });

  it("reads the period from the URL and ignores invalid values", () => {
    search = "period=last-month";
    const { unmount } = renderWithData(<DashboardView />);
    expect(screen.getByRole("radio", { name: "Last month" })).toBeChecked();
    expect(screen.getByText("Showing 1 – 30 Sep 2026")).toBeInTheDocument();
    unmount();
    search = "period=bogus";
    renderWithData(<DashboardView />);
    expect(screen.getByRole("radio", { name: "This month" })).toBeChecked();
  });

  it("updates the URL when a different period is chosen", async () => {
    renderWithData(<DashboardView />);
    await userEvent.click(screen.getByRole("radio", { name: "This year" }));
    expect(replace).toHaveBeenCalledWith("/?period=this-year", { scroll: false });
  });

  it("changes every dependent figure when the period changes", () => {
    const data = buildMockData(TODAY);
    const month = buildDashboardModel(data, TODAY, "this-month");
    const year = buildDashboardModel(data, TODAY, "this-year");
    search = "period=this-year";
    renderWithData(<DashboardView />, data);
    expect(valueOf("Income")).toBe(kz(year.summary.income));
    expect(valueOf("Income")).not.toBe(kz(month.summary.income));
    expect(valueOf("Current balance")).toBe(kz(month.balance)); // balance does not depend on the period
  });

  it("shows a first-run empty state when the account has no transactions", () => {
    renderWithData(<DashboardView />, { ...buildMockData(TODAY), transactions: [] });
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("shows empty states per panel when only the selected period is empty", async () => {
    const data = buildMockData(TODAY);
    renderWithData(<DashboardView />, {
      ...data,
      transactions: data.transactions.filter((t) => t.date.startsWith("2026-01")),
    });
    expect(screen.getByText("No transactions in this period")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Nothing to chart yet")).toBeInTheDocument(), {
      timeout: 4000,
    });
  });
});
