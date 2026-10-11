import { 
  MINOR_UNITS_PER_MAJOR,
  DEFAULT_LOCALE, 
  FALLBACK_LOCALE, 
  MINUS
} from "@/constants";
export type { AppLocale } from "@/lib/locales";


export function minorToMajor(minor: number): number {
  return minor / MINOR_UNITS_PER_MAJOR;
}

//* Returns `preferred` when the runtime supports it, otherwise the documented fallback. *//
export function resolveLocale(
  preferred: string = DEFAULT_LOCALE,
  supportedLocalesOf: (locales: string[]) => string[] = (l) =>
    Intl.NumberFormat.supportedLocalesOf(l),
): string {
  return supportedLocalesOf([preferred]).length > 0 ? preferred : FALLBACK_LOCALE;
}

export interface MoneyFormatOptions {
  locale?: string;
  currency?: string;
  // 0 hides cêntimos (display only; underlying value is unchanged). Default 2
  fractionDigits?: 0 | 2;
}

const cache = new Map<string, Intl.NumberFormat>();
function formatter(key: string, create: () => Intl.NumberFormat): Intl.NumberFormat {
  let existing = cache.get(key);
  if (!existing) {
    existing = create();
    cache.set(key, existing);
  }
  return existing;
}

//* Formats integer minor units as currency *//
export function formatMoney(minor: number, options: MoneyFormatOptions = {}): string {
  const locale = resolveLocale(options.locale);
  const currency = options.currency ?? "AOA";
  const digits = options.fractionDigits ?? 2;
  const nf = formatter(
    `money|${locale}|${currency}|${digits}`,
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol", // narrowSymbol is the portable way to get "Kz"
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
  );
  return nf.format(minorToMajor(minor));
}

//* "+ Kz" for income, "− Kz" for expenses *//
export function formatSignedMoney(
  minor: number,
  type: "income" | "expense",
  options: MoneyFormatOptions = {},
): string {
  return `${type === "income" ? "+" : MINUS}${formatMoney(Math.abs(minor), options)}`;
}

//* Short number for chart axes, style compact notation. *//
export function formatCompactMoney(minor: number, locale?: string): string {
  const resolved = resolveLocale(locale);
  const nf = formatter(
    `compact|${resolved}`,
    () => new Intl.NumberFormat(resolved, { notation: "compact", maximumFractionDigits: 1 }),
  );
  return nf.format(minorToMajor(minor));
}

//* Formats a share expressed in permille (0–1000) as a percentage with one decimal. *//
export function formatPermille(permille: number, locale?: string): string {
  const resolved = resolveLocale(locale);
  const nf = formatter(
    `pct|${resolved}`,
    () =>
      new Intl.NumberFormat(resolved, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
  );
  return nf.format(permille / 1000);
}

//* Formats a 0–1 ratio as a whole-number percentage (for progress bars). *//
export function formatRatio(ratio: number, locale?: string): string {
  const resolved = resolveLocale(locale);
  const nf = formatter(
    `ratio|${resolved}`,
    () => new Intl.NumberFormat(resolved, { style: "percent", maximumFractionDigits: 0 }),
  );
  return nf.format(ratio);
}

//* Net cash flow: "+Kz …" when positive, "−Kz …" when negative, plain when zero. *//
export function formatSignedAmount(minor: number, options: MoneyFormatOptions = {}): string {
  if (minor === 0) return formatMoney(0, options);
  return `${minor > 0 ? "+" : MINUS}${formatMoney(Math.abs(minor), options)}`;
}
