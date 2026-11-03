import { createInstance, type i18n } from "i18next";
import en from "./resources/en.json";
import pt from "./resources/pt.json";
import { I18N_CODE, type Language } from "./languages";

/**
 * Keys are the English source text, so source code stays readable and a missing translation falls back to
 * English instead of showing a code. English therefore only needs entries for PLURAL forms (the `_one` variant).
 * Two namespaces: `translation` for the interface, `demo` for the sample data, so text a person types is never
 * translated and can never collide with an interface string.
 */
const resources = { en, [I18N_CODE.pt]: pt };

const cache = new Map<Language, i18n>();

/** One immutable, fully initialised instance per language. Initialisation is synchronous (resources are bundled). */
export function createI18n(language: Language): i18n {
  const cached = cache.get(language);
  if (cached) return cached;
  const instance = createInstance();
  void instance.init({
    lng: I18N_CODE[language],
    fallbackLng: "en",
    resources,
    ns: ["translation", "demo"],
    defaultNS: "translation",
    keySeparator: false, // keys are sentences, which contain dots
    nsSeparator: false, // ...and colons
    interpolation: { escapeValue: false }, // React escapes output
    returnNull: false,
    initAsync: false,
  });
  cache.set(language, instance);
  return instance;
}
