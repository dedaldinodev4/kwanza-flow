import { describe, expect, it } from "vitest";
import { findUntranslated, sourceFiles } from "./source-scan";

/**
 * Guards against English creeping back in: user-facing text must go through t() (or msg() for messages produced by
 * pure code and translated where they are shown). The scanner reads the real syntax tree of every source file.
 */
describe("no untranslated user-facing text in the source", () => {
  const SKIP = ["i18n/", "test/", "mocks/"]; // the i18n module itself, test helpers, and the sample data (its own namespace)
  const findings = sourceFiles()
    .filter((f) => !SKIP.some((s) => f.includes(`/src/${s}`)))
    .flatMap(findUntranslated);

  it("finds none", () => {
    const report = findings.map((f) => `${f.file}:${f.line}  [${f.kind}]  ${f.text}`);
    expect(report, `${report.length} untranslated string(s):\n${report.join("\n")}`).toEqual([]);
  });
}); 
