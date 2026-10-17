# Validation record

Initial launch checked on 2026-10-17 using Windows, Node.js 24.13.0, Next.js 16.4.2, React 19.3.1 and Playwright 1.64.1.

- `npm run lint`: clean, no warnings.
- `npm run typecheck`: passed.
- `npm run build`: static export passed, including Windows RSC filename normalization.
- `npm test`: 26 passed, 0 failed, 0 skipped across desktop Chromium and mobile Chromium emulation.
- Browser checks cover all local routes, asset errors, clipboard success/rejection, search/empty results, keyboard tabs, navigation, downloads, real 404 responses, reduced motion and 320–1920px layouts.
- Automated axe WCAG A/AA checks passed for the home page, five developer guides, brand page and search dialog at desktop/mobile sizes. This is automated coverage, not a manual accessibility certification.
- `npm audit`: 0 known vulnerabilities across the installed dependency tree.
- Lighthouse mobile simulation against the compressed local production preview: **96 performance / 100 accessibility / 100 best practices / 100 SEO**. FCP 0.9s, LCP 2.7s, TBT 50ms, CLS 0. This is a local lab result, not field data or a promise about the public CDN.

The GitHub Pages workflow independently installs from the lockfile, lints, type-checks, builds and runs the same browser suite on Linux before deployment. Inspect the repository's Actions history for the exact deployed revision.

## Responsive follow-up

- Added a proportional layout scale for large screens, growing the content area from 1240px at 1440px viewport width to 2480px at native 3840px 4K width. Typography, spacing and artwork scale together; content remains centered and bounded.
- Enlarged mobile search, menu and copy targets to at least 44×44px, increased primary body copy, and stacked calls to action on narrow phones.
- Added a dedicated 3840×2160 Playwright project. The complete suite now passes **45 tests** across desktop, mobile and 4K, including all page routes and automated accessibility checks. Home reflow is checked at 320, 360, 375, 680, 768, 1024, 1920, 2560, 3440 and 3840px.
- New layout checks failed on the previous design (1240px content on 4K and a 16px search target) and passed after the update. The production build, type check and lint are clean.
- Visually inspected screenshots at 320×844, 390×844, 2560×1440 and 3840×2160, including the 4K documentation layout. Earlier Lighthouse numbers above describe the initial launch; they were not remeasured for this CSS update.

## Themes and studio footer follow-up

- Added the OXOGNET studio mark, company introduction and verified ecosystem project links, adapted from the NineDeploy footer and the current OXOGNET project catalog.
- Added System/Light/Dark selection, pre-hydration saved preferences, cross-tab updates and CSS system-theme support without JavaScript. Storage-blocked switching and native keyboard selection were exercised.
- `npm run lint`, `npm run typecheck` and `npm run build` passed. The complete suite passed **66 tests**, with zero failures/skips across desktop, mobile and 4K projects. Both themes pass automated WCAG A/AA checks on home, five guides, brand assets and search.
- Inspected light/dark footer screenshots and dark home/brand/mobile layouts. Studio and header controls fit 320–3840px; no dependency was added.

## Upstream database sample

The complete in-memory quickstart was run using Go 1.27.0 on Windows against upstream CobaltDB commit `ed947ca8e7ba4d950fff02ec532dc5cb4cfba201`; it printed `Hello, CobaltDB!`.

A separate persistent-mode smoke check with `engine.Open("app.db", nil)` failed on this Windows host with `failed to sync database directory: sync .: Access is denied`. This is an observed upstream database/filesystem issue, outside the website implementation. The in-memory quickstart passed; this record does not certify persistent-mode or database production readiness. No database repository code was changed.
