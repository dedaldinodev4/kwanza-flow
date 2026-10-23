"use client";

import { useEffect, useState } from "react";

/**
 * Becomes true once the browser is idle (or after `timeoutMs`, whichever comes first). Used to mount heavy,
 * below-the-fold-in-priority content (the charts) AFTER the figures and lists have painted and become
 * interactive, instead of competing with them for the main thread during hydration.
 * The state is set inside a scheduler callback, never synchronously in the effect.
 */
export function useIdleReady(timeoutMs = 1200): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (idle) {
      const id = idle(() => setReady(true), { timeout: timeoutMs });
      return () =>
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 150); // Safari: no requestIdleCallback
    return () => window.clearTimeout(id);
  }, [timeoutMs]);
  return ready;
}
