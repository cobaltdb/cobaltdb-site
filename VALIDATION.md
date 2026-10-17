# Validation record

Checked on 2026-10-17 using Windows, Node.js 24.13.0, Next.js 16.4.2, React 19.3.1 and Playwright 1.64.1.

- `npm run lint`: clean, no warnings.
- `npm run typecheck`: passed.
- `npm run build`: static export passed, including Windows RSC filename normalization.
- `npm test`: 26 passed, 0 failed, 0 skipped across desktop Chromium and mobile Chromium emulation.
- Browser checks cover all local routes, asset errors, clipboard success/rejection, search/empty results, keyboard tabs, navigation, downloads, real 404 responses, reduced motion and 320–1920px layouts.
- Automated axe WCAG A/AA checks passed for the home page, five developer guides, brand page and search dialog at desktop/mobile sizes. This is automated coverage, not a manual accessibility certification.
- `npm audit`: 0 known vulnerabilities across the installed dependency tree.
- Lighthouse mobile simulation against the compressed local production preview: **96 performance / 100 accessibility / 100 best practices / 100 SEO**. FCP 0.9s, LCP 2.7s, TBT 50ms, CLS 0. This is a local lab result, not field data or a promise about the public CDN.

The GitHub Pages workflow independently installs from the lockfile, lints, type-checks, builds and runs the same browser suite on Linux before deployment. Inspect the repository's Actions history for the exact deployed revision.

## Upstream database sample

The complete in-memory quickstart was run using Go 1.27.0 on Windows against upstream CobaltDB commit `ed947ca8e7ba4d950fff02ec532dc5cb4cfba201`; it printed `Hello, CobaltDB!`.

A separate persistent-mode smoke check with `engine.Open("app.db", nil)` failed on this Windows host with `failed to sync database directory: sync .: Access is denied`. This is an observed upstream database/filesystem issue, outside the website implementation. The in-memory quickstart passed; this record does not certify persistent-mode or database production readiness. No database repository code was changed.
