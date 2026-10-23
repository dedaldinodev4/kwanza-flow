"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@/i18n";
import { browserLanguageStore } from "@/i18n/store/language-store";
import { DEFAULT_LANGUAGE, HTML_LANG, type Language } from "@/i18n/languages";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  language?: Language;
}

export function I18nProvider({ children, language: pinned }: I18nProviderProps) {
  const store = browserLanguageStore;
  const detected = useSyncExternalStore(store.subscribe, store.getSnapshot, () => DEFAULT_LANGUAGE);
  const language = pinned ?? detected;
  const i18n = useMemo(() => createI18n(language), [language]);

  // Keep <html lang> truthful for screen readers, spell-checkers and hyphenation.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage: pinned ? () => {} : store.setLanguage }),
    [language, pinned, store.setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside <I18nProvider>.");
  return value;
}
