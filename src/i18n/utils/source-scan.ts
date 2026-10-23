import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

/**
 * Static analysis of the app's source, shared by the i18n tests. It parses real TypeScript (not regexes), so
 * multi-line JSX, template literals and nested expressions are handled correctly.
 */
const ROOT = join(__dirname, "..");

export function sourceFiles(dir = ROOT): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) && !name.endsWith(".d.ts")
      ? [path]
      : [];
  });
}

export interface Finding {
  file: string;
  line: number;
  text: string;
  kind: string;
}

const hasLetters = (s: string) => /\p{L}/u.test(s);
const ATTRIBUTES = new Set([
  "aria-label",
  "aria-description",
  "placeholder",
  "title",
  "alt",
  "description",
  "confirmLabel",
  "legend",
  "hint",
]);
const MESSAGE_PROPS = new Set([
  "message",
  "error",
  "reason",
  "description",
  "label",
  "title",
  "hint",
]);
const VALIDATOR_CALLS = new Set(["min", "max", "regex", "refine", "email", "length"]);
/** Text that is deliberately not translated: the product name, units and symbols. */
const ALLOWED = new Set(["KwanzaFlow", "Kz", "K", "404", "AOA"]);

function textOf(node: ts.Node, source: ts.SourceFile): string {
  return node.getText(source).replace(/\s+/g, " ").slice(0, 80);
}

function isTranslatedCall(node: ts.Node): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    ["t", "msg"].includes(node.expression.text)
  );
}

/** Literal text inside an expression, ignoring anything already wrapped in t()/msg(). */
function literalsIn(node: ts.Node): ts.Node[] {
  if (isTranslatedCall(node)) return [];
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return hasLetters(node.text) ? [node] : [];
  if (ts.isTemplateExpression(node)) {
    const text = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join("");
    return hasLetters(text) ? [node] : [];
  }
  if (ts.isConditionalExpression(node))
    return [...literalsIn(node.whenTrue), ...literalsIn(node.whenFalse)];
  if (ts.isParenthesizedExpression(node)) return literalsIn(node.expression);
  if (
    ts.isBinaryExpression(node) &&
    [
      ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.QuestionQuestionToken,
      ts.SyntaxKind.AmpersandAmpersandToken,
    ].includes(node.operatorToken.kind)
  ) {
    return [...literalsIn(node.left), ...literalsIn(node.right)];
  }
  return [];
}

/** Next.js `metadata` objects are evaluated at build time (one language), so they cannot be translated per user. */
function isInsideStaticMetadata(node: ts.Node): boolean {
  for (let n: ts.Node | undefined = node; n; n = n.parent) {
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      ["metadata", "viewport"].includes(n.name.text)
    )
      return true;
  }
  return false;
}

export function findUntranslated(file: string): Finding[] {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings: Finding[] = [];
  const add = (node: ts.Node, kind: string) =>
    findings.push({
      file: relative(ROOT, file),
      line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      text: textOf(node, source),
      kind,
    });

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const trimmed = node.text.replace(/\s+/g, " ").trim();
      if (hasLetters(trimmed) && !ALLOWED.has(trimmed)) add(node, "JSX text");
    } else if (
      ts.isJsxAttribute(node) &&
      ATTRIBUTES.has(node.name.getText(source)) &&
      node.initializer
    ) {
      const init = node.initializer;
      if (ts.isStringLiteral(init) && hasLetters(init.text) && !ALLOWED.has(init.text))
        add(node, "attribute");
      if (ts.isJsxExpression(init) && init.expression)
        literalsIn(init.expression).forEach((n) => add(n, "attribute expression"));
    } else if (
      ts.isJsxExpression(node) &&
      node.parent &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) &&
      node.expression
    ) {
      literalsIn(node.expression).forEach((n) => {
        const literal =
          ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)
            ? n.text
            : n.getText(source);
        if (!ALLOWED.has(literal)) add(n, "JSX expression");
      });
    } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const callee = node.expression;
      if (
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === "toast" &&
        node.arguments[0]
      ) {
        literalsIn(node.arguments[0]).forEach((n) => add(n, "toast"));
      }
      if (VALIDATOR_CALLS.has(callee.name.text)) {
        node.arguments
          .slice(1)
          .forEach((a) => literalsIn(a).forEach((n) => add(n, "validation message")));
      }
    } else if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      MESSAGE_PROPS.has(node.name.text) &&
      !isInsideStaticMetadata(node)
    ) {
      // `label`/`title`/`description` are only user-facing in JSX props and message objects; flag string literals.
      literalsIn(node.initializer).forEach((n) =>
        add(n, `property "${node.name.getText(source)}"`),
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return findings;
}

/** Every string passed to t("…") or msg("…"): the keys the app can ask the translation files for. */
export function collectKeys(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const keys: string[] = [];
  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ["t", "msg"].includes(node.expression.text)
    ) {
      const arg = node.arguments[0];
      if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)))
        keys.push(arg.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return keys;
}
