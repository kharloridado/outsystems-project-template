#!/usr/bin/env node
/* build-fontawesome.mjs — adapt the vendored Font Awesome 6 Pro CSS for ODC.
 *
 * Goal: make the ENTIRE Font Awesome 6 Pro icon set (Solid/Regular/Light — brands not shipped)
 * available in OutSystems ODC and usable as `<i class="fa-solid fa-user"></i>` —
 * self-hosted, exactly like the brand Open Sans faces (typography.css @font-face →
 * /TheLoopTheme/*.woff2, rewritten by ODC at compile time). NOT a CDN/kit dependency.
 *
 * Source of truth: vendor/fontawesome-6/css/all.css + vendor/fontawesome-6/webfonts/*.woff2.
 * The designer-provided Pro package is the DESKTOP download (no web CSS / webfonts), so
 * both inputs are themselves generated: all.css by build/gen-fa-pro-css.mjs (core template
 * + metadata/icons.json) and the woff2 by build/convert-fa-otf.mjs (Pro OTFs → woff2).
 * License: Font Awesome Pro (Commercial) — licensed asset, do NOT redistribute.
 *
 * Three transforms on all.css:
 *   1. DROP any legacy @font-face blocks — 'FontAwesome' (v4 name), 'Font Awesome 5
 *      Free' / 'Font Awesome 5 Brands'. We want v6 only, AND 'FontAwesome' is the very
 *      family OSUI's own Icon widget declares (vendor/.../_icon-library-odc.scss:
 *      --osui-icon-font-family: 'FontAwesome'). Re-declaring it here would clobber the
 *      native icon widget — so we keep ONLY the v6 family: 'Font Awesome 6 Pro'
 *      (300 + 400 + 900). (The generated Pro all.css already
 *      omits them; this guard stays for safety on future vendor bumps.)
 *   2. STRIP any .ttf fallback from every remaining src — the project ships woff2 only
 *      (matches the Open Sans pattern), so only 3 files travel to ODC Resources.
 *   3. REWRITE url("../webfonts/X.woff2") → url("/TheLoopTheme/X.woff2") — the same ODC
 *      Resources path Open Sans uses; ODC fingerprints it to /TheLoopDesignSystem/ at
 *      compile time (see tokens/typography.css; do not "fix" the literal path).
 *
 * Outputs:
 *   dist/fontawesome.css              — readable, header-stamped (the canonical paste,
 *                                       its OWN paste like dist/theme.css — NOT embedded
 *                                       verbatim in the handover ticket).
 *   dist/fontawesome.min.css          — minified (lightningcss) for the actual ODC paste.
 *   dist/fontawesome-webfonts/*.woff2 — the 3 files to upload to ODC Resources.
 *   preview/vendor/fontawesome/       — a local-path copy (url → ./webfonts/) so the
 *                                       preview renders icons without the /TheLoopTheme/
 *                                       404 (mirrors the Google-Fonts preview shim).
 *
 * Usage: node build/build-fontawesome.mjs */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = join(root, "vendor", "fontawesome-6");
const srcCss = join(vendorDir, "css", "all.css");
const webfontsDir = join(vendorDir, "webfonts");
const distDir = join(root, "dist");
const distWebfonts = join(distDir, "fontawesome-webfonts");
const previewDir = join(root, "preview", "vendor", "fontawesome");
const previewWebfonts = join(previewDir, "webfonts");

/* The 3 v6 webfonts kept (the legacy faces that referenced extra files are dropped). */
const WOFF2 = ["fa-solid-900.woff2", "fa-regular-400.woff2", "fa-light-300.woff2"];

/* FA version — single source of truth is the vendored package's own version string,
 * read from the all.css banner so a vendor bump flows through automatically. */
function faVersion() {
  const m = /Font Awesome (?:Free|Pro)\s+([\d.]+)/i.exec(readFileSync(srcCss, "utf8"));
  return m ? m[1] : "6.x";
}

/* Remove every @font-face block whose font-family is one of the legacy names. Blocks are
 * flat (no nested braces), so a simple block scan is safe. */
