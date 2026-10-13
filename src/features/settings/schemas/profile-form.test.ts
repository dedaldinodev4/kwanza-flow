import { describe, expect, it } from "vitest";

import { 
  profileFormSchema, 
  toProfilePatch 
} from "./profile-form";


const errorsOf = (values: { displayName: string; openingBalance: string }) => {
  const r = profileFormSchema.safeParse(values);
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe("profileFormSchema", () => {
  it("accepts a name and an opening balance, including zero", () => {
    expect(errorsOf({ displayName: "Ana", openingBalance: "1.500.000" })).toEqual({});
    expect(errorsOf({ displayName: "Ana", openingBalance: "0" })).toEqual({});
  });

  it("requires both fields", () => {
    expect(errorsOf({ displayName: "  ", openingBalance: "" })).toEqual({
      displayName: "Enter a name.",
      openingBalance: "Enter an opening balance (0 is fine).",
    });
  });

  it.each(["abc", "-100", "12,345"])("refuses the balance %j", (openingBalance) => {
    expect(errorsOf({ displayName: "Ana", openingBalance }).openingBalance).toMatch(/valid amount/);
  });

  it("limits the name length", () => {
    expect(errorsOf({ displayName: "x".repeat(61), openingBalance: "1" }).displayName).toMatch(
      /60/,
    );
  });

  it("converts to a trimmed name and integer minor units", () => {
    expect(toProfilePatch({ displayName: " Ana ", openingBalance: "1.500,50" })).toEqual({
      displayName: "Ana",
      openingBalance: 150_050,
    });
    expect(() => toProfilePatch({ displayName: "Ana", openingBalance: "oops" })).toThrow();
  });
});
