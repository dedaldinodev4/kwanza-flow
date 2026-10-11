import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BudgetProgress as Item } from "@/lib/calculations";
import { renderWithData } from "@/test/render";

import { BudgetProgress } from "./budget-progress";

const item = (o: Partial<Item>): Item => ({
  categoryId: "groceries",
  name: "Groceries",
  limit: 100_000_00,
  spent: 0,
  remaining: 100_000_00,
  ratio: 0,
  status: "ok",
  ...o,
});

describe("Dashboard - BudgetProgress", () => {
  it("shows an empty state with a link when there are no budgets", () => {
    renderWithData(<BudgetProgress budgets={[]} periodLabel="This month" />);
    expect(screen.getByText("No budgets for this period")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to budgets" })).toHaveAttribute("href", "/budgets");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("describes each status in words, not only color", () => {
    renderWithData(
      <BudgetProgress
        periodLabel="This month"
        budgets={[
          item({
            categoryId: "a",
            name: "Dining out",
            spent: 130_000_00,
            remaining: -30_000_00,
            ratio: 1.3,
            status: "over",
          }),
          item({
            categoryId: "b",
            name: "Utilities",
            spent: 90_000_00,
            remaining: 10_000_00,
            ratio: 0.9,
            status: "warning",
          }),
          item({
            categoryId: "c",
            name: "Transport",
            spent: 20_000_00,
            remaining: 80_000_00,
            ratio: 0.2,
            status: "ok",
          }),
        ]}
      />,
    );
    expect(screen.getByText("Over budget by 30 000,00 Kz")).toBeInTheDocument();
    expect(screen.getByText(/Close to limit · 10 000,00 Kz left/)).toBeInTheDocument();
    expect(screen.getByText(/On track · 80 000,00 Kz left/)).toBeInTheDocument();
  });

  it("exposes accessible progress bars, and does not clamp the announced value for overspending", () => {
    renderWithData(
      <BudgetProgress
        periodLabel="This month"
        budgets={[
          item({
            name: "Dining out",
            ratio: 1.3,
            status: "over",
            spent: 130_000_00,
            remaining: -30_000_00,
          }),
        ]}
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "Dining out budget used" });
    expect(bar).toHaveAttribute("aria-valuenow", "130");
    expect(bar.firstElementChild).toHaveStyle({ width: "100%" }); // drawn full, text carries detail
  });
});
