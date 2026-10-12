import { MAX_MINOR_UNITS } from "@/constants";

/**
 * Parses what a person types into integer minor units (cêntimos), with NO floating-point math.
 */

export function parseMoneyInput(text: string): number | null {
  const cleaned = text.replace(/kz|aoa/gi, "").replace(/[\s\u00a0\u202f]/g, "");
  if (!/^[\d.,]+$/.test(cleaned)) return null;

  let integerPart: string;
  let fractionPart = "";

  const commaCount = (cleaned.match(/,/g) ?? []).length;
  if (commaCount > 1) return null;

  if (commaCount === 1) {
    const [left, right] = cleaned.split(",");
    if (!/^\d{1,2}$/.test(right)) return null;
    integerPart = left;
    fractionPart = right;
    if (!isValidIntegerPart(integerPart)) return null;
  } else if (cleaned.includes(".")) {
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      integerPart = cleaned; // thousands grouping
    } else if (/^\d+\.\d{1,2}$/.test(cleaned)) {
      [integerPart, fractionPart] = cleaned.split("."); // decimal point
    } else {
      return null;
    }
  } else {
    integerPart = cleaned;
  }

  const digits = integerPart.replace(/\./g, "");
  if (digits.length === 0 || digits.length > 12) return null; // also guards against precision loss
  const minor = Number(digits) * 100 + Number(fractionPart.padEnd(2, "0"));
  // Exact values slightly above the domain maximum are still returned, so the form can say
  // "too large" instead of "invalid". The 12-digit cap above keeps the arithmetic safe.
  return Number.isSafeInteger(minor) && minor <= MAX_MINOR_UNITS * 10 ? minor : null;
}

function isValidIntegerPart(part: string): boolean {
  return /^\d+$/.test(part) || /^\d{1,3}(\.\d{3})+$/.test(part);
}

//* Minor units → the editable text form used to pre-fill the amount field *//
export function formatMinorForInput(minor: number): string {
  const whole = Math.floor(minor / 100);
  const cents = minor % 100;
  return cents === 0 ? String(whole) : `${whole},${String(cents).padStart(2, "0")}`;
}
