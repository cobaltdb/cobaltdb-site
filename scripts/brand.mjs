import { create } from "fontkit";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const bytes = await readFile(
  "node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
);
const font = create(bytes);
function textPath(text, x, baseline, size, color, tracking = 0) {
  const run = font.layout(text);
  const scale = size / font.unitsPerEm;
  let cursor = x;
  const paths = run.glyphs.map((glyph, i) => {
    const p = run.positions[i];
    const path = `<path transform="translate(${cursor + p.xOffset * scale} ${baseline - p.yOffset * scale}) scale(${scale} ${-scale})" d="${glyph.path.toSVG()}"/>`;
    cursor += p.xAdvance * scale + tracking;
    return path;
  });
  return `<g fill="${color}">${paths.join("")}</g>`;
}
const mark = (await readFile("public/logo-mark.svg", "utf8")).replace(
  /<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g,
  "",
);
const signature = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 80" fill="none"><title>CobaltDB</title><desc>CobaltDB database and gear mark with outlined wordmark.</desc><g transform="translate(0 6)">${mark}</g>${textPath("CobaltDB", 77, 57, 55, "#174da6", -2)}</svg>`;
await writeFile("public/logo.svg", signature);
function cube(x, y, label) {
  return `<g transform="translate(${x} ${y})">
    <path d="M0 18v38l38 19V37Z" fill="#162d51" stroke="#41618f"/>
    <path d="m38 37 38-19v38L38 75Z" fill="#11223c" stroke="#41618f"/>
    <path d="M0 18 38-1 76 18 38 37Z" fill="#223e65" stroke="#5c7daf"/>
    <g transform="matrix(.9 .45 -.9 .45 24 9)">${textPath(label, 0, 16, 20, "#c3d8ff", -0.5)}</g>
  </g>`;
}
function badge(x, width, label) {
  return `<g transform="translate(${x} 472)">
    <rect width="${width}" height="35" rx="17.5" fill="#111e34" stroke="#2e4365"/>
    <circle cx="17" cy="17.5" r="3" fill="#88adff"/>
    ${textPath(label, 29, 22, 13, "#b9c9e3", 0.25)}
  </g>`;
}
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <defs>
    <radialGradient id="glow"><stop stop-color="#1d48a0" stop-opacity=".4"/><stop offset="1" stop-color="#09111f" stop-opacity="0"/></radialGradient>
    <linearGradient id="side" x1="797" y1="280" x2="1010" y2="460" gradientUnits="userSpaceOnUse"><stop stop-color="#245dea"/><stop offset="1" stop-color="#123da8"/></linearGradient>
    <linearGradient id="top" x1="790" y1="250" x2="1020" y2="350" gradientUnits="userSpaceOnUse"><stop stop-color="#7398ff"/><stop offset="1" stop-color="#4673f1"/></linearGradient>
    <linearGradient id="grid-fade"><stop stop-color="white" stop-opacity="0"/><stop offset=".45" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity=".3"/></linearGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .5 -1 .5 910 100)"><path d="M44 0H0v44" stroke="#2b466c" stroke-width=".8"/></pattern>
    <mask id="grid-mask"><rect x="650" y="105" width="550" height="470" fill="url(#grid-fade)"/></mask>
  </defs>
  <rect width="1200" height="630" fill="#09111f"/>
  <ellipse cx="970" cy="320" rx="430" ry="350" fill="url(#glow)"/>
  <rect x="650" y="105" width="550" height="470" fill="url(#grid)" mask="url(#grid-mask)"/>
  <path d="M64 568h1072" stroke="#23324a"/>
  <g transform="translate(64 47) scale(.9)">${mark.replaceAll("#174da6", "#a6c6ff")}${textPath("CobaltDB", 78, 49, 47, "#eef4ff", -1.8)}</g>
  ${textPath("EMBEDDED / STANDALONE", 67, 187, 13, "#9db7df", 1.8)}
  ${textPath("Small footprint.", 62, 280, 76, "#f0f5ff", -3.2)}
  ${textPath("Serious database.", 62, 367, 76, "#8eafff", -3.2)}
  ${textPath("Pure Go. Real SQL. Your architecture.", 66, 429, 25, "#a9bad4", -0.45)}
  ${badge(66, 126, "SQL + JSON")}${badge(204, 133, "ACID + WAL")}${badge(349, 120, "ZERO CGO")}
  ${textPath("cobaltdb.dev", 66, 600, 18, "#c3d4ed", -0.2)}
  ${textPath("OPEN SOURCE  /  MIT LICENSE", 874, 600, 13, "#8fa6c9", 0.4)}
  <g stroke="#456493" stroke-width="1.5"><path d="m783 235 55 28v52l42 21"/><path d="m991 300 97-48v-53"/><path d="m983 420 99 49v-38"/><path d="M920 250v-72l-65-32"/></g>
  <g fill="#6997ff"><circle cx="838" cy="288" r="3"/><circle cx="1088" cy="229" r="3"/><circle cx="1043" cy="450" r="3"/></g>
  <path d="m746 438 148-74 150 75v17l-150 76-148-76Z" fill="#12223d" stroke="#3e5c86"/>
  <path d="m746 438 148-74 150 75-150 75Z" fill="#203c64" stroke="#5075a8"/>
  <path d="m770 438 124-62 125 63-125 62Z" fill="#172c4d" stroke="#3e618c"/>
  <path d="M797 295v121c0 27 44 49 98 49s98-22 98-49V295" fill="url(#side)" stroke="#2759ce"/>
  <ellipse cx="895" cy="295" rx="98" ry="49" fill="url(#top)" stroke="#a1bcff"/>
  <ellipse cx="895" cy="295" rx="77" ry="37" stroke="#bdcfff" stroke-opacity=".7"/>
  <ellipse cx="895" cy="295" rx="57" ry="26" stroke="#cedbff" stroke-opacity=".6"/>
  <path d="M797 337c0 27 44 49 98 49s98-22 98-49M797 376c0 27 44 49 98 49s98-22 98-49" stroke="#86a8ff" stroke-opacity=".6"/>
  <path d="M814 335v23m0 17v23m0 16v12" stroke="#a9c2ff" stroke-width="3" stroke-linecap="round"/>
  <g transform="translate(866 279)" stroke="#f4f7ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 0-14 13 15 7m29-20 14 13-14 7M33-4 24 25"/></g>
  <circle cx="972" cy="414" r="4" fill="#a4efd0"/>
  ${textPath("COBALTDB", 858, 448, 10, "#d1e0ff", 1.8)}
  ${cube(734, 187, "Go")}${cube(1050, 148, "SQL")}${cube(1044, 382, "{ }")}
</svg>`;
await sharp(Buffer.from(og))
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile("public/og.png");
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84"><rect width="84" height="84" rx="18" fill="#f8faff"/><g transform="translate(10 10)">${mark}</g></svg>`;
await sharp(Buffer.from(icon))
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");
console.log("Generated outlined SVG logo, social image and Apple icon.");
