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
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f8faff"/><defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" stroke="#dce5f6" fill="none"/></pattern></defs><rect x="770" width="430" height="630" fill="url(#g)"/><g transform="translate(70 58) scale(.76)">${mark}${textPath("CobaltDB", 79, 48, 46, "#174da6", -1.5)}</g>${textPath("Small footprint.", 70, 276, 81, "#202b42", -3.3)}${textPath("Serious database.", 70, 369, 81, "#2456ca", -3.3)}${textPath("Pure Go. Real SQL. Your architecture.", 74, 435, 27, "#687b98", -0.4)}${textPath("cobaltdb.dev", 74, 560, 20, "#5e7aa7", -0.2)}<g transform="translate(907 200)"><path d="M0 42v146c0 24 38 43 85 43s85-19 85-43V42" fill="#2457d4"/><ellipse cx="85" cy="42" rx="85" ry="42" fill="#4c7cf0" stroke="#8aacf9"/><ellipse cx="85" cy="42" rx="65" ry="30" fill="none" stroke="#91b3ff"/><ellipse cx="85" cy="42" rx="45" ry="20" fill="none" stroke="#b7ceff"/><path d="M0 89c0 24 38 43 85 43s85-19 85-43M0 139c0 24 38 43 85 43s85-19 85-43" fill="none" stroke="#82a5ff"/></g></svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og.png");
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84"><rect width="84" height="84" rx="18" fill="#f8faff"/><g transform="translate(10 10)">${mark}</g></svg>`;
await sharp(Buffer.from(icon))
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");
console.log("Generated outlined SVG logo, social image and Apple icon.");
