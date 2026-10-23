"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getCategory } from "@/lib/categories";
import { formatMonth } from "@/lib/formatters/date";
import { message, type MessageParams } from "@/i18n/utils";
import { useLanguage } from "@/providers/i18n-provider";
import type { Language } from "@/i18n/languages";

export type { MessageParams };

/** Category names are stored in English and translated where they are shown. */
export function useCategoryName(): (categoryId: string) => string {
  const { t } = useTranslation();
  return useCallback(
    (categoryId: string) => t(getCategory(categoryId)?.name ?? message("Unknown category")),
    [t],
  );
}

/**
 * Sample data (demo transactions and goals) is translated through its own namespace. Text a person typed is not
 * in that namespace, so it is shown exactly as typed, and can never be mistaken for an interface string.
 */
export function useDemoText(): (text: string) => string {
  const { t } = useTranslation();
  return useCallback((text: string) => t(text, { ns: "demo" }), [t]);
}

const MONTH = /^\d{4}-\d{2}$/;

/** Turns raw parameters into display text: `YYYY-MM` months become month names, `category` is translated. */
export function resolveParams(
  params: MessageParams | undefined,
  translate: (key: string) => string,
  language: Language,
): MessageParams | undefined {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value !== "string") return [key, value];
      if (MONTH.test(value)) return [key, formatMonth(value, language)];
      if (key === "category") return [key, translate(value)];
      return [key, value];
    }),
  );
}

/**
 * Translates a message produced by pure code (a service error, a notice). Those messages are English source text
 * plus raw parameters, so the pure code never needs to know the language.
 */
export function useMessage(): (key: string, params?: MessageParams) => string {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return useCallback(
    (key: string, params?: MessageParams) =>
      t(key, resolveParams(params, (v) => t(v), language) ?? {}),
    [t, language],
  );
}
