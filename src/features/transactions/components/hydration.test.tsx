import { screen } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppDataProvider } from "@/providers/app-data-provider";
import { TransactionsView } from "./transactions-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const tree = (
  <AppDataProvider>
    <TransactionsView />
  </AppDataProvider>
);

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("transactions page hydration", () => {
  it("server-renders only a loading state (no storage-dependent content)", () => {
    const html = renderToString(tree);
    expect(html).toContain("Loading your transactions");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Kz");
  });

  it("hydrates into the real list without React errors", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.append(container);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    await act(async () => {
      hydrateRoot(container, tree);
    });

    expect(await screen.findByRole("table", { name: "Transactions" })).toBeInTheDocument();
    expect(errors.mock.calls.map((c) => String(c[0]))).toEqual([]);
    container.remove();
  });
});
