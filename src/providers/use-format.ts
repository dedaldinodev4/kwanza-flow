"use client";

import { useMemo } from "react";
import {
  formatCompactMoney,
  formatMoney,
  formatPermille,
  formatRatio,
  formatSignedAmount,
  formatSignedMoney,
  type MoneyFormatOptions,
} from "@/lib/formatters/currency";
import { useAppData } from "./app-data-provider";
import { DEFAULT_LOCALE } from "@/constants";


export function useFormat() {
  const state = useAppData();
  const locale = state.status === "ready" ? state.data.preferences.locale : DEFAULT_LOCALE;
  return useMemo(
    () => ({
      locale,
      money: (minor: number, options?: MoneyFormatOptions) =>
        formatMoney(minor, { locale, ...options }),
      signed: (minor: number, type: "income" | "expense") =>
        formatSignedMoney(minor, type, { locale }),
      net: (minor: number) => formatSignedAmount(minor, { locale }),
      compact: (minor: number) => formatCompactMoney(minor, locale),
      permille: (permille: number) => formatPermille(permille, locale),
      ratio: (ratio: number) => formatRatio(ratio, locale),
    }),
    [locale],
  );
}
