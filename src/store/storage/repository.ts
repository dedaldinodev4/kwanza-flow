import { appDataSchema, type AppData } from "@/types/domain";
import { checkIntegrity } from "./integrity";
import type { StorageLike } from "./storage";


export const STORAGE_KEY = "kwanzaflow:data";
export const BACKUP_KEY = "kwanzaflow:data:backup";
export const CURRENT_VERSION = 1;

//* Each entry upgrades stored data from version N to N+1. Empty until the first format change. *//
export type Migrations = Readonly<Record<number, (data: unknown) => unknown>>;
export const MIGRATIONS: Migrations = {};

export type Notice =
  { kind: "recovered"; message: string } | { kind: "unavailable"; message: string };

export type LoadResult = { data: AppData; notice: Notice | null };
export type SaveResult = { ok: true } | { ok: false; error: string };

export interface AppDataRepository {
  load(today: string): LoadResult;
  save(data: AppData): SaveResult;
  reset(today: string): LoadResult;
}

type Parsed = { ok: true; data: AppData } | { ok: false; reason: string };

//* Pure: raw string → validated AppData, or a reason it was rejected. *//
export function parseStoredData(
  raw: string,
  migrations: Migrations = MIGRATIONS,
  currentVersion: number = CURRENT_VERSION,
): Parsed {
  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "The saved data could not be read (invalid JSON)." };
  }
  if (typeof envelope !== "object" || envelope === null) {
    return { ok: false, reason: "The saved data had an unexpected format." };
  }
  const { version, data } = envelope as { version?: unknown; data?: unknown };
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { ok: false, reason: "The saved data has no valid version." };
  }
  if (version > currentVersion) {
    return { ok: false, reason: "The saved data comes from a newer version of the app." };
  }

  let current: unknown = data;
  for (let v = version; v < currentVersion; v += 1) {
    const migrate = migrations[v];
    if (!migrate) return { ok: false, reason: `No migration exists from version ${v}.` };
    try {
      current = migrate(current);
    } catch {
      return { ok: false, reason: `Upgrading saved data from version ${v} failed.` };
    }
  }

  const result = appDataSchema.safeParse(current);
  if (!result.success) {
    return {
      ok: false,
      reason: `The saved data failed validation (${result.error.issues.length} issue(s)).`,
    };
  }
  const problems = checkIntegrity(result.data);
  if (problems.length > 0)
    return { ok: false, reason: `The saved data is inconsistent: ${problems[0]}` };
  return { ok: true, data: result.data };
}

export function createStorageRepository(options: {
  getStorage: () => StorageLike | null;
  buildDefault: (today: string) => AppData;
  now?: () => string;
  migrations?: Migrations;
}): AppDataRepository {
  const { getStorage, buildDefault, migrations = MIGRATIONS } = options;
  const now = options.now ?? (() => new Date().toISOString());

  const serialize = (data: AppData) =>
    JSON.stringify({ version: CURRENT_VERSION, savedAt: now(), data });

  function save(data: AppData): SaveResult {
    const storage = getStorage();
    if (!storage)
      return { ok: false, error: "Browser storage is unavailable, so changes will not be kept." };
    try {
      storage.setItem(STORAGE_KEY, serialize(data));
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Browser storage is full or blocked, so changes could not be saved.",
      };
    }
  }

  function seed(today: string, notice: Notice | null): LoadResult {
    const data = buildDefault(today);
    const saved = save(data);
    if (!saved.ok && !notice) {
      return { data, notice: { kind: "unavailable", message: saved.error } };
    }
    return { data, notice };
  }

  return {
    save,

    load(today) {
      const storage = getStorage();
      if (!storage) {
        return {
          data: buildDefault(today),
          notice: {
            kind: "unavailable",
            message:
              "Browser storage is unavailable. The demo works, but nothing will be kept after you leave.",
          },
        };
      }
      let raw: string | null;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch {
        return {
          data: buildDefault(today),
          notice: {
            kind: "unavailable",
            message: "Browser storage could not be read. The demo works, but nothing will be kept.",
          },
        };
      }
      if (raw === null) return seed(today, null); // first run

      const parsed = parseStoredData(raw, migrations);
      if (parsed.ok) return { data: parsed.data, notice: null };

      // Never destroy data silently: keep the rejected copy so it can be inspected or recovered.
      try {
        storage.setItem(BACKUP_KEY, raw);
      } catch {
        /* backup is best-effort */
      }
      return seed(today, {
        kind: "recovered",
        message: `${parsed.reason} Demo data was restored and the old copy was kept as a backup.`,
      });
    },

    reset(today) {
      return seed(today, null);
    },
  };
}
