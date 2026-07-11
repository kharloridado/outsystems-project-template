#!/usr/bin/env node
/* convert-fa-otf.mjs — convert Font Awesome 6 Pro desktop OTFs → vendor woff2.
 *
 * The designer-provided Pro package is the DESKTOP download (otfs/ + svgs/ + metadata/):
 * it ships no webfonts/ folder and no web CSS. This script produces the woff2 files the
 * rest of the pipeline expects (build-fontawesome.mjs copies them from
 * vendor/fontawesome-6/webfonts/), using wawoff2 (Google's woff2 encoder as WASM — CFF
 * 'OTTO' fonts are supported).
 *
 * One-time per FA version bump; the converted woff2 are committed. Styles shipped:
 * Solid 900 / Regular 400 / Light 300 (classic 'Font Awesome 6 Pro'). No Brands.
 *
 * Usage: node build/convert-fa-otf.mjs <path-to-pro-desktop-package>
 *   (the folder containing otfs/, e.g. .../fontawesome-pro-6.7.2-desktop) */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compress } from "wawoff2";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "vendor", "fontawesome-6", "webfonts");

const MAP = [
  ["Font Awesome 6 Pro-Solid-900.otf", "fa-solid-900.woff2"],
  ["Font Awesome 6 Pro-Regular-400.otf", "fa-regular-400.woff2"],
  ["Font Awesome 6 Pro-Light-300.otf", "fa-light-300.woff2"],
];

const pkg = process.argv[2];
if (!pkg) {
  console.error("Usage: node build/convert-fa-otf.mjs <path-to-fontawesome-pro-desktop-package>");
  process.exit(1);
}
const otfDir = join(resolve(pkg), "otfs");
if (!existsSync(otfDir)) {
  console.error(`No otfs/ folder under ${resolve(pkg)} — point at the Pro DESKTOP package root.`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const kb = (n) => `${Math.round(n / 1024)}KB`;
for (const [otf, woff2] of MAP) {
  const src = join(otfDir, otf);
  if (!existsSync(src)) throw new Error(`missing ${src}`);
  const input = readFileSync(src);
  const output = Buffer.from(await compress(input));
  writeFileSync(join(outDir, woff2), output);
  console.log(`convert:fa-otf → ${woff2} (${kb(input.length)} otf → ${kb(output.length)} woff2)`);
}
console.log(`convert:fa-otf → done, ${MAP.length} files in vendor/fontawesome-6/webfonts/`);
