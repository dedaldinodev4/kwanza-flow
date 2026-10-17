# Verification record

What was run against the final production build, how, and what it showed. Nothing here is a claim about code that
was not executed; the last section lists what was **not** verified.

## Environment (important for reading the numbers)

- A sandbox container with **1 CPU core**, Node 22, Next.js 16.4, Chromium 153 (installed from the
  `@sparticuz/chromium` npm package because the sandbox blocks Playwright's browser download), Playwright 1.64,
  axe-core 4.13 via `@axe-core/playwright`, Lighthouse 13.5.
- Server, browser and test runner shared that one core. Timings are therefore pessimistic. Uncontended, a page load
  measured first paint ≈ 200 ms, KPIs visible ≈ 600 ms, chart visible ≈ 1 s.
- Every browser run used a **clean** production build (`rm -rf .next && npm run build`) and a server started by the
  test run itself. A stale server left on the port earlier produced misleading 404s until the runner was made to
  refuse a busy port.

## Results

| Check                          | Command / method                                                                                                                         | Result                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Formatting, lint, types        | `npm run format:check`, `lint`, `typecheck`                                                                                              | all exit 0, no warnings                                                              |
| Design-token contrast          | `npm run contrast` (reads `globals.css`)                                                                                                 | 33 pairs × 2 themes pass                                                             |
| Unit / component / integration | `npm test` (Vitest, jsdom)                                                                                                               | **454 passed**, 47 files, 0 warnings                                                 |
| Production build               | `npm run build`                                                                                                                          | passes; all routes prerender                                                         |
| E2E user journeys              | Playwright, desktop + Pixel 7 profile                                                                                                    | **20 passed**                                                                        |
| E2E layout and keyboard        | Playwright                                                                                                                               | **20 passed** (20 skipped by design: each test runs on one profile)                  |
| Accessibility scan             | axe-core, WCAG 2.2 A/AA + best practices, 5 pages + dialogs (with validation errors, delete confirmation), light and dark, both profiles | **24 passed, 0 violations**                                                          |
| Lighthouse (desktop)           | overview, production build                                                                                                               | Perf **71**, A11y **100**, BP **100**, SEO **100**; LCP 1.5 s, TBT 590 ms, CLS 0.021 |
| Lighthouse (mobile preset)     | overview, production build                                                                                                               | Perf **69**, A11y **100**, BP **100**, SEO **100**; LCP 2.8 s, TBT 1,630 ms, CLS 0   |

The axe scanner was checked against a deliberately inaccessible page and reported missing button names, low
contrast, missing alt text and unlabeled inputs, so a clean result is meaningful.

**The Lighthouse Performance target (90+) was not met.** See the README for the reasoning and what still needs
measuring on real hardware.

## Defects found by running the app in a real browser

These were invisible to unit tests and jsdom:

1. **Mobile filters pushed all transactions off the first screen** (six stacked controls). Fixed: only search stays
   visible; the rest sits behind a toggle with an active-filter count.
2. **Chart axis labels collided on a phone** (and an intermediate "show every label" attempt made it worse). Fixed by
   shortening repeated month names after the first tick.
3. **Chart legend order** disagreed with the bars (Recharts 3 sorts it alphabetically). Fixed.
4. **"All goals" link wrapped** in the card header. Fixed.
5. **Dashboard blocked the main thread for ~2.9 s in Lighthouse.** Bar animation re-rendered the chart every frame,
   and both charts hydrated together with everything else. Fixed (animation off; charts mount when idle):
   Performance 41 → 71, LCP 4.1 s → 1.5 s, TBT 2,940 ms → 590 ms on desktop.
6. Earlier in the project, from contrast and a11y checks: a **sidebar focus ring at 2.75:1** (needs 3:1), a
   **Category error message not announced** (dangling `aria-describedby`), and a number-format option that looked
   identical to another.

## Test-suite quality

Beyond coverage, tests were validated by **mutation checks**: deliberately breaking the code (for example a
boundary comparison, the rounding rule for percentage shares, a retry guard, a focus-return call, the persistence
write) and confirming a test fails. Several tests were found too weak this way and strengthened. A passing suite
that cannot fail proves nothing.

## Not verified

- **Other browsers and real devices:** Firefox, Safari, iOS and Android were not tested; only Chromium (desktop and
  an emulated Pixel 7).
- **Screen readers:** no manual testing with NVDA, JAWS, VoiceOver or TalkBack. Automated tooling finds a
  fraction of accessibility problems.
- **The deployed app:** nothing was deployed. Performance on real hardware and a real CDN is unmeasured.
- **The CI workflow** (`.github/workflows/ci.yml`) has never run on GitHub.
- **Very large data sets:** the demo has about 180 transactions; behaviour with tens of thousands was not tested.
- **Multi-tab edge cases** are unit-tested (storage events), but were not exercised in two real tabs.

## Reproducing

```bash
npm ci
npm run verify
npx playwright install chromium
npm run e2e
```

In a sandbox without access to Playwright's CDN, point Playwright at any Chromium with
`PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium` and, if a server is already running on port 3100, `E2E_NO_SERVER=1`.
