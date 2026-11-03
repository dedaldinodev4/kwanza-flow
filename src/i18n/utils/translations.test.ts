import { describe, expect, it } from "vitest";
import { buildMockData } from "@/mocks/mock-data";
import { createI18n } from "../index";
import { I18N_CODE } from "../languages";
import en from "../resources/en.json";
import pt from "../resources/pt.json";
import { collectKeys, sourceFiles } from "./source-scan";

const used = new Set<string>();
for (const file of sourceFiles())
  if (!file.includes("/src/i18n/")) collectKeys(file).forEach((k) => used.add(k));

const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
const PLURAL_SUFFIX = "_one";
const baseKey = (key: string) =>
  key.endsWith(PLURAL_SUFFIX) ? key.slice(0, -PLURAL_SUFFIX.length) : key;
/** Words that are the same in both languages. */
const SAME_IN_BOTH = new Set(["Total"]);

describe("Portuguese translations are complete and consistent", () => {
  it("has an entry for every string the code asks for", () => {
    const missing = [...used].filter((key) => !(key in pt.translation));
    expect(missing, `missing Portuguese for:\n${missing.join("\n")}`).toEqual([]);
  });

  it("has no stale entries that nothing uses", () => {
    const stale = Object.keys(pt.translation).filter((key) => !used.has(baseKey(key)));
    expect(stale, `unused Portuguese entries:\n${stale.join("\n")}`).toEqual([]);
  });

  it("never leaves a translation empty or identical to the English (except shared words)", () => {
    const bad = Object.entries(pt.translation).filter(
      ([key, value]) => !value.trim() || (value === key && !SAME_IN_BOTH.has(key)),
    );
    expect(bad.map(([k]) => k)).toEqual([]);
  });

  it("keeps every {{placeholder}} of the English text", () => {
    const wrong = Object.entries(pt.translation)
      .filter(([key, value]) => placeholders(baseKey(key)).join() !== placeholders(value).join())
      .map(([key]) => key);
    expect(wrong, "translations that add or drop a placeholder").toEqual([]);
  });

  it("covers every sample-data text (demo transactions and goals) and nothing else", () => {
    const data = buildMockData("2026-10-14");
    const texts = new Set([
      ...data.transactions.map((t) => t.description),
      ...data.goals.map((g) => g.name),
    ]);
    const missing = [...texts].filter((text) => !(text in pt.demo));
    expect(missing, `sample data without Portuguese:\n${missing.join("\n")}`).toEqual([]);
    expect(Object.keys(pt.demo).filter((key) => !texts.has(key))).toEqual([]);
  });

  it("defines the singular form in BOTH languages for every plural key", () => {
    const pluralKeys = Object.keys(en.translation).filter((k) => k.endsWith(PLURAL_SUFFIX));
    expect(pluralKeys.length).toBeGreaterThan(0);
    for (const key of pluralKeys) {
      expect(key in pt.translation, `pt needs ${key}`).toBe(true);
      expect(baseKey(key) in pt.translation, `pt needs ${baseKey(key)}`).toBe(true);
    }
  });
});

describe("plural rules (European Portuguese, as used in Angola)", () => {
  const pt18 = createI18n("pt");
  const en18 = createI18n("en");
  const key = "{{count}} categories are over budget";

  it("treats 0 as plural and 1 as singular", () => {
    expect(new Intl.PluralRules(I18N_CODE.pt).select(0)).toBe("other");
    expect(pt18.t(key, { count: 0 })).toBe("0 categorias excederam o orçamento");
    expect(pt18.t(key, { count: 1 })).toBe("1 categoria excedeu o orçamento");
    expect(pt18.t(key, { count: 2 })).toBe("2 categorias excederam o orçamento");
  });

  it("falls back to the plural text for the 'many' category (large round numbers), never to English", () => {
    expect(new Intl.PluralRules(I18N_CODE.pt).select(1_000_000)).toBe("many");
    expect(pt18.t(key, { count: 1_000_000 })).toBe("1000000 categorias excederam o orçamento");
  });

  it("English singular and plural", () => {
    expect(en18.t(key, { count: 1 })).toBe("1 category is over budget");
    expect(en18.t(key, { count: 3 })).toBe("3 categories are over budget");
  });
});

describe("runtime behaviour", () => {
  it("translates interface text and falls back to English for anything missing", () => {
    const pt18 = createI18n("pt");
    expect(pt18.t("Overview")).toBe("Visão geral");
    expect(pt18.t("Page {{page}} of {{total}}", { page: 2, total: 19 })).toBe("Página 2 de 19");
    expect(pt18.t("Some text nobody translated")).toBe("Some text nobody translated");
  });

  it("translates sample data but never text a person typed, even when it equals an interface string", () => {
    const pt18 = createI18n("pt");
    expect(pt18.t("Monthly salary", { ns: "demo" })).toBe("Salário mensal");
    expect(pt18.t("Overview", { ns: "demo" })).toBe("Overview"); // a typed "Overview" stays as typed
    expect(pt18.t("Rent for the shop", { ns: "demo" })).toBe("Rent for the shop");
  });
});
