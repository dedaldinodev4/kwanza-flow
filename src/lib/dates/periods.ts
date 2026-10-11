import { format } from "date-fns";
import { fromIsoDate, monthOf, monthRange, monthsBetween, shiftMonth } from "./iso";

//* PERIOD *//
export const PERIOD_IDS = ["this-month", "last-month", "last-3-months", "this-year"] as const;
export type PeriodId = (typeof PERIOD_IDS)[number];

export interface Period {
  id: PeriodId;
  label: string;
  start: string;
  end: string;
}

export const PERIOD_LABELS: Record<PeriodId, string> = {
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "this-year": "This year",
};

export function resolvePeriod(id: PeriodId, today: string): Period {
  const thisMonth = monthOf(today);
  const label = PERIOD_LABELS[id];
  switch (id) {
    case "this-month":
      return { id, label, ...monthRange(thisMonth) };
    case "last-month":
      return { id, label, ...monthRange(shiftMonth(thisMonth, -1)) };
    case "last-3-months":
      return {
        id,
        label,
        start: monthRange(shiftMonth(thisMonth, -2)).start,
        end: monthRange(thisMonth).end,
      };
    case "this-year": {
      const year = today.slice(0, 4);
      return { id, label, start: `${year}-01-01`, end: `${year}-12-31` };
    }
  }
}

export function isPeriodId(value: unknown): value is PeriodId {
  return typeof value === "string" && (PERIOD_IDS as readonly string[]).includes(value);
}

//* Calendar months touched by the period, e.g. ["2026-08","2026-09","2026-10"]. *//
export function monthsInPeriod(period: Pick<Period, "start" | "end">): string[] {
  return monthsBetween(monthOf(period.start), monthOf(period.end));
}

//* "1 – 31 Oct 2026" or "1 Aug – 31 Oct 2026" for display under the period selector. *//
export function describePeriod(period: Pick<Period, "start" | "end">): string {
  const start = fromIsoDate(period.start);
  const end = fromIsoDate(period.end);
  if (monthOf(period.start) === monthOf(period.end)) {
    return `${format(start, "d")} – ${format(end, "d MMM yyyy")}`;
  }
  const sameYear = period.start.slice(0, 4) === period.end.slice(0, 4);
  return `${format(start, sameYear ? "d MMM" : "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
}
