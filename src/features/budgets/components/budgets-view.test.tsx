import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { budgetProgressForMonth, budgetTotals } from "@/lib/calculations";
import { categoriesOfType } from "@/lib/categories";
import { formatMoney } from "@/lib/formatters/currency";
import { buildMockData } from "@/mocks/mock-data";
import { makeBudget, makeTx } from "@/test/factories";
import { Probe } from "@/test/probe";
import { renderWithData, TODAY } from "@/test/render";

import { BudgetsView } from "./budgets-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const data = buildMockData(TODAY);
const kz = (minor: number) => formatMoney(minor, { locale: "pt-AO" }).replace(/\s/g, " ");
const norm = (el: HTMLElement) => el.textContent?.replace(/\s/g, " ") ?? "";
const cards = () =>
  within(screen.getByRole("region", { name: /Budgets for/ })).getAllByRole("listitem");
const card = (name: string) => cards().find((c) => within(c).queryByRole("heading", { name }))!;
const withBudgets = (
  budgets: ReturnType<typeof makeBudget>[],
  transactions = data.transactions,
) => ({ ...data, budgets, transactions });

beforeEach(() => vi.clearAllMocks());

describe("budgets-view - overview of a month", () => {
  it("shows the current month with a card per budget, in order of risk", () => {
    renderWithData(<BudgetsView />);
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    const progress = budgetProgressForMonth(data.budgets, data.transactions, "2026-10");
    expect(cards()).toHaveLength(progress.length);
    expect(cards().map((c) => within(c).getByRole("heading").textContent)).toEqual(
      progress.map((p) => p.name),
    );
  });

  it("summarises budgeted, spent and remaining consistently with the cards", () => {
    renderWithData(<BudgetsView />);
    const totals = budgetTotals(budgetProgressForMonth(data.budgets, data.transactions, "2026-10"));
    const summary = screen.getByRole("region", { name: "Budget summary for October 2026" });
    expect(norm(summary)).toContain(kz(totals.limit));
    expect(norm(summary)).toContain(kz(totals.spent));
    expect(norm(summary)).toContain(kz(Math.abs(totals.remaining)));
  });

  it("flags overspending in words, with the amount, and in the summary", () => {
    renderWithData(
      <BudgetsView />,
      withBudgets(
        [makeBudget({ categoryId: "dining", month: "2026-10", limit: 100_00 })],
        [makeTx({ categoryId: "dining", amount: 150_00, date: "2026-10-04" })],
      ),
    );
    expect(within(card("Dining out")).getByText(`Over budget by ${kz(50_00)}`)).toBeInTheDocument();
    expect(screen.getByText(/1 category is over budget/)).toBeInTheDocument();
    expect(screen.getByText("Over by")).toBeInTheDocument();
  });

  it("handles a budget with no matching spending", () => {
    renderWithData(
      <BudgetsView />,
      withBudgets([makeBudget({ categoryId: "health", month: "2026-10", limit: 50_000_00 })], []),
    );
    expect(
      within(card("Health")).getByText(
        new RegExp(`On track · ${kz(50_000_00).replace(/\s/g, " ")} left`),
      ),
    ).toBeInTheDocument();
    expect(
      within(card("Health")).getByRole("progressbar", { name: "Health budget used" }),
    ).toHaveAttribute("aria-valuenow", "0");
  });

  it("lists spending that has no budget so it is not hidden", () => {
    renderWithData(<BudgetsView />);
    const panel = screen.getByRole("region", { name: "Spending without a budget" });
    expect(within(panel).getByText("Housing")).toBeInTheDocument(); // the demo has rent but no housing budget
  });
});

describe("budgets-view - month navigation", () => {
  it("moves between months and offers a way back", async () => {
    const user = userEvent.setup();
    renderWithData(<BudgetsView />);
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("September 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to October 2026" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to October 2026" }));
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Back to/ })).not.toBeInTheDocument();
  });

  it("crosses a year boundary and shows an empty state for a month with no budgets", async () => {
    const user = userEvent.setup();
    renderWithData(<BudgetsView />);
    for (let i = 0; i < 10; i += 1)
      await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("December 2025")).toBeInTheDocument();
    expect(screen.getByText("No budgets for December 2025")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("budgets-view - empty state and copying", () => {
  it("guides a user with no budgets at all", () => {
    renderWithData(<BudgetsView />, withBudgets([]));
    expect(screen.getByText("No budgets for October 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy budgets/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add budget" })).toBeEnabled();
  });

  it("copies last month's budgets once, then stops offering to", async () => {
    const user = userEvent.setup();
    renderWithData(
      <BudgetsView />,
      withBudgets([
        makeBudget({ categoryId: "groceries", month: "2026-09", limit: 130_000_00 }),
        makeBudget({ categoryId: "dining", month: "2026-09", limit: 55_000_00 }),
      ]),
    );
    expect(screen.getByText("No budgets for October 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy budgets from September 2026" }));

    expect(toast.success).toHaveBeenCalledWith("Copied budgets from September 2026");
    expect(cards()).toHaveLength(2);
    expect(
      within(card("Groceries")).getByText(/130 000,00 Kz/, { selector: "p" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy budgets/ })).not.toBeInTheDocument(); // nothing left to copy
  });
});

