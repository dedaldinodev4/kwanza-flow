import { describe, expect, it, vi } from "vitest";

import { buildMockData } from "@/mocks/mock-data";
import { createStorageRepository, STORAGE_KEY } from "./storage/repository";
import { makeTx } from "@/test/factories";
import { createFlakyStorage } from "@/test/storage";
import { AppStore, listenForStorageEvents } from "./app-store";

const TODAY = "2026-10-10";

function setup() {
  const storage = createFlakyStorage();
  const repository = createStorageRepository({
    getStorage: () => storage,
    buildDefault: buildMockData,
  });
  const load = vi.spyOn(repository, "load");
  let external: (() => void) | null = null;
  const stop = vi.fn();
  const store = new AppStore({
    repository,
    getToday: () => TODAY,
    listenForExternalChanges: (cb) => {
      external = cb;
      return stop;
    },
  });
  return { store, storage, repository, load, stop, fireExternalChange: () => external?.() };
}

const ready = (store: AppStore) => {
  const s = store.getSnapshot();
  if (s.status !== "ready") throw new Error("expected ready");
  return s;
};

describe("loading", () => {
  it("renders `loading` on the server and for the first client render, with a stable reference", () => {
    const { store } = setup();
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
    expect(store.getServerSnapshot()).toEqual({ status: "loading" });
  });

  it("reads storage lazily and only once", () => {
    const { store, load } = setup();
    expect(load).not.toHaveBeenCalled();
    store.getSnapshot();
    store.getSnapshot();
    expect(load).toHaveBeenCalledTimes(1);
    expect(ready(store).today).toBe(TODAY);
  });
});

describe("mutate", () => {
  it("applies the update, persists it and notifies subscribers with a new snapshot", () => {
    const { store, storage } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = ready(store);

    const result = store.mutate((d) => ({
      ...d,
      transactions: [...d.transactions, makeTx({ id: "new" })],
    }));

    expect(result).toEqual({ ok: true });
    expect(listener).toHaveBeenCalledTimes(1);
    const after = ready(store);
    expect(after).not.toBe(before); // replaced, not mutated
    expect(before.data.transactions.some((t) => t.id === "new")).toBe(false);
    expect(after.data.transactions.some((t) => t.id === "new")).toBe(true);
    expect(storage.dump()[STORAGE_KEY]).toContain('"new"');
  });

  it("keeps the change in memory and reports an error when saving fails, then recovers", () => {
    const { store, storage } = setup();
    ready(store);
    storage.flags.failWrites = true;
    const failed = store.mutate((d) => ({ ...d, transactions: [] }));
    expect(failed).toMatchObject({ ok: false, error: expect.stringMatching(/could not be saved/) });
    expect(ready(store).data.transactions).toEqual([]);
    expect(ready(store).persistenceError).not.toBeNull();

    storage.flags.failWrites = false;
    expect(store.mutate((d) => d)).toEqual({ ok: true });
    expect(ready(store).persistenceError).toBeNull();
  });
});

describe("tryMutate", () => {
  it("leaves state, storage and subscribers untouched when the update is refused", () => {
    const { store, storage } = setup();
    const before = ready(store);
    const stored = storage.dump()[STORAGE_KEY];
    const listener = vi.fn();
    store.subscribe(listener);

    const result = store.tryMutate(() => ({
      ok: false,
      error: "That transaction no longer exists.",
    }));

    expect(result).toEqual({
      ok: false,
      error: "That transaction no longer exists.",
      reason: "rejected",
    });
    expect(ready(store)).toBe(before);
    expect(storage.dump()[STORAGE_KEY]).toBe(stored);
    expect(listener).not.toHaveBeenCalled();
  });

  it("distinguishes a refused change from one that could not be saved", () => {
    const { store, storage } = setup();
    ready(store);
    storage.flags.failWrites = true;
    expect(store.tryMutate((data) => ({ ok: true, data }))).toMatchObject({
      ok: false,
      reason: "not-saved",
    });
  });
});

describe("external changes (another tab)", () => {
  it("reloads when storage was changed elsewhere and notifies subscribers", () => {
    const { store, storage, fireExternalChange } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    ready(store);

    const other = buildMockData(TODAY);
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: "x",
        data: { ...other, transactions: [makeTx({ id: "from-tab-2" })] },
      }),
    );
    fireExternalChange();

    expect(ready(store).data.transactions.map((t) => t.id)).toEqual(["from-tab-2"]);
    expect(listener).toHaveBeenCalled();
  });

  it("stops listening when the last subscriber leaves", () => {
    const { store, stop } = setup();
    const unsubscribeA = store.subscribe(() => { });
    const unsubscribeB = store.subscribe(() => { });
    unsubscribeA();
    expect(stop).not.toHaveBeenCalled();
    unsubscribeB();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe("reset and notices", () => {
  it("restores demo data, persists it and clears notices", () => {
    const { store, storage } = setup();
    ready(store);
    store.mutate((d) => ({ ...d, transactions: [] }));
    expect(store.resetDemoData()).toEqual({ ok: true });
    expect(ready(store).data).toEqual(buildMockData(TODAY));
    expect(storage.dump()[STORAGE_KEY]).toContain("txn-2026-10-salary");
  });

  it("surfaces a recovery notice and lets the user dismiss it", () => {
    const storage = createFlakyStorage({ [STORAGE_KEY]: "{broken" });
    const store = new AppStore({
      repository: createStorageRepository({
        getStorage: () => storage,
        buildDefault: buildMockData,
      }),
      getToday: () => TODAY,
    });
    expect(ready(store).notice).toMatchObject({ kind: "recovered" });
    store.dismissNotice();
    expect(ready(store).notice).toBeNull();
  });
});

describe("listenForStorageEvents (browser wiring)", () => {
  const fire = (key: string | null) => window.dispatchEvent(new StorageEvent("storage", { key }));

  it("reacts to changes of our key and to storage.clear(), but ignores other apps' keys", () => {
    const onChange = vi.fn();
    const stop = listenForStorageEvents(onChange);
    fire("some-other-app:setting");
    expect(onChange).not.toHaveBeenCalled(); // unrelated writes must not trigger a reload
    fire(STORAGE_KEY);
    expect(onChange).toHaveBeenCalledTimes(1);
    fire(null); // localStorage.clear() reports a null key
    expect(onChange).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stops reacting after it is stopped", () => {
    const onChange = vi.fn();
    listenForStorageEvents(onChange)();
    fire(STORAGE_KEY);
    expect(onChange).not.toHaveBeenCalled();
  });
});
