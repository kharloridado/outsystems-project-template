#!/usr/bin/env node
/* gen-icomoon.mjs — emit IcoMoon-importable selection.json, one per Font Awesome style.
 *
 * Goal: make the self-hosted Font Awesome 6 Pro icon collection MAINTAINABLE in IcoMoon.
 * Each output is a selection.json you import at icomoon.io/app; from there a developer can
 * add / remove / replace glyphs and re-export the font — no Node pipeline required. Because
 * IcoMoon's import format carries the actual SVG path of every glyph, this is also the only
 * artifact that reproduces the icons independently of the woff2 faces.
 *
 * THREE files (one per style) — solid / regular / light — because all three styles share the
 * SAME Font Awesome codepoint per icon, and a single font can't hold three glyphs on one
 * code. Splitting by style lets each file preserve FA's NATIVE codepoint (\f007 = user), so
 * an IcoMoon-regenerated font stays drop-in compatible with existing `fa-*` / `content:"\fXXX"`
 * usage across the Blocks.
 *
 * Inputs:
 *   vendor/fontawesome-6/icon-manifest.json      (committed) — the SHIPPED set: rows
 *                                                 { n:name, l:label, s:styleFlags "srl",
 *                                                 u:unicode-hex, t?:[terms] }. Defines which
 *                                                 icons/styles to emit.
 *   vendor/fontawesome-6/metadata/icons.json     (NOT committed — 34 MB; copy it from the
 *                                                 Pro desktop package, same prereq as
 *                                                 gen:fa-css) — geometry: icons[name].svg[style]
 *                                                 = { path, width, height:512 }.
 * Outputs (gitignored dist/ — the paths are LICENSED FA Pro artwork, never committed):
 *   dist/icomoon/loop-fa-solid.selection.json
 *   dist/icomoon/loop-fa-regular.selection.json
 *   dist/icomoon/loop-fa-light.selection.json
 *
 * LOSSLESS invariant (no path transform): every FA glyph is 512 tall; widths vary
 * (512/640/448/576/384/320/256/192); ~38% of paths contain arc commands (A/a) whose flags
 * corrupt under naive numeric scaling. So the IcoMoon canvas is height:512 AND emSize:512
 * (equal ⇒ IcoMoon never rescales), each icon carries its own icon.width, and the FA `path`
 * is used VERBATIM. FA path is y-down in a 0..512 box; IcoMoon stores y-down in a canvas of
 * `height`; height==512 ⇒ identity mapping, no flip, no scale.
 *
 * License: Font Awesome Pro (Commercial) — do NOT redistribute; outputs stay in dist/.
 *
 * Usage: node build/gen-icomoon.mjs [--minify]   (npm run gen:icomoon) */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = join(root, "vendor", "fontawesome-6");
const manifestFile = join(vendorDir, "icon-manifest.json");
const iconsFile = join(vendorDir, "metadata", "icons.json");
const outDir = join(root, "dist", "icomoon");

const MINIFY = process.argv.includes("--minify");

/* style flag → { icons.json svg key, family suffix, nominal FA weight } */
const STYLES = [
  { flag: "s", key: "solid", label: "Solid", weight: 900 },
  { flag: "r", key: "regular", label: "Regular", weight: 400 },
  { flag: "l", key: "light", label: "Light", weight: 300 },
];

const HEIGHT = 512; // FA canvas == emSize, so paths are used verbatim (never rescaled)
const GRID = 0; // freeform imported path, not snapped to a design grid
const PREVIEW = 32; // IcoMoon UI preview size

if (!existsSync(manifestFile)) {
  console.error(`missing ${manifestFile} — the committed slim FA manifest. Run npm run gen:icon-data first.`);
  process.exit(1);
}
if (!existsSync(iconsFile)) {
  console.error(
    `missing ${iconsFile}\n` +
      "Copy metadata/icons.json from the Font Awesome Pro desktop package there first\n" +
      "(it is gitignored — 34 MB; see vendor/fontawesome-6/README.md)."
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const icons = JSON.parse(readFileSync(iconsFile, "utf8"));

mkdirSync(outDir, { recursive: true });

for (const style of STYLES) {
  const entries = [];
  let skipped = 0;
  let idx = 0;

  for (const row of manifest) {
    if (!row.s.includes(style.flag)) continue; // icon doesn't ship this style
    const svg = icons[row.n] && icons[row.n].svg && icons[row.n].svg[style.key];
    if (!svg || !svg.path) {
      console.warn(`gen:icomoon ${style.key}: skip ${row.n} (no svg.${style.key} path)`);
      skipped++;
      continue;
    }
    const code = parseInt(row.u, 16); // preserve FA's native codepoint
    const tags = [...new Set([row.n, row.l, ...(row.t || [])].filter(Boolean))];
    entries.push({
      icon: {
        paths: [svg.path], // verbatim, single combined d-string
        attrs: [],
        isMulticolor: false,
        tags,
        grid: GRID,
        width: svg.width, // per-glyph advance — the lossless width mechanism
      },
      attrs: [],
      properties: {
        id: idx,
        order: idx + 1,
        prevSize: PREVIEW,
        code, // FA native codepoint (decimal)
        name: row.n,
      },
      setIdx: 0,
      setId: 0,
      iconIdx: idx,
    });
    idx++;
  }

  const doc = {
    IcoMoonType: "selection",
    icons: entries,
    height: HEIGHT,
    metadata: { name: `loop-fa-${style.key}` },
    preferences: {
      showGlyphs: true,
      showQuickUse: true,
      showQuickUse2: true,
      showSVGs: true,
      fontPref: {
        prefix: "fa-",
        // Family avoids redeclaring the controlled 'Font Awesome 6 Pro' family (CLAUDE.md).
        // Alternative if upstream-recognizable names are preferred: "Font Awesome 6 Pro <Style>".
        metadata: { fontFamily: `Loop FA ${style.label}`, majorVersion: 1, minorVersion: 0 },
        // baseline 12.5 = FA's 64/512 descent ratio (IcoMoon-Free uses 6.25 for its 1024 em).
        // emSize == HEIGHT is the invariant that stops IcoMoon rescaling the paths.
        metrics: { emSize: HEIGHT, baseline: 12.5, whitespace: 0 },
        embed: false,
      },
    },
  };

  const outFile = join(outDir, `loop-fa-${style.key}.selection.json`);
  const json = MINIFY ? JSON.stringify(doc) : JSON.stringify(doc, null, 2);
  writeFileSync(outFile, json + "\n");
  const kb = Math.round(json.length / 1024);
  console.log(`gen:icomoon → dist/icomoon/loop-fa-${style.key}.selection.json (${entries.length} icons, ${skipped} skipped, ${kb}KB)`);
}
