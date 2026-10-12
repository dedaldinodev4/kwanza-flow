"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

import { todayIso } from "@/lib/dates/iso";
import { AppStore, listenForStorageEvents, type AppState } from "@/store/app-store";

import { createStorageRepository } from "@/store/storage/repository";
import { createMemoryStorage, getBrowserStorage } from "@/store/storage/storage";

import { buildMockData } from "@/mocks/mock-data";
import type { AppData } from "@/types/domain";

export type { AppState as AppDataState } from "@/store/app-store";


const StateContext = createContext<AppState | null>(null);
const StoreContext = createContext<AppStore | null>(null);


interface AppDataProviderProps {
  children: ReactNode;
  /** Test/preview seam: supply both to skip client detection and render immediately. */
  today?: string;
  initialData?: AppData;
}

function createStore({
  today,
  initialData,
}: Pick<AppDataProviderProps, "today" | "initialData">): AppStore {
  if (initialData) {
    const memory = createMemoryStorage();
    return new AppStore({
      repository: createStorageRepository({
        getStorage: () => memory,
        buildDefault: () => initialData,
      }),
      getToday: () => today ?? todayIso(),
    });
  }
  return new AppStore({
    // The thunk is only called on the client, after hydration, never during server rendering.
    repository: createStorageRepository({
      getStorage: getBrowserStorage,
      buildDefault: buildMockData,
    }),
    getToday: () => today ?? todayIso(),
    listenForExternalChanges: listenForStorageEvents,
  });
}

/**
 * Serves validated, persisted app data. The server and the first client render see `loading`;
 * storage is read after hydration, so there is no hydration mismatch.
 */
export function AppDataProvider({ children, today, initialData }: AppDataProviderProps) {
  const [store] = useState(() => createStore({ today, initialData }));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return (
    <StoreContext.Provider value={store}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </StoreContext.Provider>
  );
}

export function useAppData(): AppState {
  const value = useContext(StateContext);
  if (!value) throw new Error("useAppData must be used inside <AppDataProvider>.");
  return value;
}

//* Stable mutation functions: they never change identity, so they are safe in dependency arrays. *//
export function useAppActions(): Pick<
  AppStore,
  "mutate" | "tryMutate" | "resetDemoData" | "dismissNotice"
> {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAppActions must be used inside <AppDataProvider>.");
  return store;
}

