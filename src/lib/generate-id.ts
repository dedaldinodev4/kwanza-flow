/**
 * Stable unique ids. `crypto.randomUUID` only exists in secure contexts (https or localhost),
 * so a plain-http preview would crash without the fallback.
 */

export function generateId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
}
