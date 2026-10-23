/**
 * Marks a string as translatable text that is NOT passed to `t()` where it is written, for example validation
 * and service messages, which are translated later where they are displayed. It returns the text unchanged;
 * its only job is to make the string discoverable, so a test can check that every one has a Portuguese entry.
 */
export function message<T extends string>(text: T): T {
  return text;
}

/** Raw values substituted into a message when it is displayed (months are `YYYY-MM`, `category` is English text). */
export type MessageParams = Record<string, string | number>;
