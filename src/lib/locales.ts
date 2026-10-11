
export const SUPPORTED_LOCALES = ["pt-AO", "pt-PT", "en-US"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
