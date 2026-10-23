import { format } from "date-fns";
import { fromIsoDate } from "@/lib/dates/iso";
import { dateLocale } from "@/i18n/date-locale";
import { DEFAULT_LANGUAGE, type Language } from "@/i18n/languages";


export function formatDay(
  isoDate: string,
  currentYear: string = String(new Date().getFullYear()),
): string {
  const date = fromIsoDate(isoDate);
  return format(date, isoDate.startsWith(currentYear) ? "d MMM" : "d MMM yyyy");
}

/** "October 2026" for a `YYYY-MM` month; "outubro de 2026" in Portuguese. */
export function formatMonth(month: string, language: Language = DEFAULT_LANGUAGE): string {
  return format(fromIsoDate(`${month}-01`), language === "pt" ? "MMMM 'de' yyyy" : "MMMM yyyy", {
    locale: dateLocale(language),
  });
}

