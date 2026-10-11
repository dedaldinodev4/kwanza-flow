import { format } from "date-fns";
import { fromIsoDate } from "@/lib/dates/iso";

export function formatDay(
  isoDate: string,
  currentYear: string = String(new Date().getFullYear()),
): string {
  const date = fromIsoDate(isoDate);
  return format(date, isoDate.startsWith(currentYear) ? "d MMM" : "d MMM yyyy");
}
