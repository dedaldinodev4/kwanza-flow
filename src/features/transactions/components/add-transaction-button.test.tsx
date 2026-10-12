import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithData } from "@/test/render";

import { AddTransactionButton } from "./add-transaction-button";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

describe("AddTransactionButton (dashboard header action)", () => {
  it("does nothing visible until used, then opens the create dialog on demand", async () => {
    const user = userEvent.setup();
    renderWithData(<AddTransactionButton />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add transaction" }));
    expect(await screen.findByRole("dialog", { name: "Add transaction" })).toBeInTheDocument();
  });

  it("closes with Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    renderWithData(<AddTransactionButton />);
    const trigger = screen.getByRole("button", { name: "Add transaction" });
    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Radix restores focus on the next tick, after the dialog has unmounted.
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
