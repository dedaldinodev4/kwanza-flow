import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * jsdom does not load CSS, so this checks the wiring statically: the "compact" density must override
 * variables that the UI really consumes. If a variable is defined but nothing reads it, the Layout density
 * setting would silently do nothing: exactly the kind of fake control the brief forbids.
 */ 
const root = join(__dirname, "../../..");
const css = readFileSync(join(root, "app/globals.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf("\n}", start);
  expect(start, `${selector} block`).toBeGreaterThan(-1);
  return Object.fromEntries(
    [...css.slice(start, end).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  );
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

const compact = block('[data-density="compact"]');
const comfortable = block(":root");
const sources = sourceFiles(root)
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

describe("layout density is wired through to the UI", () => {
  it("compact overrides at least the card and row spacing", () => {
    expect(Object.keys(compact).sort()).toEqual(["card-pad", "card-pad-sm", "row-pad"]);
  });

  it.each(Object.keys(compact))(
    "--%s has a comfortable default and a different compact value",
    (name) => {
      expect(comfortable[name], `:root --${name}`).toBeDefined();
      expect(compact[name]).not.toBe(comfortable[name]);
    },
  );

  it.each(Object.keys(compact))("--%s is actually consumed by components", (name) => {
    expect(
      sources.includes(`(--${name})`) || sources.includes(`var(--${name})`),
      `nothing reads --${name}`,
    ).toBe(true);
  });

  it("compact is tighter than comfortable for every variable", () => {
    const rem = (v: string) => parseFloat(v);
    for (const name of Object.keys(compact))
      expect(rem(compact[name])).toBeLessThan(rem(comfortable[name]));
  });
});
