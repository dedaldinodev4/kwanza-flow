import { format } from "date-fns";
import { dateLocale } from "@/i18n/date-locale";
import { DEFAULT_LANGUAGE, type Language } from "@/i18n/languages";
import { message } from "@/i18n/utils/message";
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
  "this-month": message("This month"),
  "last-month": message("Last month"),
  "last-3-months": message("Last 3 months"),
  "this-year": message("This year"),
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
export function describePeriod(
  period: Pick<Period, "start" | "end">,
  language: Language = DEFAULT_LANGUAGE,
): string {
  const locale = { locale: dateLocale(language) };
  const start = fromIsoDate(period.start);
  const end = fromIsoDate(period.end);
  if (monthOf(period.start) === monthOf(period.end)) {
    return `${format(start, "d", locale)} – ${format(end, "d MMM yyyy", locale)}`;
  }
  const sameYear = period.start.slice(0, 4) === period.end.slice(0, 4);
  return `${format(start, sameYear ? "d MMM" : "d MMM yyyy", locale)} – ${format(end, "d MMM yyyy", locale)}`;
}
