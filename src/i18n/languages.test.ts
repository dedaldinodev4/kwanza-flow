import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  detectLanguage,
  HTML_LANG,
  I18N_CODE,
  isLanguage,
  LANGUAGES,
} from "./languages";

describe("detectLanguage", () => {
  it("lets an explicit saved choice win over the browser language", () => {
    expect(detectLanguage(["en-US"], "pt")).toBe("pt");
    expect(detectLanguage(["pt-AO"], "en")).toBe("en");
  });

  it.each([
    [["pt-AO"], "pt"],
    [["pt"], "pt"],
    [["pt-BR", "en"], "pt"],
    [["PT-pt"], "pt"], // tags are case-insensitive
    [["en-GB"], "en"],
    [["en", "pt"], "en"], // the first supported language in the browser's own order of preference
    [["fr-FR", "pt-AO"], "pt"], // unsupported languages are skipped, not treated as English
  ] as const)("detects %j as %s", (browser, expected) => {
    expect(detectLanguage(browser, null)).toBe(expected);
  });

  it("falls back to English when nothing is supported or known", () => {
    expect(detectLanguage(["fr", "de"], null)).toBe(DEFAULT_LANGUAGE);
    expect(detectLanguage([], null)).toBe("en");
  }); 

  it("ignores a corrupt saved value instead of trusting it", () => {
    expect(detectLanguage(["pt-AO"], "klingon")).toBe("pt");
    expect(detectLanguage(["en"], "")).toBe("en");
  });
});

describe("language constants", () => {
  it("validates languages", () => {
    expect(LANGUAGES.every(isLanguage)).toBe(true);
    expect(isLanguage("fr")).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });

  it("uses European Portuguese plural rules (0 is plural) while keeping html lang as Angolan Portuguese", () => {
    expect(new Intl.PluralRules(I18N_CODE.pt).select(0)).toBe("other");
    expect(new Intl.PluralRules("pt").select(0)).toBe("one"); // the Brazilian rule this avoids
    expect(HTML_LANG.pt).toBe("pt-AO");
  });
});
