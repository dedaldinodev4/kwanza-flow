import type { ReactNode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { SidebarProfile } from "@/components/layout/sidebar-profile";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { buildDashboardModel } from "@/features/dashboard/utils/dashboard-model";

import { formatMoney } from "@/lib/formatters/currency";
import { buildMockData } from "@/mocks/mock-data";
import { AppDataProvider, useAppData } from "@/providers/app-data-provider";
import { ThemeProvider } from "@/providers/theme-provider";

import { setSystemDark } from "@/test/match-media";
import { Probe } from "@/test/probe";
import { TODAY } from "@/test/render";

import { DensityScope } from "./density-scope";
import { localeOptions, selectedLocaleOption } from "./formatting-section";
import { SettingsView } from "./settings-view";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

const data = buildMockData(TODAY);
const html = document.documentElement;
const kz = (minor: number, locale = "pt-AO") => formatMoney(minor, { locale }).replace(/\s/g, " ");

/** Preferences as the store sees them, so tests check persisted state and not just what is drawn. */
function PrefsProbe() {
  const state = useAppData();
  return (
    <output aria-label="preferences">
      {state.status === "ready" ? JSON.stringify(state.data.preferences) : ""}
    </output>
  );
}
const prefs = () => JSON.parse(screen.getByLabelText("preferences").textContent!);

/** In-memory storage with injected data. */
function app(children: ReactNode, initial = data) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppDataProvider today={TODAY} initialData={initial}>
        <PrefsProbe />
        {children}
      </AppDataProvider>
    </ThemeProvider>,
  );
}

/** Real default data and real (jsdom) localStorage: needed for "reset to defaults". */
function appWithRealStorage(children: ReactNode) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppDataProvider today={TODAY}>
        <PrefsProbe />
        {children}
      </AppDataProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  html.className = "";
  html.removeAttribute("style");
  setSystemDark(false);
});

describe("structure and accessibility", () => {
  it("has labelled sections and radio groups", () => {
    app(<SettingsView />);
    for (const name of ["Demo profile", "Currency and number format", "Appearance", "Your data"]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    for (const name of ["Number format", "Theme", "Layout density"]) {
      expect(screen.getByRole("group", { name })).toBeInTheDocument();
    }
    expect(screen.getByText(/no accounts or sign-in/i)).toBeInTheDocument(); // never implies a secure account
  });
});

describe("profile", () => {
  it("is pre-filled, and Save stays unavailable until something changes", async () => {
    const user = userEvent.setup();
    app(<SettingsView />);
    expect(screen.getByLabelText("Display name")).toHaveValue("Demo user");
    expect(screen.getByLabelText("Opening balance (Kz)")).toHaveValue("1500000");
    const save = screen.getByRole("button", { name: "Save profile" });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText("Display name"), "x");
    expect(save).toBeEnabled();
  });

  it("explains invalid values inline and does not save them", async () => {
    const user = userEvent.setup();
    app(<SettingsView />);
    const name = screen.getByLabelText("Display name");
    const balance = screen.getByLabelText("Opening balance (Kz)");
    await user.clear(name);
    await user.clear(balance);
    await user.type(balance, "abc");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("Enter a name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid amount, for example 1.500,50.")).toBeInTheDocument();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(balance).toHaveAccessibleDescription(expect.stringContaining("valid amount"));
    expect(toast.success).not.toHaveBeenCalled();
    expect(prefs().displayName).toBe("Demo user");
  });

  it("saves, confirms, becomes unavailable again, and the sidebar profile follows", async () => {
    const user = userEvent.setup();
    app(
      <>
        <SidebarProfile />
        <SettingsView />
      </>,
    );
    expect(screen.getByText("DU")).toBeInTheDocument();
    const name = screen.getByLabelText("Display name");
    await user.clear(name);
    await user.type(name, "Ana Silva");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Profile saved"));
    expect(prefs().displayName).toBe("Ana Silva");
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByText("Ana Silva", { selector: "p" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled(),
    );
  });

  it("changing the opening balance changes the dashboard's current balance by exactly that amount", async () => {
    const user = userEvent.setup();
    const before = buildDashboardModel(data, TODAY, "this-month").balance;
    app(
      <>
        <DashboardView />
        <SettingsView />
      </>,
    );
    const balanceKpi = () =>
      within(screen.getByRole("region", { name: "Key figures" }))
        .getByText("Current balance")
        .closest("dt")
        ?.nextElementSibling?.textContent?.replace(/\s/g, " ");
    expect(balanceKpi()).toBe(kz(before));

    const field = screen.getByLabelText("Opening balance (Kz)");
    await user.clear(field);
    await user.type(field, "1.600.000"); // +100.000 Kz
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(balanceKpi()).toBe(kz(before + 100_000_00)));
  });
});

