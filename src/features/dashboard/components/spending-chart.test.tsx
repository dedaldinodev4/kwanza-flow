import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { spendingByCategory, groupSmallCategories } from "@/lib/calculations";
import { makeTx } from "@/test/factories";
import { renderWithData } from "@/test/render";

import { SpendingChart } from "./spending-chart";


const txs = [
  makeTx({ type: "income", categoryId: "salary", amount: 800_00, date: "2026-10-01" }),
  makeTx({ categoryId: "groceries", amount: 300_00, date: "2026-10-04" }),
  makeTx({ categoryId: "dining", amount: 100_00, date: "2026-10-12" }),
];

describe("Dashboard - SpendingChart", () => {
  const rows = spendingByCategory(txs);

  it("lists every category with amount and percentage, so color is never the only cue", () => {
    renderWithData(<SpendingChart chartRows={rows} allRows={rows} total={400_00} />);
    expect(screen.getByText("Groceries").closest("li")).toHaveTextContent("300 Kz75%");
    expect(screen.getByText("Dining out").closest("li")).toHaveTextContent("100 Kz25%");
    expect(
      screen.getByRole("img", { name: (name) => name.includes("Largest: Groceries") }),
    ).toBeInTheDocument();
  });

  it("offers the full category list when slices were grouped", () => {
    const many = spendingByCategory(
      ["groceries", "dining", "transport", "health", "education", "utilities", "housing"].map(
        (categoryId, i) => makeTx({ categoryId, amount: (10 - i) * 100_00 }),
      ),
    );
    renderWithData(
      <SpendingChart chartRows={groupSmallCategories(many, 6)} allRows={many} total={5_800_00} />,
    );
    expect(screen.getByText("Other categories")).toBeInTheDocument();
    expect(screen.getByText("All categories")).toBeInTheDocument();
  });

  it("shows an empty state without expenses", () => {
    renderWithData(<SpendingChart chartRows={[]} allRows={[]} total={0} />);
    expect(screen.getByText("No expenses in this period")).toBeInTheDocument();
  });
});
