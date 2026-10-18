import { act } from "@testing-library/react";

/**
 * jsdom has no `window.matchMedia`, which next-themes uses for the "system" theme. This installs a
 * controllable stand-in: `setSystemDark(true)` simulates a device in dark mode.
 */
let systemDark = false;
const listeners = new Set<(event: { matches: boolean }) => void>();

export function installMatchMedia(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return query.includes("prefers-color-scheme: dark") ? systemDark : false;
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) =>
        listeners.delete(cb),
      addListener: (cb: (e: { matches: boolean }) => void) => listeners.add(cb),
      removeListener: (cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
      dispatchEvent: () => false,
    }),
  });
}

export function setSystemDark(value: boolean): void {
  systemDark = value;
  // Listeners (next-themes) update React state, so notify them inside act() like a real browser event
  // that React is already tracking; otherwise tests log "not wrapped in act" warnings.
  act(() => {
    listeners.forEach((cb) => cb({ matches: value }));
  });
}
