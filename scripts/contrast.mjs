// Verifies WCAG 2.2 contrast for the design tokens ACTUALLY used by the app.
// Tokens are parsed from src/app/globals.css (not copied here), so this cannot drift from reality.
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Block ${selector} not found in globals.css`);
  const end = css.indexOf("\n}", start);
  return Object.fromEntries(
    [...css.slice(start, end).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
};
const light = block(":root");
const themes = { light, dark: { ...light, ...block(".dark") } };

const lum = (hex) => {
  const c = hex
    .replace("#", "")
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Hard-coded colors used in components (kept explicit so a change here is a conscious decision).
const DARK_INK = "#0b1411"; // brand mark text, destructive button text in dark mode
const WHITE = "#ffffff"; // destructive button text in light mode

// [label, foreground, background, minimum ratio]. 4.5 = text, 3 = non-text UI.
const pairs = (t, name) => [
  ["body text on canvas", t.foreground, t.background, 4.5],
  ["body text on card", t.foreground, t.card, 4.5],
  ["muted text on canvas", t["muted-foreground"], t.background, 4.5],
  ["muted text / placeholders on card", t["muted-foreground"], t.card, 4.5],
  ["muted text on muted surface", t["muted-foreground"], t.muted, 4.5],
  ["primary button text", t["primary-foreground"], t.primary, 4.5],
  ["destructive button text", name === "light" ? WHITE : DARK_INK, t.destructive, 4.5],
  ["brand mark text on brand", DARK_INK, t.brand, 4.5],
  ["income/success text on card", t.success, t.card, 4.5],
  ["success badge text on its surface", t.success, t["success-surface"], 4.5],
  ["expense/error text on card", t.destructive, t.card, 4.5],
  ["error panel text on its surface", t.destructive, t["destructive-surface"], 4.5],
  ["warning text on card", t.warning, t.card, 4.5],
  ["warning notice text on its surface", t.warning, t["warning-surface"], 4.5],
  ["sidebar link (inactive)", t["sidebar-muted"], t.sidebar, 4.5],
  ["sidebar link (active)", t["sidebar-foreground"], t["sidebar-active"], 4.5],
  ["sidebar brand text", t["sidebar-foreground"], t.sidebar, 4.5],
  ["sidebar muted text on active row (hover)", t["sidebar-muted"], t["sidebar-active"], 4.5],
  ["focus ring on canvas (non-text)", t.ring, t.background, 3],
  ["focus ring on card (non-text)", t.ring, t.card, 3],
  ["sidebar focus ring on sidebar (non-text)", t["sidebar-ring"], t.sidebar, 3],
  ["sidebar focus ring on active row (non-text)", t["sidebar-ring"], t["sidebar-active"], 3],
  ["input border on card (non-text)", t.input, t.card, 3],
  ["progress fill: ok on track", t.success, t.muted, 3],
  ["progress fill: warning on track", t.warning, t.muted, 3],
  ["progress fill: over on track", t.destructive, t.muted, 3],
  ["brand (chart/graphic) on card", t.brand, t.card, 3],
  ["chart series 1 on card", t["chart-1"], t.card, 3],
  ["chart series 2 on card", t["chart-2"], t.card, 3],
  ["chart series 3 on card", t["chart-3"], t.card, 3],
  ["chart series 4 on card", t["chart-4"], t.card, 3],
  ["chart series 5 on card", t["chart-5"], t.card, 3],
  ["chart series 6 on card", t["chart-6"], t.card, 3],
];

let fail = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n== ${name} ==`);
  for (const [label, fg, bg, min] of pairs(t, name)) {
    if (!fg || !bg) {
      console.log(`MISSING token for: ${label}`);
      fail++;
      continue;
    }
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) fail++;
    console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(5)} (min ${min}) ${label}`);
  }
}
console.log(`\n${fail === 0 ? "All pairs pass." : `${fail} pair(s) FAIL.`}`);
process.exit(fail ? 1 : 0);
