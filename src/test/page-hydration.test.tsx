import { screen } from "@testing-library/react";
import { act, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BudgetsView } from "@/features/budgets/components/budgets-view";
import { GoalsView } from "@/features/goals/components/goals-view";
import { SettingsView } from "@/features/settings/components/settings-view";
import { AppDataProvider } from "@/providers/app-data-provider";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const pages: [string, ReactElement, string, RegExp][] = [
  ["budgets", <BudgetsView key="b" />, "Loading your budgets", /Budgets for /],
  ["goals", <GoalsView key="g" />, "Loading your goals", /Your goals/],
  ["settings", <SettingsView key="s" />, "Loading your settings", /Demo profile/],
];

describe.each(pages)("%s page hydration", (_name, view, loadingText, heading) => {
  const tree = <AppDataProvider>{view}</AppDataProvider>;

  it("server-renders only a loading state, with no stored data, dates or amounts", () => {
    const html = renderToString(tree);
    expect(html).toContain(loadingText);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Kz");
  });

  it("hydrates into the real page without any React errors", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.append(container);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    await act(async () => {
      hydrateRoot(container, tree);
    });

    await screen.findByRole("heading", { name: heading });
    expect(errors.mock.calls.map((c) => String(c[0]))).toEqual([]);
    container.remove();
  });
});
