import { describe, expect, it } from "vitest";
import {
  formatCompactMoney,
  formatMoney,
  formatPermille,
  formatRatio,
  formatSignedMoney,
  minorToMajor,
  resolveLocale,
} from "./currency";
import { FALLBACK_LOCALE } from "@/constants";

// Intl uses (narrow) no-break spaces as group separators; normalise so tests read clearly.
const plain = (s: string) => s.replace(/\s/g, " ");

describe("currecny - formatMoney()", () => {
  it("formats minor units as kwanza with pt-AO grouping and decimal comma", () => {
    expect(plain(formatMoney(123_456_750))).toBe("1 234 567,50 Kz");
  });

  it("formats zero", () => {
    expect(plain(formatMoney(0))).toBe("0,00 Kz");
  });

  it("formats negative values", () => {
    expect(plain(formatMoney(-150_000))).toMatch(/^-1 500,00 Kz$/);
  });

  it("can hide cêntimos for display without changing the value", () => {
    expect(plain(formatMoney(150_050, { fractionDigits: 0 }))).toMatch(/^1 50[01] Kz$/);
  });

  it("converts minor to major units without drifting", () => {
    expect(minorToMajor(150_050)).toBe(1500.5);
  });

  it("still prints Kz (not AOA) in the pt-PT fallback locale", () => {
    expect(plain(formatMoney(123_456_750, { locale: "pt-PT" }))).toBe("1 234 567,50 Kz");
  });
});

describe("currency - resolveLocale", () => {
  it("keeps the preferred locale when supported", () => {
    expect(resolveLocale("pt-AO", (l) => l)).toBe("pt-AO");
  });

  it("falls back to pt-PT when the runtime lacks the preferred locale", () => {
    expect(resolveLocale("pt-AO", () => [])).toBe(FALLBACK_LOCALE);
  });
});

describe("currency - formatSignedMoney()", () => {
  it("derives the sign from the transaction type, not the amount", () => {
    expect(plain(formatSignedMoney(5_000_00, "income"))).toBe("+5 000,00 Kz");
    expect(plain(formatSignedMoney(5_000_00, "expense"))).toBe("\u22125 000,00 Kz");
  });
});

describe("currency - percentages and compact numbers", () => {
  it("formats permille with one decimal", () => {
    expect(plain(formatPermille(424))).toBe("42,4%");
    expect(plain(formatPermille(1000))).toBe("100%");
  });

  it("formats ratios as whole percentages", () => {
    expect(plain(formatRatio(0.456))).toBe("46%");
  });

  it("produces short axis labels", () => {
    expect(formatCompactMoney(1_250_000_00).length).toBeLessThan(10);
  });
});
