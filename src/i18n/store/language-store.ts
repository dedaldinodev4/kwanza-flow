import { DEFAULT_LANGUAGE, detectLanguage, isLanguage, type Language } from "../languages";

export const LANGUAGE_STORAGE_KEY = "kwanzaflow:language";

interface Env {
  getStorage: () => Pick<Storage, "getItem" | "setItem"> | null;
  getBrowserLanguages: () => readonly string[];
  /** Subscribe to the `storage` event (a change made in another tab); returns an unsubscribe function. */
  onExternalChange?: (listener: () => void) => () => void;
}

/**
 * The language is a DEVICE preference, like the theme: it is stored on its own, not inside the app data, so
 * "Reset demo data" does not change it and no data migration is needed. Same external-store shape as the data
 * store: the server and the first client render see the default; the real value is read afterwards.
 */
export function createLanguageStore(env: Env) {
  let current: Language | null = null;
  const listeners = new Set<() => void>();
  let stop: (() => void) | null = null;

  function read(): Language {
    let saved: string | null = null;
    try {
      saved = env.getStorage()?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
    } catch {
      /* blocked storage: fall back to detection */
    }
    return detectLanguage(env.getBrowserLanguages(), saved);
  }
  const emit = () => listeners.forEach((l) => l());

  return {
    getServerSnapshot: (): Language => DEFAULT_LANGUAGE,
    getSnapshot: (): Language => (current ??= read()),
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      if (listeners.size === 1 && env.onExternalChange) {
        stop = env.onExternalChange(() => {
          current = read();
          emit();
        });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          stop?.();
          stop = null;
        }
      };
    },
    /** Remembers the choice. If storage is blocked the choice still applies until the page is closed. */
    setLanguage(language: Language): void {
      if (!isLanguage(language)) return;
      current = language;
      try {
        env.getStorage()?.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        /* keep the in-memory choice */
      }
      emit();
    },
  };
}

export type LanguageStore = ReturnType<typeof createLanguageStore>;

/** Browser wiring. Accessing window.localStorage can itself throw, hence the guard. */
export const browserLanguageStore: LanguageStore = createLanguageStore({
  getStorage: () => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  },
  getBrowserLanguages: () =>
    typeof navigator === "undefined"
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language],
  onExternalChange: (listener) => {
    const handler = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) listener();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
});
