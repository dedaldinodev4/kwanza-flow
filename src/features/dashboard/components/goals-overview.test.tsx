import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { goalProgress } from "@/lib/calculations";
import { makeGoal } from "@/test/factories";
import { renderWithData, TODAY } from "@/test/render";

import { GoalsOverview } from "./goals-overview";

const entry = (o: Parameters<typeof makeGoal>[0]) => {
  const goal = makeGoal(o);
  return { goal, progress: goalProgress(goal) };
};

describe("Dashboard - GoalsOverview", () => {
  it("shows an empty state without goals", () => {
    renderWithData(<GoalsOverview goals={[]} today={TODAY} />);
    expect(screen.getByText("No savings goals yet")).toBeInTheDocument();
  });

  it("shows progress, the remaining amount and the target date for an active goal", () => {
    renderWithData(
      <GoalsOverview
        today={TODAY}
        goals={[
          entry({
            name: "Trip",
            targetAmount: 400_000_00,
            currentAmount: 100_000_00,
            targetDate: "2027-03-15",
          }),
        ]}
      />,
    );
    expect(screen.getByRole("progressbar", { name: "Trip progress" })).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
    expect(screen.getByText(/300 000 Kz to go · by 15 Mar 2027/)).toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });

  it("shows a completed state for a funded goal", () => {
    renderWithData(
      <GoalsOverview
        today={TODAY}
        goals={[entry({ name: "Laptop", targetAmount: 600_000_00, currentAmount: 600_000_00 })]}
      />,
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Goal reached")).toBeInTheDocument();
  });
});
