import { addMonths as addMonthsDf, endOfMonth, format, parseISO, startOfMonth } from "date-fns";


export const ISO_DATE = "yyyy-MM-dd";
export const ISO_MONTH = "yyyy-MM";

export function toIsoDate(date: Date): string {
  return format(date, ISO_DATE);
}

//* Parses `YYYY-MM-DD` as local midnight (date-only strings parsed by `new Date()` would be UTC). *//
export function fromIsoDate(isoDate: string): Date {
  return parseISO(isoDate);
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

//* First and last day (inclusive) of a `YYYY-MM` month. *//
export function monthRange(month: string): { start: string; end: string } {
  const first = parseISO(`${month}-01`);
  return { start: toIsoDate(startOfMonth(first)), end: toIsoDate(endOfMonth(first)) };
}

export function shiftMonth(month: string, delta: number): string {
  return format(addMonthsDf(parseISO(`${month}-01`), delta), ISO_MONTH);
}

//* Inclusive on both ends; valid because ISO dates sort lexicographically. *//
export function isWithin(isoDate: string, start: string, end: string): boolean {
  return isoDate >= start && isoDate <= end;
}

//* Every `YYYY-MM` from `startMonth` to `endMonth`, inclusive. *//
export function monthsBetween(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  for (let m = startMonth; m <= endMonth; m = shiftMonth(m, 1)) months.push(m);
  return months;
}
