import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { GoalsView } from "@/features/goals/components/goals-view";
import { buildMockData } from "@/mocks/mock-data";
import { renderWithData, TODAY } from "@/test/render";


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
const dashboardGoals = () => screen.getByRole("region", { name: "Savings goals" });
const valueNow = (el: HTMLElement) => Number(el.getAttribute("aria-valuenow"));

beforeEach(() => vi.clearAllMocks());


describe("goals stay consistent with the dashboard", () => {
  it("a contribution on the goals page updates the dashboard, and completing a goal shows everywhere", async () => {
    const user = userEvent.setup();
    renderWithData(
      <>
        <DashboardView />
        <GoalsView />
      </>,
    );
    const dashBar = () =>
      within(dashboardGoals()).getByRole("progressbar", { name: "Trip to Benguela progress" });
    expect(valueNow(dashBar())).toBe(27); // 120.000 of 450.000

    const goalsPage = () => screen.getByRole("region", { name: "Your goals" });
    await user.click(
      within(goalsPage()).getByRole("button", { name: "Add money to Trip to Benguela" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Amount (Kz)"), "105.000");
    await user.click(within(dialog).getByRole("button", { name: "Add money" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(valueNow(dashBar())).toBe(50); // 225.000 of 450.000

    await user.click(
      within(goalsPage()).getByRole("button", { name: "Add money to Trip to Benguela" }),
    );
    const second = await screen.findByRole("dialog");
    await user.type(within(second).getByLabelText("Amount (Kz)"), "225.000");
    await user.click(within(second).getByRole("button", { name: "Add money" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(valueNow(dashBar())).toBe(100);
    const dashCard = dashBar().closest("li")!;
    expect(within(dashCard).getByText("Completed")).toBeInTheDocument();
    expect(within(dashCard).getByText("Goal reached")).toBeInTheDocument();
  });
});
