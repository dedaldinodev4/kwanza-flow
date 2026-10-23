import { enUS } from "date-fns/locale/en-US";
import { pt } from "date-fns/locale/pt";
import type { Locale } from "date-fns";
import type { Language } from "./languages";

/** date-fns locale for month and weekday names. Portuguese uses the European (pt) data, as Angola does. */
export function dateLocale(language: Language): Locale {
  return language === "pt" ? pt : enUS;
}
