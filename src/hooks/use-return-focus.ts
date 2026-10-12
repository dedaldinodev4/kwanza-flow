"use client";

import { useCallback, useState } from "react";

/**
 * Radix returns focus to its own <Trigger>. Our dialogs are opened from outside (state in the page),
 * so there is no Trigger and focus would drop to <body>, losing a keyboard user's place.
 * This remembers the element that had focus when the dialog mounted (the button that opened it)
 * and restores focus to it on close, if it still exists.
 */
export function useReturnFocus() {
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );
  return useCallback(
    (event: Event) => {
      event.preventDefault(); 
      if (opener instanceof HTMLElement && opener.isConnected && opener !== document.body)
        opener.focus();
    },
    [opener],
  );
}
