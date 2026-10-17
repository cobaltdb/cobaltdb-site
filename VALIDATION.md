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

## Wider 4K composition follow-up

- Increased the main content width from 2480px to **3040px** at 3840×2160, with proportionally bounded widths at 1920, 2560 and 3072px. These viewport widths cover common CSS viewport sizes produced by 4K display scaling.
- Large-screen introductory text is 32px and section copy is 30px at native 4K. Enlarged controls, code samples, navigation and footer text; kept the existing mobile rules and bounded documentation reading width.
- The OXOGNET card now uses a wider composition and a two-column project grid on large viewports. Inspected native 4K screenshots in both themes.
- The expanded width checks failed on the previous design (2480px and a one-column studio project list), then passed after this update.
- Lint, type check and production build passed. `npx playwright test --workers=2` passed **69 tests**, zero failures/skips. The earlier four-worker run had two unexpected worker-process exits before those tests executed; the complete suite was rerun with the same concurrency as CI, without weakening assertions or adding retries.

## Upstream database sample

The complete in-memory quickstart was run using Go 1.27.0 on Windows against upstream CobaltDB commit `ed947ca8e7ba4d950fff02ec532dc5cb4cfba201`; it printed `Hello, CobaltDB!`.

A separate persistent-mode smoke check with `engine.Open("app.db", nil)` failed on this Windows host with `failed to sync database directory: sync .: Access is denied`. This is an observed upstream database/filesystem issue, outside the website implementation. The in-memory quickstart passed; this record does not certify persistent-mode or database production readiness. No database repository code was changed.

## Appearance picker follow-up

- Replaced the invisible native select with a labeled appearance button and Light/Dark/System preview cards. The selected preference is visible in the trigger and cards; changing a card previews the theme immediately while the panel stays open.
- Used native radio keyboard behavior, selected-option focus on opening, Escape focus restoration, and outside pointer/focus dismissal. Preserved saved preferences, OS appearance, cross-tab updates, pre-hydration initialization and storage-blocked operation.
- Verified open-panel bounds and 44px choice targets at 320, 390, 768, 1024, 1440 and 3840px. Inspected light/dark screenshots at 390, 1440 and 3840px. Reduced motion disables the panel animation.
- Formatting, lint, type check and production build passed. The full browser suite passed **75 tests**, zero failures/skips, with two workers across desktop, mobile and 4K. Added keyboard/dismissal and open-panel accessibility coverage; both settled palettes pass automated WCAG A/AA checks. Existing all-page, persistence and storage-error checks remain in the suite.

## OXOGNET signature animation follow-up

- Matched NineDeploy's four-stroke signature animation: 1.6-second drawing with 0, 0.25, 0.5 and 0.9-second delays. An intersection observer starts it on first view and disconnects; scrolling back does not replay it.
- The server-rendered SVG remains complete without JavaScript or intersection-observer support. Reduced-motion styling exposes all strokes immediately, including if the preference changes while drawing.
- The new viewport/replay check failed against the previous static mark and passed after the update. Lint, type check and production build passed; **78 browser tests passed**, zero failures/skips, across desktop, mobile and native 4K with two workers. Coverage includes first-view drawing, completed strokes on return, reduced motion and the JavaScript-disabled fallback.

## Fluid layout revision — 2026-10-18

This revision supersedes the earlier proportional 3040px / root-font scaling approach above. The current requirement caps the main composition in the 1680–1750px range.

- Unified `.container` and `.header-inner` around a fluid shell capped at **1728px**, with shared gutter, gap, section-space, panel-space and prose-measure variables. Removed competing header/docs max-width limits, viewport-driven root font scaling and illustration oversizing.
- Measured container widths of **327, 716.8, 955.7, 1344, 1728 and 1728px** at **375, 768, 1024, 1440, 1920 and 2560px** respectively. All eight public page routes share the header/footer horizontal edges and have zero horizontal document overflow at these widths.
- Wide feature cards sit beside the architecture panel, the query editor/results adapt into columns, the documentation index uses responsive guide cards, and OXOGNET projects use two columns. Paragraphs retain a 64ch limit while documentation code/tables can use the wider article area. Mobile action spacing avoids an unnecessary row break at 375px and keeps 44px control targets.
- The new layout checks failed on the previous design (including a 40px header/main alignment mismatch at 1440px). The expanded mobile-row check also reproduced its wrap before the final spacing adjustment, then passed afterward.
- Lint, type check, formatting and production export passed. The complete suite passed **78 tests**, zero failures/skips, across desktop, mobile and 4K. After the final mobile spacing adjustment, the **9** focused layout, prose/grid and narrow-phone checks passed again across all three profiles. Both themes retain automated WCAG A/AA coverage. Inspected light/dark captures at all six requested widths, plus guide, query, feature and studio layouts.
