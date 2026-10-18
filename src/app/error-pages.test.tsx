import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DashboardError from "./(dashboard)/error";
import NotFound from "./not-found";

describe("DashboardError", () => {
  it("announces the problem, reassures about the data, and lets the person retry", async () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error("boom")} reset={reset} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(alert).toHaveTextContent(/has not been changed/);
    expect(alert).not.toHaveTextContent("boom"); // internal error details are never shown to the user

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("NotFound", () => {
  it("explains and links back to the overview", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Overview" })).toHaveAttribute("href", "/");
  });
});
