// Verifies WCAG 2.2 contrast for the KwanzaFlow design tokens.
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
const T = {
  light: {
    bg: "#F7F8F6",
    card: "#FFFFFF",
    fg: "#202923",
    muted: "#5A665E",
    border: "#DCE3DE",
    primary: "#102D26",
    onPrimary: "#FFFFFF",
    emerald: "#16A36A",
    success: "#0E7A4F",
    danger: "#B54745",
    warning: "#8A5A00",
    warningBg: "#FBF1DC",
    secondary: "#EDF1EE",
    ring: "#0E7A4F",
    inputBorder: "#8A978F",
  },
  dark: {
    bg: "#0B1411",
    card: "#111D18",
    fg: "#E7EDE9",
    muted: "#9DAAA2",
    border: "#22332C",
    primary: "#3DD598",
    onPrimary: "#0B1411",
    emerald: "#3DD598",
    success: "#3DD598",
    danger: "#EF8A87",
    warning: "#E8B04B",
    warningBg: "#2A2111",
    secondary: "#18271F",
    ring: "#3DD598",
    inputBorder: "#5E7168",
  },
};
// [label, fg, bg, minimum]
const pairs = (t) => [
  ["body text on canvas", t.fg, t.bg, 4.5],
  ["body text on card", t.fg, t.card, 4.5],
  ["muted text on canvas", t.muted, t.bg, 4.5],
  ["muted text on card", t.muted, t.card, 4.5],
  ["muted text on secondary", t.muted, t.secondary, 4.5],
  ["button text on primary", t.onPrimary, t.primary, 4.5],
  ["income/success text on card", t.success, t.card, 4.5],
  ["expense text on card", t.danger, t.card, 4.5],
  ["warning text on warning bg", t.warning, t.warningBg, 4.5],
  ["focus ring on canvas (non-text)", t.ring, t.bg, 3],
  ["input border on card (non-text)", t.inputBorder, t.card, 3],
  ["raw emerald on card (non-text)", t.emerald, t.card, 3],
];
let fail = 0;
for (const [name, t] of Object.entries(T)) {
  console.log(`\n== ${name} ==`);
  for (const [label, f, b, min] of pairs(t)) {
    const r = ratio(f, b);
    const ok = r >= min;
    if (!ok) fail++;
    console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(5)} (min ${min}) ${label}`);
  }
}
console.log(
  `\nRaw brief colors on white: emerald #16A36A = ${ratio("#16A36A", "#FFFFFF").toFixed(2)}, red #B54745 = ${ratio("#B54745", "#FFFFFF").toFixed(2)}, border #DCE3DE = ${ratio("#DCE3DE", "#FFFFFF").toFixed(2)}`,
);
process.exit(fail ? 1 : 0);
