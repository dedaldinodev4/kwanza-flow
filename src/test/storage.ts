import { createMemoryStorage, type StorageLike } from "@/store/storage/storage";

//* Memory storage whose reads/writes can be made to fail, to exercise error handling. *//
export function createFlakyStorage(initial: Record<string, string> = {}) {
  const inner = createMemoryStorage(initial);
  const flags = { failWrites: false, failReads: false };
  const storage: StorageLike & { dump(): Record<string, string>; flags: typeof flags } = {
    flags,
    dump: inner.dump,
    getItem(key) {
      if (flags.failReads) throw new Error("read blocked");
      return inner.getItem(key);
    },
    setItem(key, value) {
      if (flags.failWrites) throw new DOMException("quota", "QuotaExceededError");
      inner.setItem(key, value);
    },
    removeItem: inner.removeItem,
  };
  return storage;
}
