import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeTx } from "@/test/factories";
import { renderWithData, TODAY } from "@/test/render";

import { RecentTransactions } from "./recent-transactions";

describe("Dashboard - RecentTransactions", () => {
  it("shows an empty state that links to the transactions page", () => {
    renderWithData(<RecentTransactions transactions={[]} periodLabel="This month" today={TODAY} />);
    expect(screen.getByText("No transactions in this period")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to transactions" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });

  it("signs amounts, names the category and date, and tells screen readers the type", () => {
    renderWithData(
      <RecentTransactions
        periodLabel="This month"
        today={TODAY}
        transactions={[
          makeTx({
            description: "Monthly salary",
            type: "income",
            categoryId: "salary",
            amount: 780_000_00,
            date: "2026-10-05",
          }),
          makeTx({
            description: "Supermarket",
            type: "expense",
            categoryId: "groceries",
            amount: 38_000_00,
            date: "2026-10-03",
          }),
        ]}
      />,
    );
    expect(screen.getByText("Salary · 5 Oct")).toBeInTheDocument();
    expect(screen.getByText("+780 000,00 Kz")).toHaveTextContent("Income: +780 000,00 Kz");
    expect(screen.getByText(/38 000,00 Kz/)).toHaveTextContent("Expense: \u221238 000,00 Kz");
    expect(screen.getByRole("link", { name: "View all transactions" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });
});
