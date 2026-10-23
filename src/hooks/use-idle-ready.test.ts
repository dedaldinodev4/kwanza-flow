import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIdleReady } from "./use-idle-ready";

const w = window as unknown as Record<string, unknown>;
// Fake only the timers: vitest's default also installs its own requestIdleCallback, which would hide the Safari path.
const SAFARI_LIKE = { toFake: ["setTimeout", "clearTimeout"] as ("setTimeout" | "clearTimeout")[] };

afterEach(() => {
  vi.useRealTimers(); 
  delete w.requestIdleCallback;
  delete w.cancelIdleCallback;
});

describe("useIdleReady", () => {
  it("is false on the first render and true once the browser reports it is idle", () => {
    let fire: () => void = () => {};
    w.requestIdleCallback = vi.fn((cb: () => void) => {
      fire = cb;
      return 7;
    });
    w.cancelIdleCallback = vi.fn();
    const { result } = renderHook(() => useIdleReady());
    expect(result.current).toBe(false);
    expect(w.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 1200 });
    act(() => fire());
    expect(result.current).toBe(true);
  });

  it("falls back to a short timer where requestIdleCallback does not exist (Safari)", () => {
    vi.useFakeTimers(SAFARI_LIKE);
    const { result } = renderHook(() => useIdleReady());
    expect(result.current).toBe(false);
    act(() => void vi.advanceTimersByTime(149));
    expect(result.current).toBe(false);
    act(() => void vi.advanceTimersByTime(2));
    expect(result.current).toBe(true);
  });

  it("cancels the pending callback on unmount so nothing runs afterwards", () => {
    const cancel = vi.fn();
    w.requestIdleCallback = vi.fn(() => 42);
    w.cancelIdleCallback = cancel;
    const { unmount } = renderHook(() => useIdleReady());
    unmount();
    expect(cancel).toHaveBeenCalledWith(42);
  });

  it("clears the fallback timer on unmount", () => {
    vi.useFakeTimers(SAFARI_LIKE);
    const clear = vi.spyOn(window, "clearTimeout");
    const { unmount } = renderHook(() => useIdleReady());
    unmount();
    expect(clear).toHaveBeenCalled();
  });
});
