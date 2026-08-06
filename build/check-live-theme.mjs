#!/usr/bin/env node
/* check-live-theme.mjs — diffs the LIVE ODC theme CSS against the repo's theme.
 *
 * The theme is INSTALLED BY HAND: a developer copies two files into the ODC Theme
 * editor and republishes. Nothing in the pipeline verifies that step, so the live
 * environment silently drifts from the repo — a stale paste after a token change, or
 * an edit made directly in ODC that exists nowhere in git. Every other gate in this
 * repo guards code that deploys itself; this one guards the deliverable a human
 * carries across by hand, which is the only one that can rot without anybody noticing.
 *
 * This script fetches the live compiled CSS, rebuilds the two pastes
 * (dist/tokens.css + dist/theme.css) from tokens/, normalizes both sides, and
 * reports the difference. Run it on a schedule — see loop/ROUTINES.md §4.
 *
 * Normalization — both sides, so none of these read as drift:
 *   - ALL comments stripped (the /*! head carries a per-build date stamp, and the
 *     dev build keeps provenance notes the ship paste doesn't);
 *   - url(...) reduced to the bare file basename: ODC rewrites font paths AND
 *     appends per-publish fingerprints (open-sans-400__<hash>.woff2?<hash>);
 *   - whitespace collapsed; rules compared structurally (selector → declarations),
 *     with :root custom properties diffed token-by-token.
 *
 * ODC serves the theme at STABLE, un-fingerprinted, auth-free URLs — one per paste:
 *
 *     <environmentUrl>/<appModule>/css/<odcThemeModule>.<themeName>.css
 *
 * We fetch BOTH and concatenate them (tokens first, same order as dist/tokens.css +
 * dist/theme.css), which reconstructs the full live theme without chasing the
 * per-publish fingerprint or scraping a JS-rendered SPA shell. Use the stable URLs,
 * never the fingerprinted ones a page happens to reference: a URL that changes every
 * publish turns this check into a maintenance chore and it gets switched off.
 *
 * CONFIGURED IN project.config.json (`odc` block) — nothing here is hard-coded. Until
 * that block is filled in, the check exits 0 with "not configured": a scaffold that
 * fails a build because an environment does not exist yet trains people to ignore it.
 *
 * Usage:  node build/check-live-theme.mjs [--live-file <path>] [--local-file <path>]
 *         (the --*-file overrides exist for offline testing / self-diff sanity checks)
 * Exit:   0 = in sync (or not configured) · 1 = drift found · 2 = live theme unreachable */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { projectConfig, root } from "./lib/project-config.mjs";

const FETCH_TIMEOUT_MS = 30_000;

/* Stable, un-fingerprinted, auth-free theme resources — one per ODC paste. Returns
 * null when the project has not been pointed at an environment yet. */
