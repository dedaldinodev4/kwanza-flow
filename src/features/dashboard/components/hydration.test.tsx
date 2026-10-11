import { screen } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { afterEach, describe, expect, it, vi } from "vitest";

import { AppDataProvider } from "@/providers/app-data-provider";
import { DashboardView } from "./dashboard-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

const tree = (
  <AppDataProvider>
    <DashboardView />
  </AppDataProvider>
);

afterEach(() => vi.restoreAllMocks());

describe("hydration - Dashboard", () => {
  it("server-renders a loading state that carries no client-only data", () => {
    const html = renderToString(tree);
    expect(html).toContain("Loading your overview");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Kz"); // no amounts: the server cannot know the user's date or storage
  });

  it("hydrates the server HTML into the real dashboard without any React errors", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.append(container);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    await act(async () => {
      hydrateRoot(container, tree);
    });

    // The charts are lazy-loaded; wait for them so nothing resolves after the test ends.
    await screen.findByRole("table", { name: /Income and expenses/ }, { timeout: 4000 });

    expect(errors.mock.calls.map((c) => String(c[0]))).toEqual([]); // no mismatch / recoverable errors
    expect(container.textContent).toContain("Current balance"); // client data replaced the skeleton
    expect(container.textContent).not.toContain("Loading your overview");
    container.remove();
  });
});
