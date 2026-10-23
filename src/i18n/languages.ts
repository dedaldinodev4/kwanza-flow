export const LANGUAGES = ["en", "pt"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";

/** Native names, shown in the language switcher: each language is named in itself. */
export const LANGUAGE_LABELS: Record<Language, string> = { en: "English", pt: "Português" };

/**
 * Code given to i18next. Portuguese uses pt-PT so that PLURAL RULES follow European Portuguese, which Angola
 * uses ("0 transações"); the generic `pt` rules are Brazilian and treat 0 as singular. Resources are stored under `pt`.
 */
export const I18N_CODE: Record<Language, string> = { en: "en", pt: "pt-PT" };

/** Value of <html lang>. */
export const HTML_LANG: Record<Language, string> = { en: "en", pt: "pt-AO" };

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Picks the language: an explicit saved choice wins; otherwise the first browser language we support
 * ("pt", "pt-AO", "pt-BR" → Portuguese; "en-*" → English); otherwise English.
 */
export function detectLanguage(
  browserLanguages: readonly string[],
  saved: string | null,
): Language {
  if (isLanguage(saved)) return saved;
  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}
