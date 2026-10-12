import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppDataProvider } from "@/providers/app-data-provider";
import { STORAGE_KEY } from "@/store/storage/repository";
import { TODAY } from "@/test/render";

import { TransactionsView } from "./transactions-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

afterEach(() => localStorage.clear());

const app = (
  <AppDataProvider today={TODAY}>
    <TransactionsView />
  </AppDataProvider>
);

describe("persistence across a reload (real localStorage, no mocked store)", () => {
  it("keeps a created transaction after the app is torn down and started again", async () => {
    const user = userEvent.setup();
    const first = render(app);
    await user.click(await screen.findByRole("button", { name: "Add transaction" }));
    await user.type(await screen.findByLabelText("Description"), "Survives reload");
    await user.type(screen.getByLabelText("Amount (Kz)"), "777");
    await user.selectOptions(
      within(screen.getByRole("dialog")).getByLabelText("Category"),
      "other-expense",
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Add transaction" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).data.transactions.some(
        (t: { description: string }) => t.description === "Survives reload",
      ),
    ).toBe(true);

    first.unmount(); // "reload": a brand-new provider and store read from storage
    render(app);
    await user.type(await screen.findByLabelText("Search description"), "survives");
    expect(
      within(screen.getByRole("table", { name: "Transactions" })).getAllByRole("row"),
    ).toHaveLength(2);
  });

  it("recovers from corrupted storage instead of crashing, and keeps a backup", async () => {
    localStorage.setItem(STORAGE_KEY, "{definitely not json");
    render(app);
    expect(await screen.findByRole("table", { name: "Transactions" })).toBeInTheDocument(); // app still works
    expect(localStorage.getItem("kwanzaflow:data:backup")).toBe("{definitely not json");
  });
});
