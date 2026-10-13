import { describe, expect, it } from "vitest";

import { buildMockData } from "@/mocks/mock-data";
import { updatePreferences } from "./preferences-service";

const data = buildMockData("2026-10-10");

describe("updatePreferences", () => {
  it("applies a valid patch without mutating the original or touching other data", () => {
    const result = updatePreferences(data, { locale: "en-US", density: "compact" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.preferences).toMatchObject({
      locale: "en-US",
      density: "compact",
      displayName: "Demo user",
    });
    expect(result.data.transactions).toBe(data.transactions);
    expect(data.preferences.locale).toBe("pt-AO");
  });

  it("trims the display name and accepts a new opening balance", () => {
    const result = updatePreferences(data, {
      displayName: "  Ana Silva  ",
      openingBalance: 250_000_00,
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.preferences).toMatchObject({
      displayName: "Ana Silva",
      openingBalance: 250_000_00,
    });
  });

  it.each([
    ["an empty name", { displayName: "   " }],
    ["a name that is too long", { displayName: "x".repeat(61) }],
    ["an unsupported locale", { locale: "fr-FR" as never }],
    ["an unknown density", { density: "huge" as never }],
    ["a fractional opening balance", { openingBalance: 10.5 }],
  ])("refuses %s and leaves the data unchanged", (_label, patch) => {
    expect(updatePreferences(data, patch)).toEqual({
      ok: false,
      error: "Those settings are not valid.",
    });
  });

  it("cannot change the currency (the demo is kwanza-only)", () => {
    const result = updatePreferences(data, { currency: "USD" } as never);
    expect(result.ok).toBe(false);
  });
});
