import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PeriodSelector } from "./period-selector";

describe("PeriodSelector", () => {
  it("exposes a labelled group of four radios with the current one checked", () => {
    render(<PeriodSelector value="last-month" onChange={() => {}} description="1 – 30 Sep 2026" />);
    expect(screen.getByRole("group", { name: "Reporting period" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: "Last month" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "This month" })).not.toBeChecked();
  });

  it("announces the selected date range", () => {
    render(<PeriodSelector value="this-month" onChange={() => {}} description="1 – 31 Oct 2026" />);
    expect(screen.getByText("Showing 1 – 31 Oct 2026")).toHaveAttribute("aria-live", "polite");
  });

  it("reports the chosen period", async () => {
    const onChange = vi.fn();
    render(<PeriodSelector value="this-month" onChange={onChange} description="" />);
    await userEvent.click(screen.getByRole("radio", { name: "This year" }));
    expect(onChange).toHaveBeenCalledWith("this-year");
  });
});
