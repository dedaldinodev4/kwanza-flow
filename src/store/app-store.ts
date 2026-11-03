import { type MessageParams, message } from "@/i18n/utils";
import type { AppDataRepository, Notice, SaveResult } from "./storage/repository";

import { STORAGE_KEY } from "./storage/repository";
import type { AppData } from "@/types/domain";


export type AppState =
  | { status: "loading" }
  | {
    status: "ready";
    today: string;
    data: AppData;
    notice: Notice | null;
    persistenceError: string | null;
  };

const LOADING: AppState = { status: "loading" };

export type MutationResult =
  | { ok: true }
  | { ok: false; error: string; params?: MessageParams; reason: "rejected" | "not-saved" };

export type Outcome =
  { ok: true; data: AppData } | { ok: false; error: string; params?: MessageParams };

interface StoreOptions {
  repository: AppDataRepository;
  getToday: () => string;
  listenForExternalChanges?: (onChange: () => void) => () => void;
}


export class AppStore {
  private state: AppState = LOADING;
  private loaded = false;
  private listeners = new Set<() => void>();
  private stopListening: (() => void) | null = null;

  constructor(private readonly options: StoreOptions) { }

  getServerSnapshot = (): AppState => LOADING;

  getSnapshot = (): AppState => {
    if (!this.loaded) this.load();
    return this.state;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1 && this.options.listenForExternalChanges) {
      this.stopListening = this.options.listenForExternalChanges(() => this.reloadFromStorage());
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopListening?.();
        this.stopListening = null;
      }
    };
  };


  tryMutate = (update: (data: AppData) => Outcome): MutationResult => {
    const current = this.getSnapshot();
    if (current.status !== "ready") {
      return {
        ok: false,
        error: message("Your data has not finished loading yet."),
        reason: "rejected",
      };
    }
    const outcome = update(current.data);
    if (!outcome.ok) return { ok: false, error: outcome.error, reason: "rejected" };
    const saved: SaveResult = this.options.repository.save(outcome.data);
    this.setState({
      ...current,
      data: outcome.data,
      persistenceError: saved.ok ? null : saved.error,
    });
    return saved.ok ? { ok: true } : { ok: false, error: saved.error, reason: "not-saved" };
  };

 
  mutate = (update: (data: AppData) => AppData): MutationResult =>
    this.tryMutate((data) => ({ ok: true, data: update(data) }));

  resetDemoData = (): MutationResult => {
    const today = this.options.getToday();
    const result = this.options.repository.reset(today);
    this.loaded = true;
    this.setState({
      status: "ready",
      today,
      data: result.data,
      notice: result.notice,
      persistenceError: result.notice?.kind === "unavailable" ? result.notice.message : null,
    });
    return result.notice?.kind === "unavailable"
      ? { ok: false, error: result.notice.message, reason: "not-saved" }
      : { ok: true };
  };

  dismissNotice = (): void => {
    if (this.state.status === "ready" && this.state.notice)
      this.setState({ ...this.state, notice: null });
  };

  private load(): void {
    const today = this.options.getToday();
    const result = this.options.repository.load(today);
    this.loaded = true;
    this.state = {
      status: "ready",
      today,
      data: result.data,
      notice: result.notice,
      persistenceError: result.notice?.kind === "unavailable" ? result.notice.message : null,
    };
  }

  private reloadFromStorage(): void {
    this.load();
    this.emit();
  }

  private setState(next: AppState): void {
    this.state = next;
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export function listenForStorageEvents(onChange: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
