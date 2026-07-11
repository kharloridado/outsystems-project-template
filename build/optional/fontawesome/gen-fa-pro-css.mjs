#!/usr/bin/env node
/* gen-fa-pro-css.mjs — generate vendor/fontawesome-6/css/all.css (Font Awesome 6 PRO).
 *
 * The designer-provided Pro package is the DESKTOP download — it ships no web all.css.
 * This script reconstructs it: the structural core (base classes, sizing, animations,
 * @font-face blocks for 'Font Awesome 6 Pro' solid 900 / regular 400 / light 300 +
 * 'Font Awesome 6 Brands' 400) lives in css/core-template.css, and the per-icon rules
 * (.fa-name { --fa: "\XXXX"; } — exact FA 6.7.2 format) are generated from FA's own
 * metadata/icons.json, including alias names.
 *
 * Inputs:
 *   vendor/fontawesome-6/css/core-template.css   (committed)
 *   vendor/fontawesome-6/metadata/icons.json     (NOT committed — 34 MB; copy it from
 *                                                 the Pro desktop package's metadata/)
 * Output:
 *   vendor/fontawesome-6/css/all.css — consumed by build-fontawesome.mjs as before.
 *
 * Usage: node build/gen-fa-pro-css.mjs  (npm run gen:fa-css) */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssDir = join(root, "vendor", "fontawesome-6", "css");
const templateFile = join(cssDir, "core-template.css");
const iconsFile = join(root, "vendor", "fontawesome-6", "metadata", "icons.json");
const outFile = join(cssDir, "all.css");

if (!existsSync(iconsFile)) {
  console.error(
    `missing ${iconsFile}\n` +
      "Copy metadata/icons.json from the Font Awesome Pro desktop package there first\n" +
      "(it is gitignored — 34 MB; see vendor/fontawesome-6/README.md)."
  );
  process.exit(1);
}

const template = readFileSync(templateFile, "utf8");
const icons = JSON.parse(readFileSync(iconsFile, "utf8"));

/* One rule per icon name AND per alias name, alias pointing at the same codepoint —
 * exactly how the upstream all.css does it (.fa-user-xmark / .fa-user-times → \f235).
 * Brands are NOT shipped (no brands font face) — brands-only icons are skipped. */
const rules = [];
let aliasCount = 0;
let brandsSkipped = 0;
for (const name of Object.keys(icons).sort()) {
  const e = icons[name];
  if ((e.styles || []).every((s) => s === "brands")) {
    brandsSkipped++;
    continue;
  }
  rules.push(`.fa-${name} {\n  --fa: "\\${e.unicode}"; }`);
  for (const alias of (e.aliases && e.aliases.names) || []) {
    rules.push(`.fa-${alias} {\n  --fa: "\\${e.unicode}"; }`);
    aliasCount++;
  }
}

const marker = "/* @@ICON_RULES@@ */";
if (!template.includes(marker)) throw new Error(`no ${marker} in ${templateFile}`);
const css = template.replace(marker, rules.join("\n\n"));
writeFileSync(outFile, css);
console.log(
  `gen:fa-css → vendor/fontawesome-6/css/all.css (${rules.length - aliasCount} icons + ${aliasCount} aliases = ${rules.length} rules, ${brandsSkipped} brands-only skipped, ${Math.round(css.length / 1024)}KB)`
);
