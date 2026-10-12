"use client";

import { AlertTriangle, X } from "lucide-react";
import { useAppActions, useAppData } from "@/providers/app-data-provider";


export function StorageNotice() {
  const state = useAppData();
  const { dismissNotice } = useAppActions();
  if (state.status !== "ready") return null;

  const { notice, persistenceError } = state;
  const message = persistenceError ?? notice?.message;
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-card border-warning bg-warning-surface text-warning mb-6 flex items-start gap-3 border p-4 text-sm"
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p className="min-w-0 flex-1 font-medium">{message}</p>
      {notice && !persistenceError && (
        <button
          type="button"
          onClick={dismissNotice}
          aria-label="Dismiss message"
          className="transition-ui rounded-control -m-2 grid size-11 shrink-0 place-items-center hover:bg-black/5"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
