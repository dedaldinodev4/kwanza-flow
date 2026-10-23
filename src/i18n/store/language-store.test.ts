import { describe, expect, it, vi } from "vitest";
import { createLanguageStore, LANGUAGE_STORAGE_KEY } from "./language-store";

function setup(options: { saved?: string; browser?: string[]; blocked?: boolean } = {}) {
  const data = new Map<string, string>(
    options.saved ? [[LANGUAGE_STORAGE_KEY, options.saved]] : [],
  );
  const storage = {
    getItem: vi.fn((k: string) => {
      if (options.blocked) throw new Error("blocked");
      return data.get(k) ?? null;
    }),
    setItem: vi.fn((k: string, v: string) => {
      if (options.blocked) throw new Error("blocked");
      data.set(k, v);
    }),
  };
  let external: () => void = () => {};
  const stop = vi.fn();
  const store = createLanguageStore({
    getStorage: () => storage,
    getBrowserLanguages: () => options.browser ?? ["en-US"],
    onExternalChange: (cb) => {
      external = cb;
      return stop;
    },
  });
  return { store, data, storage, fireExternal: () => external(), stop };
}

describe("language store", () => {
  it("shows English on the server and until the browser value is read", () => {
    const { store } = setup({ browser: ["pt-AO"] });
    expect(store.getServerSnapshot()).toBe("en");
    expect(store.getSnapshot()).toBe("pt");
  });

  it("detects from the browser when nothing is saved, and reads storage only once", () => {
    const { store, storage } = setup({ browser: ["pt-BR"] });
    expect(store.getSnapshot()).toBe("pt");
    store.getSnapshot();
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it("prefers the saved choice", () => {
    expect(setup({ saved: "en", browser: ["pt-AO"] }).store.getSnapshot()).toBe("en");
  });

  it("saves a choice, applies it, and notifies subscribers", () => {
    const { store, data } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setLanguage("pt");
    expect(store.getSnapshot()).toBe("pt");
    expect(data.get(LANGUAGE_STORAGE_KEY)).toBe("pt");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores an invalid language", () => {
    const { store, data } = setup();
    store.setLanguage("klingon" as never);
    expect(store.getSnapshot()).toBe("en");
    expect(data.size).toBe(0);
  });

  it("keeps working when storage is blocked: the choice applies for this visit", () => {
    const { store } = setup({ blocked: true, browser: ["en"] });
    expect(store.getSnapshot()).toBe("en");
    expect(() => store.setLanguage("pt")).not.toThrow();
    expect(store.getSnapshot()).toBe("pt");
  });

  it("picks up a change made in another tab", () => {
    const { store, data, fireExternal } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.getSnapshot()).toBe("en");
    data.set(LANGUAGE_STORAGE_KEY, "pt");
    fireExternal();
    expect(store.getSnapshot()).toBe("pt");
    expect(listener).toHaveBeenCalled();
  });

  it("stops listening for external changes when the last subscriber leaves", () => {
    const { store, stop } = setup();
    const a = store.subscribe(() => {});
    const b = store.subscribe(() => {});
    a();
    expect(stop).not.toHaveBeenCalled();
    b();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