describe("budgets-view - adding a budget", () => {
  it("only offers expense categories that do not have a budget yet", async () => {
    const user = userEvent.setup();
    renderWithData(<BudgetsView />);
    await user.click(screen.getByRole("button", { name: "Add budget" }));
    const dialog = await screen.findByRole("dialog", { name: "Add budget" });
    const options = Array.from(
      (within(dialog).getByLabelText("Category") as HTMLSelectElement).options,
    ).map((o) => o.value);
    const budgeted = data.budgets.filter((b) => b.month === "2026-10").map((b) => b.categoryId);
    expect(options).not.toContain("salary"); // income is never offered
    for (const id of budgeted) expect(options).not.toContain(id);
    expect(options).toContain("health");
  });

  it("validates inline and explains each problem", async () => {
    const user = userEvent.setup();
    renderWithData(<BudgetsView />);
    await user.click(screen.getByRole("button", { name: "Add budget" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Add budget" }));
    expect(await within(dialog).findByText("Choose a category.")).toBeInTheDocument();
    expect(within(dialog).getByText("Enter a monthly limit.")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Monthly limit (Kz)"), "0");
    await user.tab();
    expect(
      await within(dialog).findByText("Amount must be greater than zero."),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("adds the budget and shows it with the month's real spending applied", async () => {
    const user = userEvent.setup();
    const txs = [
      ...data.transactions,
      makeTx({ categoryId: "health", amount: 14_000_00, date: "2026-10-03" }),
    ];
    renderWithData(<BudgetsView />, { ...data, transactions: txs });
    await user.click(screen.getByRole("button", { name: "Add budget" }));
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Category"), "health");
    await user.type(within(dialog).getByLabelText("Monthly limit (Kz)"), "40.000");
    await user.click(within(dialog).getByRole("button", { name: "Add budget" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("Budget added");
    expect(norm(card("Health"))).toContain(`${kz(14_000_00)} of ${kz(40_000_00)}`);
  });

  it("disables adding, and says why, when every expense category is budgeted", () => {
    const all = categoriesOfType("expense").map((c) =>
      makeBudget({ categoryId: c.id, month: "2026-10" }),
    );
    renderWithData(<BudgetsView />, withBudgets(all));
    expect(screen.getByRole("button", { name: "Add budget" })).toBeDisabled();
    expect(
      screen.getByText(/Every expense category already has a budget for October 2026/),
    ).toBeInTheDocument();
  });
});

describe("budgets-view - editing and deleting", () => {
  it("edits only the limit: the category is shown read-only, and progress updates", async () => {
    const user = userEvent.setup();
    renderWithData(<BudgetsView />);
    await user.click(
      within(card("Groceries")).getByRole("button", { name: "Edit Groceries budget" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Edit budget" });
    expect(within(dialog).queryByLabelText("Category")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Groceries")).toBeInTheDocument();
    const limit = within(dialog).getByLabelText("Monthly limit (Kz)");
    expect(limit).toHaveValue("130000");

    await user.clear(limit);
    await user.type(limit, "10.000");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(card("Groceries")).getByText(/Over budget by/)).toBeInTheDocument(); // limit now far below spending
  });

  it("asks before deleting, defaults to Cancel, and removes only that budget", async () => {
    const user = userEvent.setup();
    renderWithData(<BudgetsView />);
    const before = cards().length;
    await user.click(
      within(card("Transport")).getByRole("button", { name: "Delete Transport budget" }),
    );
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this budget?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(dialog).toHaveTextContent(
      /Transactions are not affected|transactions are not affected/i,
    );

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(cards()).toHaveLength(before);

    await user.click(
      within(card("Transport")).getByRole("button", { name: "Delete Transport budget" }),
    );
    await user.click(await screen.findByRole("button", { name: "Delete budget" }));
    await waitFor(() => expect(cards()).toHaveLength(before - 1));
    expect(toast.success).toHaveBeenCalledWith("Budget deleted");
    expect(screen.getByRole("heading", { name: /Budgets for October 2026/ })).toHaveFocus();
  });
});

describe("budgets-view - when a budget was removed elsewhere in the meantime", () => {
  it("explains, stays open, and lets the person try again (the form is not left dead)", async () => {
    const user = userEvent.setup();
    renderWithData(
      <>
        <BudgetsView />
        <Probe />
      </>,
    );
    await user.click(
      within(card("Groceries")).getByRole("button", { name: "Edit Groceries budget" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Edit budget" });
    fireEvent.click(screen.getByRole("button", { name: "probe: clear budgets", hidden: true }));

    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "That budget no longer exists.",
    );
    expect(toast.success).not.toHaveBeenCalled();

    // Each submit clears the previous server error, so the alert can only return if the handler really re-ran.
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "That budget no longer exists.",
    );
  });
});
