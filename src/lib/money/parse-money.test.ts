import { describe, expect, it } from "vitest";

import { formatMinorForInput, parseMoneyInput } from "./parse-money";

describe("parseMoneyInput: accepted formats", () => {
  it.each([
    ["1500", 150_000],
    ["0", 0],
    ["1500,5", 150_050],
    ["1500,50", 150_050],
    ["0,01", 1],
    ["1.500,50", 150_050],
    ["1.500.000,00", 150_000_000],
    ["1 500,50", 150_050],
    ["1\u00a0500,50", 150_050], // non-breaking space, as produced by Intl
    ["1.500", 150_000], // grouping, not 1.5
    ["1500.50", 150_050], // keyboard-style decimal point
    ["1.5", 150],
    ["Kz 2 000", 200_000],
    ["2000 kz", 200_000],
    ["  750,25  ", 75_025],
  ])("%j → %i", (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected);
  });
});

describe("parseMoneyInput: rejected input", () => {
  it.each([
    "",
    "   ",
    "abc",
    "-5",
    "+5",
    "1,2,3",
    "12,345", // three decimals
    "1..5",
    "10.000.0",
    "1.500,5,0",
    ",50", // no integer part
    "150,", // no decimals after the comma
    "1,500.50", // English grouping is ambiguous here, so it is refused
    "99999999999999", // too many digits
    "1e5",
    "12$",
  ])("%j → null", (input) => {
    expect(parseMoneyInput(input)).toBeNull();
  });
});

describe("exactness", () => {
  it("never produces floating-point artefacts", () => {
    // 0.1 + 0.2 style traps: these must be exact integers
    expect(parseMoneyInput("1,15")).toBe(115);
    expect(parseMoneyInput("4,35")).toBe(435);
    expect(parseMoneyInput("8,2")).toBe(820);
    expect(Number.isInteger(parseMoneyInput("19,99"))).toBe(true);
  });
});

describe("formatMinorForInput", () => {
  it("round-trips through the parser", () => {
    for (const minor of [1, 99, 100, 150_050, 150_000, 123_456_789]) {
      expect(parseMoneyInput(formatMinorForInput(minor))).toBe(minor);
    }
  });

  it("omits cêntimos for whole kwanza", () => {
    expect(formatMinorForInput(150_000)).toBe("1500");
    expect(formatMinorForInput(150_005)).toBe("1500,05");
  });
});
