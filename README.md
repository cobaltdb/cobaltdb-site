# CobaltDB website

The CobaltDB product website and developer guides. Next.js App Router, React, TypeScript, self-hosted variable fonts, Motion, and original SVG artwork. Fully static, deployed to GitHub Pages at **https://cobaltdb.dev**.

## Development

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

## Verification and preview

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
npm run preview
```

The production output is `out/`. The preview serves that exact output at http://localhost:3000, including real 404 responses. Browser tests run desktop, mobile and native 3840×2160 4K profiles and cover responsive layouts, navigation, search and empty states, copy success/failure, code and query tabs, downloads, keyboard interaction, reduced motion, asset/link integrity, and axe accessibility checks. Layout checks span 320–3840px.

If port 3000 is occupied, set `PORT` for both the preview and Playwright (PowerShell: `$env:PORT='3037'`). Check that the preview is serving CobaltDB before reusing a running server.

The build includes a small Windows export normalization for [Next.js #85374](https://github.com/vercel/next.js/issues/85374). It copies nested RSC segment output to the flat filenames requested by the browser, preserving originals. On Linux this step is a no-op. The browser asset check guards this behavior.

## Content and brand

The header's appearance control shows the current preference and opens **Light**, **Dark**, and **System** preview cards. Native radio controls support arrow keys and instant preview; Escape restores focus, and clicking or tabbing outside dismisses the panel. The control uses an icon on smaller screens and keeps a consistent reading scale on larger displays. A saved preference is applied before hydration, synchronizes across tabs, and survives navigation/reloads. With no preference (or no JavaScript), CSS follows the operating system. Storage failures do not prevent switching themes for the current page. Theme colors and SVG illustration tokens live in `src/app/themes.css`; the footer's OXOGNET studio card lives in `src/components/studio.tsx`.

All pages share a fluid `.container` / `.header-inner` shell, capped at **1728px**. There is no viewport-driven root font scaling. Header, main sections, documentation, brand assets and footer use the same horizontal edges. Shared variables in `src/app/globals.css` control the maximum width, fluid side gutters, grid gaps, section spacing, panel padding and a 64ch prose measure.

| Viewport | Container | Side margin |
| -------- | --------- | ----------- |
| 375px    | 327px     | 24px        |
| 768px    | 716.8px   | 25.6px      |
| 1024px   | 955.7px   | 34.1px      |
| 1440px   | 1344px    | 48px        |
| 1920px   | 1728px    | 96px        |
| 2560px   | 1728px    | 416px       |

At wider breakpoints, feature cards stack beside the architecture panel, query editing/results can share a row, documentation guides form an adaptive card grid, and studio projects use two columns. Documentation prose stays bounded while code blocks and tables use the article area. Browser checks cover all eight public page routes at the six viewport widths above, plus the native 4K composition and existing small-phone checks.

The OXOGNET footer mark draws its four strokes once when it enters the viewport, using NineDeploy's signature timing (1.6 seconds per stroke, staggered through 2.5 seconds). Reduced motion and JavaScript-disabled visits show the complete static mark. The animation lives in `src/components/oxog-mark.tsx` and `src/app/themes.css`.

The hero's full-width data fabric is a dependency-free Canvas 2D client component; the copy and database illustration remain server rendered. `HERO_SCENE` in `src/lib/hero-scene.ts` controls density, palettes, pointer falloff, speeds, idle behavior and effect budgets. Query routes and records react locally to the pointer. Empty-space clicks produce bounded isometric write pulses; controls, text selection, swipes and canceled touches do not. The scene fades behind the measured copy area and at its edges, uses fewer objects on phones, caps DPR at 1.75 and the backing store at six million pixels, slows when idle, and pauses offscreen or in hidden tabs. Reduced motion draws a static composition. Browser tests exercise burst expiry, paint budgets, touch filtering, live theme/motion changes, pause/resume and navigation cleanup.

- `src/lib/site.ts`: links, version, snippets and search entries.
- `src/lib/docs.tsx`: source-aligned local developer guides.
- `src/components/database-art.tsx`: original isometric SVG hero illustration.
- `public/logo.svg`: fully outlined wordmark, no font dependency.
- `public/logo-mark.svg`: editable database/gear vector mark.
- `scripts/brand.mjs`: regenerates the signature, Open Graph image and Apple icon.

Run `npm run brand` after changing the brand source. Website examples and guides are editorial summaries of the upstream database repository, not an independent certification of database behavior. Benchmarks are explicitly attributed to upstream, with hardware and in-memory methodology. Illustrative sample data is labeled.

## GitHub Pages

`.github/workflows/deploy.yml` installs from the lockfile, lints, type-checks, builds, runs Chromium browser tests, and publishes only after checks pass. Set **Settings → Pages → Source → GitHub Actions**. The custom domain must be **cobaltdb.dev**; the same value is tracked in `public/CNAME`.

The apex DNS A records should point to GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Enable HTTPS after GitHub provisions the domain certificate. Only one Pages repository can claim this custom domain at a time.

The site intentionally uses root URLs for the custom domain. Repository-subpath hosting without this domain requires an explicit Next.js `basePath` configuration and corresponding asset URL updates.

## License

MIT. Font license notices are included with the installed Fontsource packages and bundled font assets. The CobaltDB name and mark identify the project.
