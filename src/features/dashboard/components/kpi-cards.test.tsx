import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithData, TODAY } from "@/test/render";

import { KpiCards } from "./kpi-cards";

const render = (net: number, income = 500_000_00, expenses = 0) =>
  renderWithData(
    <KpiCards
      balance={4_161_000_00}
      asOf={TODAY}
      periodLabel="This month"
      summary={{ income, expenses, net, count: 3 }}
    />,
  );

describe("KpiCards", () => {
  it("shows exact kwanza amounts as term/description pairs", () => {
    render(374_000_00, 780_000_00, 406_000_00);
    expect(screen.getByText("Current balance").closest("dt")?.nextElementSibling).toHaveTextContent(
      "4 161 000,00 Kz",
    );
    expect(screen.getByText("Income").closest("dt")?.nextElementSibling).toHaveTextContent(
      "780 000,00 Kz",
    );
    expect(screen.getByText("Expenses").closest("dt")?.nextElementSibling).toHaveTextContent(
      "406 000,00 Kz",
    );
    expect(screen.getByText("As of 10 Oct")).toBeInTheDocument();
  });

  it("marks a positive net with a plus sign (not color alone)", () => {
    render(374_000_00);
    expect(screen.getByText("Net cash flow").closest("dt")?.nextElementSibling).toHaveTextContent(
      /^\+374 000,00 Kz$/,
    );
  });

  it("marks a negative net with a minus sign", () => {
    render(-120_500_00);
    expect(screen.getByText("Net cash flow").closest("dt")?.nextElementSibling).toHaveTextContent(
      /^\u2212120 500,00 Kz$/,
    );
  });

  it("shows zero without a sign", () => {
    render(0);
    expect(screen.getByText("Net cash flow").closest("dt")?.nextElementSibling).toHaveTextContent(
      /^0,00 Kz$/,
    );
  });
});
