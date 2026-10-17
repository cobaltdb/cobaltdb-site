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

The build includes a small Windows export normalization for [Next.js #85374](https://github.com/vercel/next.js/issues/85374). It copies nested RSC segment output to the flat filenames requested by the browser, preserving originals. On Linux this step is a no-op. The browser asset check guards this behavior.

## Content and brand

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
