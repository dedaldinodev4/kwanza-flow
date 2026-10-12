import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { buildMockData } from "@/mocks/mock-data";
import { Probe } from "@/test/probe";
import { renderWithData, TODAY } from "@/test/render";

import { TransactionsView } from "./transactions-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const data = buildMockData(TODAY);
const TOTAL = data.transactions.length;

const table = () => screen.getByRole("table", { name: "Transactions" });
const bodyRows = () => within(table()).getAllByRole("row").slice(1);
const summary = () => screen.getByText(/^(Showing|No transactions to show)/);
const search = (user: ReturnType<typeof userEvent.setup>, text: string) =>
  user.type(screen.getByLabelText("Search description"), text);

beforeEach(() => vi.clearAllMocks());

describe("Transaction-view - pagination", () => {
  it("shows ten rows per page with an accurate range", () => {
    renderWithData(<TransactionsView />);
    expect(summary()).toHaveTextContent(`Showing 1–10 of ${TOTAL} transactions`);
    expect(bodyRows()).toHaveLength(10);
  });

  it("moves between pages and disables the buttons at both boundaries", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    const previous = screen.getByRole("button", { name: /Previous/ });
    const next = screen.getByRole("button", { name: /Next/ });
    expect(previous).toBeDisabled();

    await user.click(next);
    expect(summary()).toHaveTextContent(`Showing 11–20 of ${TOTAL}`);
    expect(previous).toBeEnabled();

    const pages = Math.ceil(TOTAL / 10);
    for (let page = 2; page < pages; page += 1) await user.click(next);
    expect(screen.getByText(`Page ${pages} of ${pages}`)).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(summary()).toHaveTextContent(`of ${TOTAL}`);
  });

  it("returns to page 1 when a filter changes", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await search(user, "taxi");
    expect(summary()).toHaveTextContent(/^Showing 1–/);
  });

  it("hides pagination when everything fits on one page", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await search(user, "online course");
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  it("clamps the page after deleting the only item on the last page", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />, { ...data, transactions: data.transactions.slice(0, 11) });
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(bodyRows()).toHaveLength(1);

    await user.click(within(table()).getByRole("button", { name: /^Delete / }));
    await user.click(await screen.findByRole("button", { name: "Delete transaction" }));

    await waitFor(() => expect(summary()).toHaveTextContent("Showing 1–10 of 10"));
    expect(bodyRows()).toHaveLength(10); // not an empty "page 2"
  });
});

describe("Transaction-view - search and filters", () => {
  it("filters by description and says the results are filtered", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await search(user, "SUPERMARKET");
    expect(bodyRows().length).toBeGreaterThan(0);
    for (const row of bodyRows()) expect(row).toHaveTextContent(/Supermarket/);
    expect(summary()).toHaveTextContent("matching your filters");
  });

  it("shows a no-results state that names the search, and Clear filters restores everything", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await search(user, "zzzz");
    expect(screen.getByText("No matches for “zzzz”")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByLabelText("Search description")).toHaveValue("");
    expect(summary()).toHaveTextContent(`Showing 1–10 of ${TOTAL}`);
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("filters by type", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await user.selectOptions(screen.getByLabelText("Type"), "income");
    expect(bodyRows().length).toBeGreaterThan(0);
    for (const row of bodyRows()) expect(row).toHaveTextContent("Income:");
  });

  it("keeps type and category filters consistent", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await user.selectOptions(screen.getByLabelText("Category"), "groceries");
    await user.selectOptions(screen.getByLabelText("Type"), "income");
    // The visible dropdown cannot prove this (a <select> shows its first option when its value is
    // missing), so check the outcome: a leftover hidden "groceries" filter would empty the list.
    expect(screen.getByLabelText("Category")).toHaveValue("all");
    expect(bodyRows().length).toBeGreaterThan(0);
    for (const row of bodyRows()) expect(row).toHaveTextContent("Income:");
  });

  it("filters by category and by an inclusive date range", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await user.selectOptions(screen.getByLabelText("Category"), "housing");
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-10-02" } });
    expect(bodyRows()).toHaveLength(1); // the rent paid on 2 Oct: the last day of the range is included
    expect(bodyRows()[0]).toHaveTextContent("Apartment rent");
  });

  it("reports a reversed date range instead of showing misleading results", () => {
    renderWithData(<TransactionsView />);
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-10-10" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-10-01" } });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "start date must be on or before the end date",
    );
    expect(screen.getByText("Fix the date range to see results.")).toBeInTheDocument();
  });

  it("sorts by amount", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await user.selectOptions(screen.getByLabelText("Sort by"), "amount-desc");
    expect(bodyRows()[0]).toHaveTextContent(/780 000,00 Kz/); // the largest single transaction (a salary)
    await user.selectOptions(screen.getByLabelText("Sort by"), "amount-asc");
    expect(bodyRows()[0]).not.toHaveTextContent(/780 000,00 Kz/);
  });
});

