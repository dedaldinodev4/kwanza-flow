import { describe, expect, it } from "vitest";
import {
  isWithin,
  monthOf,
  monthRange,
  monthsBetween,
  shiftMonth,
  todayIso,
  toIsoDate,
} from "./iso";
import { describePeriod, isPeriodId, monthsInPeriod, resolvePeriod } from "./periods";

describe("ISO date helpers", () => {
  it("uses the LOCAL calendar day, even at the edges of the day", () => {
    expect(toIsoDate(new Date(2026, 9, 10, 0, 30))).toBe("2026-10-10");
    expect(todayIso(new Date(2026, 9, 10, 23, 59))).toBe("2026-10-10");
  });

  it("finds month boundaries including leap years", () => {
    expect(monthRange("2026-10")).toEqual({ start: "2026-10-01", end: "2026-10-31" });
    expect(monthRange("2026-02").end).toBe("2026-02-28");
    expect(monthRange("2028-02").end).toBe("2028-02-29");
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(monthOf("2026-10-31")).toBe("2026-10");
  });

  it("treats range ends as inclusive", () => {
    expect(isWithin("2026-10-01", "2026-10-01", "2026-10-31")).toBe(true);
    expect(isWithin("2026-10-31", "2026-10-01", "2026-10-31")).toBe(true);
    expect(isWithin("2026-09-30", "2026-10-01", "2026-10-31")).toBe(false);
    expect(isWithin("2026-11-01", "2026-10-01", "2026-10-31")).toBe(false);
  });

  it("lists months between two months inclusive", () => {
    expect(monthsBetween("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("resolvePeriod", () => {
  it("resolves this month", () => {
    expect(resolvePeriod("this-month", "2026-10-10")).toMatchObject({
      start: "2026-10-01",
      end: "2026-10-31",
    });
  });

  it("resolves last month across a year boundary", () => {
    expect(resolvePeriod("last-month", "2026-01-15")).toMatchObject({
      start: "2025-12-01",
      end: "2025-12-31",
    });
  });

  it("resolves the last 3 months as the current month plus the two before", () => {
    expect(resolvePeriod("last-3-months", "2026-01-31")).toMatchObject({
      start: "2025-11-01",
      end: "2026-01-31",
    });
  });

  it("resolves this year", () => {
    expect(resolvePeriod("this-year", "2026-10-10")).toMatchObject({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });

  it("lists the months a period touches", () => {
    expect(monthsInPeriod(resolvePeriod("last-3-months", "2026-10-10"))).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(monthsInPeriod(resolvePeriod("this-year", "2026-10-10"))).toHaveLength(12);
  });

  it("describes periods for display", () => {
    expect(describePeriod({ start: "2026-10-01", end: "2026-10-31" })).toBe("1 – 31 Oct 2026");
    expect(describePeriod({ start: "2026-08-01", end: "2026-10-31" })).toBe("1 Aug – 31 Oct 2026");
  });

  it("validates period ids from untrusted input (e.g. a URL)", () => {
    expect(isPeriodId("this-month")).toBe(true);
    expect(isPeriodId("forever")).toBe(false);
    expect(isPeriodId(undefined)).toBe(false);
  });
});
