"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { todayIso } from "@/lib/dates/iso";
import { buildMockData } from "@/mocks/mock-data";
import type { AppData } from "@/types/domain";

export type AppDataState =
  { status: "loading" } | { status: "ready"; today: string; data: AppData };

const AppDataContext = createContext<AppDataState | null>(null);

const subscribe = () => () => { };

function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

interface AppDataProviderProps {
  children: ReactNode;
  /** Test/preview seam: supply both to skip client detection and render immediately. */
  today?: string;
  initialData?: AppData;
}

export function AppDataProvider({ children, today, initialData }: AppDataProviderProps) {
  const isClient = useIsClient();
  const state = useMemo<AppDataState>(() => {
    if (today && initialData) return { status: "ready", today, data: initialData };
    if (!isClient) return { status: "loading" };
    const resolvedToday = today ?? todayIso();
    return {
      status: "ready",
      today: resolvedToday,
      data: initialData ?? buildMockData(resolvedToday),
    };
  }, [isClient, today, initialData]);

  return <AppDataContext.Provider value={state}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataState {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData must be used inside <AppDataProvider>.");
  return value;
}