describe("Transaction-view - empty and loading states", () => {
  it("guides a user with no transactions, without showing filters", () => {
    renderWithData(<TransactionsView />, { ...data, transactions: [] });
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    expect(screen.queryByLabelText("Search description")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add transaction" })).toBeInTheDocument();
  });
});

describe("Transaction-view - create, edit and delete from the list", () => {
  it("adds a transaction that then appears in the list", async () => {
    const user = userEvent.setup();
    renderWithData(
      <>
        <TransactionsView />
        <Probe />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    await user.type(await screen.findByLabelText("Description"), "Zebra crossing fine");
    await user.type(screen.getByLabelText("Amount (Kz)"), "1.000");
    await user.selectOptions(
      within(screen.getByRole("dialog")).getByLabelText("Category"),
      "other-expense",
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Add transaction" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await search(user, "zebra");
    expect(bodyRows()).toHaveLength(1);
    expect(bodyRows()[0]).toHaveTextContent("Zebra crossing fine");
    expect(bodyRows()[0]).toHaveTextContent(/1 000,00 Kz/);
  });

  it("edits a transaction in place", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await search(user, "online course");
    await user.click(within(table()).getAllByRole("button", { name: "Edit Online course" })[0]);

    const description = await screen.findByLabelText("Description");
    expect(description).toHaveValue("Online course");
    await user.clear(description);
    await user.type(description, "Evening course");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.clear(screen.getByLabelText("Search description"));
    await search(user, "evening course");
    expect(bodyRows().length).toBeGreaterThan(0);
  });

  it("asks for confirmation, defaults to the safe choice, and deletes only after confirming", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await search(user, "online course");
    const before = bodyRows().length;

    await user.click(within(table()).getAllByRole("button", { name: "Delete Online course" })[0]);
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this transaction?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus(); // safe default
    expect(dialog).toHaveTextContent("Online course");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(bodyRows()).toHaveLength(before); // cancelling deletes nothing
    expect(toast.success).not.toHaveBeenCalled();

    await user.click(within(table()).getAllByRole("button", { name: "Delete Online course" })[0]);
    await user.click(await screen.findByRole("button", { name: "Delete transaction" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Transaction deleted"));
    expect(bodyRows()).toHaveLength(before - 1); // exactly one removed (the data has one per month)
    expect(summary()).toHaveFocus(); // the row is gone, so focus moves somewhere sensible, not to <body>
  });

  it("returns focus to the button that opened the edit dialog, so keyboard users keep their place", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await search(user, "online course");
    const edit = within(table()).getAllByRole("button", { name: "Edit Online course" })[0];
    await user.click(edit);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(edit).toHaveFocus());
  });

  it("returns focus to the Delete button when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await search(user, "online course");
    const del = within(table()).getAllByRole("button", { name: "Delete Online course" })[0];
    await user.click(del);
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(del).toHaveFocus());
  });

  it("does not close the confirmation when clicking outside it", async () => {
    const user = userEvent.setup();
    renderWithData(<TransactionsView />);
    await user.click(within(table()).getAllByRole("button", { name: /^Delete / })[0]);
    await screen.findByRole("alertdialog");
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