describe("number format", () => {
  it("shows a live example for each option and marks the current one", () => {
    app(<SettingsView />);
    const group = screen.getByRole("group", { name: "Number format" });
    expect(within(group).getByRole("radio", { name: /Portuguese \(Angola\)/ })).toBeChecked();
    expect(within(group).getByText(kz(123_456_750, "pt-AO"))).toBeInTheDocument();
    expect(within(group).getByText(kz(123_456_750, "en-US"))).toBeInTheDocument(); // e.g. Kz1,234,567.50
    expect(screen.getByText(/Angolan kwanza/)).toBeInTheDocument();
  });

  it("applies to the whole app immediately and is stored", async () => {
    const user = userEvent.setup();
    const balance = buildDashboardModel(data, TODAY, "this-month").balance;
    app(
      <>
        <DashboardView />
        <SettingsView />
      </>,
    );
    await user.click(screen.getByRole("radio", { name: /English \(United States\)/ }));

    const kpi = within(screen.getByRole("region", { name: "Key figures" }))
      .getByText("Current balance")
      .closest("dt")?.nextElementSibling;
    expect(kpi?.textContent?.replace(/\s/g, " ")).toBe(kz(balance, "en-US"));
    expect(prefs().locale).toBe("en-US");
    expect(screen.getByRole("radio", { name: /English \(United States\)/ })).toBeChecked();
  });
});

describe("number format options are all meaningful", () => {
  it("never offers two options that look identical", () => {
    const examples = localeOptions().map((o) => o.description);
    expect(new Set(examples).size).toBe(examples.length);
    expect(localeOptions().map((o) => o.value)).toEqual(["pt-AO", "en-US"]);
  });

  it("treats a stored pt-PT as the (identical-looking) Angola option", () => {
    expect(selectedLocaleOption("pt-PT")).toBe("pt-AO");
    expect(selectedLocaleOption("pt-AO")).toBe("pt-AO");
    expect(selectedLocaleOption("en-US")).toBe("en-US");
    expect(formatMoney(123_456_750, { locale: "pt-PT" })).toBe(
      formatMoney(123_456_750, { locale: "pt-AO" }),
    );
  });
});

describe("theme", () => {
  it("defaults to System and offers Light, Dark and System", () => {
    app(<SettingsView />);
    const group = screen.getByRole("group", { name: "Theme" });
    expect(
      within(group)
        .getAllByRole("radio")
        .map((r) => r.getAttribute("value")),
    ).toEqual(["light", "dark", "system"]);
    expect(within(group).getByRole("radio", { name: /System/ })).toBeChecked();
    expect(html).not.toHaveClass("dark");
  });

  it("switches the real document theme and remembers the choice", async () => {
    const user = userEvent.setup();
    app(<SettingsView />);
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(html).toHaveClass("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Light" }));
    expect(html).not.toHaveClass("dark");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("System follows the device setting", async () => {
    const user = userEvent.setup();
    app(<SettingsView />);
    setSystemDark(true);
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.click(screen.getByRole("radio", { name: /System/ }));
    expect(html).toHaveClass("dark");
    await act(async () => setSystemDark(false));
    expect(html).not.toHaveClass("dark");
  });

  it("restores a previously saved theme", () => {
    localStorage.setItem("theme", "dark");
    app(<SettingsView />);
    expect(html).toHaveClass("dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
  });
});

describe("layout density", () => {
  it("is applied to the layout and stored", async () => {
    const user = userEvent.setup();
    const { container } = app(
      <DensityScope>
        <SettingsView />
      </DensityScope>,
    );
    const scope = () => container.querySelector("[data-density]");
    expect(scope()).toHaveAttribute("data-density", "comfortable");

    await user.click(screen.getByRole("radio", { name: /Compact/ }));
    expect(scope()).toHaveAttribute("data-density", "compact");
    expect(prefs().density).toBe("compact");

    await user.click(screen.getByRole("radio", { name: /Comfortable/ }));
    expect(scope()).toHaveAttribute("data-density", "comfortable");
  });
});

describe("reset demo data", () => {
  it("asks first, defaults to Cancel, and changes nothing when cancelled", async () => {
    const user = userEvent.setup();
    appWithRealStorage(
      <>
        <SettingsView />
        <Probe />
      </>,
    );
    const demoCount = buildMockData(TODAY).transactions.length;
    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Reset demo data?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(dialog).toHaveTextContent(/cannot be undone/i);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByLabelText("transaction count")).toHaveTextContent(String(demoCount));
  });

  it("replaces changed data and preferences with fresh demo data, and keeps the theme", async () => {
    const user = userEvent.setup();
    appWithRealStorage(
      <>
        <SettingsView />
        <Probe />
      </>,
    );
    const demo = buildMockData(TODAY);

    // Make changes: clear transactions, switch density and theme.
    await user.click(screen.getByRole("button", { name: "probe: clear transactions" }));
    await user.click(screen.getByRole("radio", { name: /Compact/ }));
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(screen.getByText(/^0 transactions/)).toBeInTheDocument();
    expect(prefs().density).toBe("compact");

    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    await user.click(
      await screen
        .findByRole("button", { name: "Reset demo data", hidden: false })
        .then(() =>
          within(screen.getByRole("alertdialog")).getByRole("button", { name: "Reset demo data" }),
        ),
    );

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Demo data restored"));
    expect(screen.getByLabelText("transaction count")).toHaveTextContent(
      String(demo.transactions.length),
    );
    expect(
      screen.getByText(new RegExp(`^${demo.transactions.length} transactions`)),
    ).toBeInTheDocument();
    expect(prefs()).toEqual(demo.preferences); // density and everything else back to defaults
    expect(html).toHaveClass("dark"); // the theme is a device preference and is kept
    expect(JSON.parse(localStorage.getItem("kwanzaflow:data")!).data.transactions).toHaveLength(
      demo.transactions.length,
    );
  });

  it("warns, rather than failing silently, when the restored data cannot be saved", async () => {
    const user = userEvent.setup();
    appWithRealStorage(<SettingsView />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Reset demo data",
      }),
    );
    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringMatching(/restored for this session only/),
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
