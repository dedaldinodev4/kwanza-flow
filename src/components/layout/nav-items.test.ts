import { describe, expect, it } from "vitest";
import { isActivePath, NAV_ITEMS } from "./nav-items";

describe("isActivePath", () => {
  it("matches the overview route only on the exact root path", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/transactions", "/")).toBe(false);
  });

  it("matches a section and its nested routes", () => {
    expect(isActivePath("/transactions", "/transactions")).toBe(true);
    expect(isActivePath("/transactions/123/edit", "/transactions")).toBe(true);
  });

  it("does not match sibling routes that merely share a prefix", () => {
    expect(isActivePath("/goals-archive", "/goals")).toBe(false);
  });
});

describe("NAV_ITEMS", () => {
  it("exposes the five primary routes from the brief, in order", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/transactions",
      "/budgets",
      "/goals",
      "/settings",
    ]);
  });
});
