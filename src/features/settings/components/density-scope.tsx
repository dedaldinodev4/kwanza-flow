"use client";

import type { ReactNode } from "react";
import { useAppData } from "@/providers/app-data-provider";

export function DensityScope({ children }: { children: ReactNode }) {
  const state = useAppData();
  const density = state.status === "ready" ? state.data.preferences.density : "comfortable";
  
  return <div data-density={density}>{children}</div>;
}