function dropLegacyFaces(css) {
  const drop = ["'FontAwesome'", "'Font Awesome 5 Free'", "'Font Awesome 5 Brands'"];
  let out = "";
  let i = 0;
  while (i < css.length) {
    if (css.startsWith("@font-face", i)) {
      const open = css.indexOf("{", i);
      const close = css.indexOf("}", open);
      const block = css.slice(i, close + 1);
      const isLegacy = drop.some((name) => block.includes(`font-family: ${name}`));
      if (!isLegacy) out += block;
      i = close + 1;
    } else {
      out += css[i];
      i++;
    }
  }
  return out;
}

/* `src: url(...woff2) format("woff2"), url(...ttf) format("truetype")` → woff2 only. */
function stripTtf(css) {
  return css.replace(/,\s*url\("[^"]*\.ttf"\)\s*format\("truetype"\)/g, "");
}

function rewriteUrls(css, base) {
  return css.replace(/url\("\.\.\/webfonts\//g, `url("${base}`);
}

function header(version) {
  return [
    "/*!",
    ` Font Awesome 6 Pro — full icon set, adapted for WBG "The Loop" / OutSystems ODC.`,
    ` Bundled from Font Awesome Pro ${version} (fontawesome.com · Commercial License —`,
    ` licensed asset, do NOT redistribute outside this project).`,
    ` Generated from vendor/fontawesome-6/css/all.css — do not edit directly.`,
    ` Rebuild: npm run gen:fa-css && npm run build:fontawesome.`,
    "",
    ` Self-hosted like the brand Open Sans faces: the 3 woff2 live in ODC Resources and the`,
    ` literal /TheLoopTheme/*.woff2 src is rewritten by ODC at compile time. Legacy v4/v5`,
    ` @font-face names (incl. 'FontAwesome', which OSUI's Icon widget owns) are excluded so`,
    ` this never clobbers the native icon widget — only the v6 family remains.`,
    "",
    ` Use:  <i class=\"fa-solid fa-user\"></i>  ·  fa-regular / fa-light  ·  full list:`,
    ` https://fontawesome.com/v6/search?o=r`,
    " */",
    "",
  ].join("\n");
}

function build() {
  if (!existsSync(srcCss)) throw new Error(`missing vendored CSS: ${srcCss}`);
  const version = faVersion();
  const raw = readFileSync(srcCss, "utf8");
  const cleaned = stripTtf(dropLegacyFaces(raw));

  mkdirSync(distDir, { recursive: true });
  mkdirSync(distWebfonts, { recursive: true });
  mkdirSync(previewWebfonts, { recursive: true });

  // 1) Canonical ODC paste — /TheLoopTheme/ Resource paths.
  const odcCss = header(version) + rewriteUrls(cleaned, "/TheLoopTheme/");
  const odcFile = join(distDir, "fontawesome.css");
  writeFileSync(odcFile, odcCss + "\n");

  // 2) Minified paste (optional convenience; comments stripped).
  let minNote = "";
  try {
    // Call the real binary (no shell — the ">=" in --targets must not hit a shell as a redirect).
    const winExe = join(root, "node_modules", "lightningcss-cli", "lightningcss.exe");
    const bin = process.platform === "win32" && existsSync(winExe) ? winExe : join(root, "node_modules", ".bin", "lightningcss");
    execFileSync(bin, ["--minify", "--targets", ">= 0.25%", odcFile, "-o", join(distDir, "fontawesome.min.css")], { stdio: "ignore" });
    minNote = " + fontawesome.min.css";
  } catch {
    minNote = " (min skipped — lightningcss unavailable)";
  }

  // 3) Webfonts to upload to ODC Resources.
  for (const f of WOFF2) copyFileSync(join(webfontsDir, f), join(distWebfonts, f));

  // 4) Preview copy — local ./webfonts/ paths so icons render without the /TheLoopTheme/ 404.
  writeFileSync(join(previewDir, "fontawesome.css"), header(version) + rewriteUrls(cleaned, "./webfonts/") + "\n");
  for (const f of WOFF2) copyFileSync(join(webfontsDir, f), join(previewWebfonts, f));

  console.log(`build:fontawesome → dist/fontawesome.css${minNote}, ${WOFF2.length} webfonts, preview copy (FA ${version})`);
}

build();
