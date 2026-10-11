import { describe, expect, it } from "vitest";
import { buildMockData } from "@/mocks/mock-data";
import { createFlakyStorage } from "@/test/storage";
import { makeTx } from "@/test/factories";
import {
  BACKUP_KEY,
  createStorageRepository,
  CURRENT_VERSION,
  parseStoredData,
  STORAGE_KEY,
} from "./repository";

const TODAY = "2026-10-10";
const NOW = "2026-10-10T09:00:00.000Z";

function setup(initial: Record<string, string> = {}) {
  const storage = createFlakyStorage(initial);
  const repo = createStorageRepository({
    getStorage: () => storage,
    buildDefault: buildMockData,
    now: () => NOW,
  });
  return { storage, repo };
}

const envelope = (data: unknown, version: unknown = CURRENT_VERSION) =>
  JSON.stringify({ version, savedAt: NOW, data });

describe("first run and round trip", () => {
  it("seeds demo data on first run and stores a versioned envelope", () => {
    const { repo, storage } = setup();
    const result = repo.load(TODAY);
    expect(result.notice).toBeNull();
    expect(result.data).toEqual(buildMockData(TODAY));
    expect(JSON.parse(storage.dump()[STORAGE_KEY])).toMatchObject({
      version: CURRENT_VERSION,
      savedAt: NOW,
    });
  });

  it("returns exactly what was saved", () => {
    const { repo } = setup();
    const data = buildMockData(TODAY);
    const changed = {
      ...data,
      transactions: [...data.transactions, makeTx({ id: "mine", description: "Mine" })],
    };
    expect(repo.save(changed)).toEqual({ ok: true });
    const loaded = repo.load(TODAY);
    expect(loaded.notice).toBeNull();
    expect(loaded.data.transactions.some((t) => t.id === "mine")).toBe(true);
  });

  it("does not store anything that looks like credentials", () => {
    const { storage, repo } = setup();
    repo.load(TODAY);
    expect(storage.dump()[STORAGE_KEY]).not.toMatch(/password|token|secret|iban|card/i);
  });
});

describe("rejected stored data is recovered safely, never silently discarded", () => {
  
  const cases: [string, string, RegExp][] = [
    ["malformed JSON", "{not json", /invalid JSON/],
    ["a non-object value", "123", /unexpected format/],
    ["null", "null", /unexpected format/],
    ["a missing version", JSON.stringify({ data: {} }), /no valid version/],
    ["a non-integer version", envelope({}, 1.5), /no valid version/],
    ["a string version", envelope({}, "1"), /no valid version/],
    ["version zero", envelope({}, 0), /no valid version/],
    ["a newer version", envelope({}, CURRENT_VERSION + 1), /newer version/],
    [
      "data that fails the schema",
      envelope({ transactions: [{ id: "x", amount: 1.5 }] }),
      /failed validation/,
    ],
    ["missing top-level fields", envelope({}), /failed validation/],
  ];

  it.each(cases)("recovers from %s", (_label, raw, reason) => {
    const { repo, storage } = setup({ [STORAGE_KEY]: raw });
    const result = repo.load(TODAY);
    expect(result.notice).toMatchObject({ kind: "recovered" });
    expect(result.notice?.message).toMatch(reason);
    expect(result.data).toEqual(buildMockData(TODAY));
    expect(storage.dump()[BACKUP_KEY]).toBe(raw); // the rejected copy is preserved
    expect(parseStoredData(storage.dump()[STORAGE_KEY]).ok).toBe(true); // and storage is healthy again
  });

  it("rejects schema-valid data that is internally inconsistent", () => {
    const data = buildMockData(TODAY);
    const bad = { ...data, transactions: [makeTx({ categoryId: "ghost" })] };
    const { repo } = setup({ [STORAGE_KEY]: envelope(bad) });
    expect(repo.load(TODAY).notice?.message).toMatch(/inconsistent/);
  });

  it("still recovers when the backup cannot be written", () => {
    const { repo, storage } = setup({ [STORAGE_KEY]: "{broken" });
    storage.flags.failWrites = true;
    const result = repo.load(TODAY);
    expect(result.data).toEqual(buildMockData(TODAY));
    expect(result.notice).toMatchObject({ kind: "recovered" });
  });
});

describe("migrations", () => {
  const v1 = envelope({ legacy: true }, 1);

  it("upgrades older data step by step", () => {
    const upgraded = buildMockData(TODAY);
    const result = parseStoredData(v1, { 1: () => upgraded }, 2);
    expect(result).toEqual({ ok: true, data: upgraded });
  });

  it("rejects when a migration step is missing", () => {
    expect(parseStoredData(v1, {}, 2)).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/No migration/),
    });
  });

  it("rejects when a migration throws", () => {
    const boom = () => {
      throw new Error("bad");
    };
    expect(parseStoredData(v1, { 1: boom }, 2)).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/failed/),
    });
  });
});

describe("storage failures give clear feedback and the app keeps working", () => {
  
  it("works in memory when storage is entirely unavailable", () => {
    const repo = createStorageRepository({ getStorage: () => null, buildDefault: buildMockData });
    const result = repo.load(TODAY);
    expect(result.data).toEqual(buildMockData(TODAY));
    expect(result.notice).toMatchObject({ kind: "unavailable" });
    expect(repo.save(result.data)).toMatchObject({ ok: false });
  });

  it("works in memory when reading throws", () => {
    const { repo, storage } = setup();
    storage.flags.failReads = true;
    expect(repo.load(TODAY).notice).toMatchObject({ kind: "unavailable" });
  });

  it("reports a failed save (for example quota exceeded)", () => {
    const { repo, storage } = setup();
    storage.flags.failWrites = true;
    const result = repo.save(buildMockData(TODAY));
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/full or blocked/) });
  });

  it("flags a first run that cannot persist its seed data", () => {
    const { repo, storage } = setup();
    storage.flags.failWrites = true;
    const result = repo.load(TODAY);
    expect(result.data.transactions.length).toBeGreaterThan(0);
    expect(result.notice).toMatchObject({ kind: "unavailable" });
  });

});

describe("reset", () => {
  
  it("replaces user changes with fresh demo data", () => {
    const { repo } = setup();
    const data = buildMockData(TODAY);
    repo.save({ ...data, transactions: [makeTx({ id: "mine" })] });
    const result = repo.reset(TODAY);
    expect(result.data).toEqual(buildMockData(TODAY));
    expect(repo.load(TODAY).data.transactions.some((t) => t.id === "mine")).toBe(false);
  });
});