function liveUrls() {
  const cfg = projectConfig();
  const odc = cfg.odc ?? {};
  const filled = (v) => typeof v === "string" && v && !v.startsWith("<<");
  const need = {
    "odc.environmentUrl": odc.environmentUrl,
    "odc.appModule": odc.appModule,
    "odc.tokensThemeName": odc.tokensThemeName,
    "odc.themeName": odc.themeName,
    odcThemeModule: cfg.odcThemeModule,
  };
  const missing = Object.entries(need).filter(([, v]) => !filled(v)).map(([k]) => k);
  if (missing.length) return { missing };

  const base = `${odc.environmentUrl.replace(/\/+$/, "")}/${odc.appModule}/css/`;
  return {
    tokens: `${base}${cfg.odcThemeModule}.${odc.tokensThemeName}.css`, // paste #1 (:root tokens)
    theme: `${base}${cfg.odcThemeModule}.${odc.themeName}.css`,        // paste #2 (classes/overrides)
  };
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

async function fetchText(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "theme-drift-check" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/* Fetch both stable paste URLs and concatenate them (tokens first, then theme — same
 * order as the local dist/tokens.css + dist/theme.css), reconstructing the full live
 * theme. Comparison is structural, so the concatenation point never reads as drift. */
async function resolveLiveCss(urls) {
  try {
    const [tokens, theme] = await Promise.all([fetchText(urls.tokens), fetchText(urls.theme)]);
    return { url: urls.theme, css: `${tokens}\n${theme}`, via: "stable" };
  } catch (e) {
    throw new Error(
      `live theme unreachable — could not fetch the stable paste URLs ` +
        `(${urls.tokens} + ${urls.theme}): ${e.message}`
    );
  }
}

/* "Version 0.6.0 · built 2026-07-14" from the /*! head, before comments are stripped. */
function headStamp(css) {
  const m = /Version\s+(\S+)\s+·\s+built\s+(\d{4}-\d{2}-\d{2})/.exec(css);
  return m ? { version: m[1], built: m[2] } : null;
}

/* Strip EVERY comment (unlike build-theme.mjs's stripNotes, /*! included — the head's
 * build stamp changes daily). Same scanner shape: a comment runs from its opener to
 * the NEXT `*​/`, never re-scanning the body. */
function stripAllComments(css) {
  let out = "";
  for (let i = 0; i < css.length; ) {
    if (css[i] === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
    } else {
      out += css[i++];
    }
  }
  return out;
}

/* url(/<ThemeModule>/brand-sans-400__qlPf…w.woff2?qlPf…w) → url(brand-sans-400.woff2):
 * drop quotes, query, path (ODC rewrites it to the producer module) and the
 * per-publish `__<fingerprint>` suffix. */
function neutralizeUrls(css) {
  return css.replace(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/g, (_, _q, raw) => {
    if (/^(data:|#)/.test(raw)) return `url(${raw})`;
    const base = raw.split(/[?#]/)[0].split("/").pop();
    return `url(${base.replace(/__[\w-]+(\.[a-z0-9]+)$/i, "$1")})`;
  });
}

const squash = (s) => s.replace(/\s+/g, " ").trim();

/* ODC serves a MINIFIED compile of the pasted theme (verified 2026-07-15): spaces
 * stripped around combinators/colons, `::before` downgraded to `:before`, attribute
 * and font-name quotes removed, number leading zeros dropped, hex shortened. Apply
 * one canonical form to BOTH sides so only real drift survives. Every transform is
 * symmetric — worst case it masks a cosmetic-only edit, never invents a difference. */
function canonicalize(css) {
  return (
    squash(css)
      .replace(/::(before|after|first-line|first-letter)\b/g, ":$1")
      .replace(/\s*([{};,>~+])\s*/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/:\s+/g, ":") // safe: a space never follows `:` in a valid selector
      .replace(/\s*!\s*important/g, "!important")
      .replace(/@(media|supports|container)\s+/g, "@$1")
      .replace(/\(\s*even\s*\)/g, "(2n)")
      .replace(/\(\s*odd\s*\)/g, "(2n+1)")
      .replace(/\btranslateX\(/g, "translate(")
      // 200ms → .2s (time units unified to the minifier's shorter form)
      .replace(/(^|[^\w.])(\d+)ms\b/g, (_, p, n) => `${p}${String(n / 1000).replace(/^0\./, ".")}s`)
      // quotes around identifier-ish strings: [attr="x"], "Brand Sans", format("woff2")
      .replace(/(['"])([\w][\w -]*)\1/g, "$2")
      // 0.5px → .5px (leading zero), matching the minifier
      .replace(/(^|[^\d])0+\.(?=\d)/g, "$1.")
      // 0px/0em/0rem → 0 (lengths only — 0% can be semantic, e.g. flex-basis)
      .replace(/([:,(\s])0(?:px|em|rem|pt|deg)(?=[;,}\s)!])/g, "$10")
      // hex: lowercase, and #abc → #aabbcc
      .replace(/#[0-9a-fA-F]{3,8}\b/g, (h) => h.toLowerCase())
      .replace(/#([0-9a-f])([0-9a-f])([0-9a-f])(?![0-9a-f])/g, "#$1$1$2$2$3$3")
      .replace(/;\s*}/g, "}")
  );
}

/* Parse top-level statements into rules by brace-counting (comments already gone).
 * Returns [{selector, body}] — at-rules with blocks (@media, @font-face) keep their
 * whole prelude as the selector; brace-less statements (@import, @charset) become
 * {selector: statement, body: ""}. */
function parseRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const brace = css.indexOf("{", i);
    const semi = css.indexOf(";", i);
    if (brace === -1 && semi === -1) break;
    if (brace === -1 || (semi !== -1 && semi < brace)) {
      const stmt = squash(css.slice(i, semi));
      if (stmt) rules.push({ selector: stmt, body: "" });
      i = semi + 1;
      continue;
    }
    let depth = 0;
    let close = -1;
    for (let j = brace; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}" && --depth === 0) { close = j; break; }
    }
    if (close === -1) break; // unbalanced tail — ignore
    const selector = squash(css.slice(i, brace));
    const body = squash(css.slice(brace + 1, close));
    if (selector) rules.push({ selector, body });
    i = close + 1;
  }
  return rules;
}

/* Explode a selector list at top-level commas — the minifier merges adjacent rules
 * with identical bodies (h2{X} h3{X} → h2,h3{X}), so compare per single selector.
 * Commas inside :is(...) / [attr="a,b"] are depth-guarded. */
function splitSelectors(sel) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i <= sel.length; i++) {
    const c = sel[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if ((c === "," && depth === 0) || i === sel.length) {
      const s = sel.slice(start, i).trim();
      if (s) out.push(s);
      start = i + 1;
    }
  }
  return out;
}

/* [selector, body] pairs with selector lists exploded. Block at-rules (@media …)
 * recurse: their body becomes the SORTED serialization of the exploded inner rules,
 * so merging inside a media query doesn't read as drift either. */
function ruleEntries(rules) {
  const entries = [];
  for (const { selector, body } of rules) {
    if (selector[0] === "@" && body.includes("{")) {
      const inner = ruleEntries(parseRules(body)).map(([s, b]) => `${s}{${b}}`).sort();
      entries.push([selector, inner.join("")]);
    } else if (selector[0] === "@") {
      entries.push([selector, body]);
    } else {
      for (const s of splitSelectors(selector)) entries.push([s, body]);
    }
  }
  return entries;
}

/* selector → [bodies] (a selector can legitimately repeat across sections). */
function ruleMap(rules) {
  const map = new Map();
  for (const [selector, body] of ruleEntries(rules)) {
    if (!map.has(selector)) map.set(selector, []);
    map.get(selector).push(body);
  }
  return map;
}

/* --token: value map from every :root body. */
function tokenMap(rules) {
  const map = new Map();
  for (const { selector, body } of rules) {
    if (selector !== ":root") continue;
    // Split on `;` at paren depth 0 — token values may contain url(a;b) etc. is rare,
    // but gradients/urls with commas are common; parens are the safe guard.
    let depth = 0, start = 0;
    const decls = [];
    for (let i = 0; i <= body.length; i++) {
      const c = body[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if ((c === ";" || i === body.length) && depth === 0) {
        decls.push(body.slice(start, i).trim());
        start = i + 1;
      }
    }
    for (const d of decls) {
      const m = /^(--[\w-]+)\s*:\s*(.+)$/s.exec(d);
      if (m) map.set(m[1], squash(m[2]));
    }
  }
  return map;
}

const clip = (s, n = 160) => (s.length > n ? s.slice(0, n) + " …" : s);

function diff(liveCss, localCss) {
  const live = parseRules(liveCss);
  const local = parseRules(localCss);
  const liveTokens = tokenMap(live);
  const localTokens = tokenMap(local);

  const tokens = { added: [], removed: [], changed: [] };
  for (const [name, value] of localTokens) {
    if (!liveTokens.has(name)) tokens.added.push({ name, value });
    else if (liveTokens.get(name) !== value)
      tokens.changed.push({ name, live: liveTokens.get(name), local: value });
  }
  for (const [name, value] of liveTokens)
    if (!localTokens.has(name)) tokens.removed.push({ name, value });

  const liveRules = ruleMap(live);
  const localRules = ruleMap(local);
  const rules = { added: [], removed: [], changed: [] };
  for (const [sel, bodies] of localRules) {
    if (sel === ":root") continue; // token-level diff covers it
    const other = liveRules.get(sel);
    if (!other) rules.added.push(sel);
    else if (JSON.stringify([...other].sort()) !== JSON.stringify([...bodies].sort()))
      rules.changed.push({ sel, live: other.join(" "), local: bodies.join(" ") });
  }
  for (const sel of liveRules.keys())
    if (sel !== ":root" && !localRules.has(sel)) rules.removed.push(sel);

  return { tokens, rules };
}

function report({ liveUrl, via, liveStamp, localStamp, tokens, rules }) {
  const lines = [];
  const count =
    tokens.added.length + tokens.removed.length + tokens.changed.length +
    rules.added.length + rules.removed.length + rules.changed.length;
  lines.push(`# Live ODC theme drift report`);
  lines.push("");
  lines.push(`- **Live:** v${liveStamp?.version ?? "?"} built ${liveStamp?.built ?? "?"} — [${via} URL](${liveUrl})`);
  lines.push(`- **Repo:** v${localStamp?.version ?? "?"} (freshly built from \`tokens/\` @ HEAD)`);
  lines.push(`- **Result:** ${count === 0 ? "✅ in sync" : `⚠️ ${count} difference(s)`}`);
  const section = (title, items, fmt) => {
    if (!items.length) return;
    lines.push("", `## ${title} (${items.length})`, "");
    for (const it of items) lines.push(fmt(it));
  };
  section("Tokens only in repo (live is missing them)", tokens.added,
    (t) => `- \`${t.name}\` = \`${clip(t.value)}\``);
  section("Tokens only in live (removed from repo, or added in ODC)", tokens.removed,
    (t) => `- \`${t.name}\` = \`${clip(t.value)}\``);
  section("Tokens with different values", tokens.changed,
    (t) => `- \`${t.name}\`\n  - live: \`${clip(t.live)}\`\n  - repo: \`${clip(t.local)}\``);
  section("Rules only in repo", rules.added, (s) => `- \`${clip(s)}\``);
  section("Rules only in live", rules.removed, (s) => `- \`${clip(s)}\``);
  section("Rules with different declarations", rules.changed,
    (r) => `- \`${clip(r.sel)}\`\n  - live: \`${clip(r.live)}\`\n  - repo: \`${clip(r.local)}\``);
  if (count > 0) {
    lines.push("", "## Remediation", "");
    lines.push("- Live stale → `npm run build:theme:ship`, paste `dist/tokens.css` (tokens theme) + `dist/theme.css` (classes/overrides) into the ODC Theme editor, republish.");
    lines.push("- Live edited directly in ODC on purpose → port the change back into `tokens/` / `src/blocks/` so the repo stays the source of truth.");
  }
  return { text: lines.join("\n"), count };
}

async function main() {
  const liveFile = argValue("--live-file");
  const localFile = argValue("--local-file");

  let liveRaw, liveUrl, via;
  if (liveFile) {
    liveRaw = readFileSync(resolve(liveFile), "utf8");
    liveUrl = liveFile;
    via = "file";
  } else {
    const urls = liveUrls();
    if (urls.missing) {
      console.log(
        `check:live-theme → not configured (skipped).\n` +
          `  Fill in project.config.json: ${urls.missing.join(", ")}.\n` +
          `  The theme is pasted into ODC by hand, so nothing else can tell you the live\n` +
          `  environment still matches this repo. Point this at your environment once the\n` +
          `  theme is first published, then schedule it (loop/ROUTINES.md §4).`
      );
      process.exitCode = 0;
      return;
    }
    ({ css: liveRaw, url: liveUrl, via } = await resolveLiveCss(urls));
  }

  let localRaw;
  if (localFile) {
    localRaw = readFileSync(resolve(localFile), "utf8");
  } else {
    const build = spawnSync("node", [join(root, "build", "build-theme.mjs")], {
      cwd: root,
      stdio: ["ignore", "inherit", "inherit"],
    });
    if (build.status !== 0) throw new Error("npm run build:theme failed — cannot compare");
    // Two-paste split (2026-07-16): the live ODC bundle compiles BOTH pastes into
    // one CSS file, so the local side is dist/tokens.css + dist/theme.css concatenated
    // (tokens first — same order as the pastes). Comparison is structural, so the
    // concatenation point itself never reads as drift.
    localRaw =
      readFileSync(join(root, "dist", "tokens.css"), "utf8") +
      "\n" +
      readFileSync(join(root, "dist", "theme.css"), "utf8");
  }

  const normalize = (css) => canonicalize(neutralizeUrls(stripAllComments(css)));
  const { text, count } = report({
    liveUrl,
    via,
    liveStamp: headStamp(liveRaw),
    localStamp: headStamp(localRaw),
    ...diff(normalize(liveRaw), normalize(localRaw)),
  });
  console.log(text);
  process.exitCode = count === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error(`check:live-theme FAILED (exit 2): ${e.message}`);
  process.exitCode = 2;
});
