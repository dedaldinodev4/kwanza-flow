import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { incomeExpenseSeries } from "@/lib/calculations";
import { makeTx } from "@/test/factories";
import { renderWithData } from "@/test/render";

import { IncomeExpenseChart } from "./income-expense-chart";

const period = { start: "2026-10-01", end: "2026-10-31" };
const txs = [
  makeTx({ type: "income", categoryId: "salary", amount: 800_00, date: "2026-10-01" }),
  makeTx({ categoryId: "groceries", amount: 300_00, date: "2026-10-04" }),
  makeTx({ categoryId: "dining", amount: 100_00, date: "2026-10-12" }),
];

describe("Dashboard - IncomeExpenseChart", () => {
  it("gives the chart a text name and a table whose totals match the data", () => {
    renderWithData(
      <IncomeExpenseChart series={incomeExpenseSeries(txs, period)} periodLabel="This month" />,
    );
    const chart = screen.getByRole("img", {
      // Intl puts a non-breaking space before "Kz"; normalise before comparing.
      name: (name) =>
        name
          .replace(/\s/g, " ")
          .includes("This month: income 800,00 Kz, expenses 400,00 Kz, net +400,00 Kz"),
    });
    expect(chart).toBeInTheDocument();
    const table = screen.getByRole("table", { name: /Income and expenses/ });
    const footer = within(table).getAllByRole("row").at(-1)!;
    expect(footer).toHaveTextContent("Total800,00 Kz400,00 Kz");
  });

  it("shows an empty state instead of an empty chart", () => {
    renderWithData(
      <IncomeExpenseChart series={incomeExpenseSeries([], period)} periodLabel="This month" />,
    );
    expect(screen.getByText("Nothing to chart yet")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});


