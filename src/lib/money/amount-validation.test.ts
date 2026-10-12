import { describe, expect, it } from "vitest";

import { amountError } from "./amount-validation";

describe("amountError", () => {
  it("accepts usable amounts", () => {
    expect(amountError("1.500,50")).toBeNull();
    expect(amountError("1")).toBeNull();
  });

  it("rejects text that is not an amount", () => {
    expect(amountError("abc")).toMatch(/valid amount/);
    expect(amountError("-5")).toMatch(/valid amount/);
  });

  it("rejects zero unless it is explicitly allowed", () => {
    expect(amountError("0")).toMatch(/greater than zero/);
    expect(amountError("0,00", { allowZero: false })).toMatch(/greater than zero/);
    expect(amountError("0", { allowZero: true })).toBeNull();
  });

  it("rejects amounts above the supported maximum", () => {
    expect(amountError("100000000001")).toMatch(/too large/);
  });
});
