#!/usr/bin/env node
/* build-theme.mjs — assembles TWO ODC pastes from tokens/*.css + src/blocks/*.css:
 *
 *   dist/tokens.css — the design tokens ONLY: the single consolidated `:root`
 *                     plus device-scoped token redefinitions (e.g. `body.phone`
 *                     type steps, which ARE token definitions, just scoped).
 *   dist/theme.css  — everything else: @font-face, base rules, utility classes,
 *                     widget/component overrides. Carries NO tokens.
 *
 * Both are pasted into the ODC Theme editor. The split exists because token edits
 * are frequent and class edits are not: re-pasting a token change should not mean
 * re-pasting (and re-reviewing) the whole theme. Each file carries its own head,
 * Section Index and section banners — neither is ever shipped flat.
 *
 * Sectioning follows the OutSystems UI convention (see ODC.OutSystemsUI.scss):
 * a `/*!` header, a numbered "Section Index", and `/*! ===…=== *\/` banners per
 * section. `!` marks the comments as important so they survive minification.
 * (Decided 2026-06-17: match OutSystems UI's simple style — NOT inuitcss
 * `#SECTION` banners or dot-leader contents.)
 *
 * Comment-PRESERVING by design: lightningcss strips every comment, which leaves
 * the pasted ODC theme an unreadable wall of variables. This build keeps the
 * source provenance/finding notes AND adds the navigable index.
 *
 * `--ship` (customer deliverable): strips the ordinary `/* … *\/` provenance and
 * finding notes but KEEPS the `/*!` important comments — the head, the Section
 * Index, and the per-section banners. The pasted ODC theme stays navigable
 * (TOC + sectioning) without the internal working notes. NOT flat/comment-stripped
 * (see CLAUDE.md rule): the sectioning + table of contents always survive.
 *
 * SINGLE :root — every token file declares its own `:root { … }`; concatenating
 * them verbatim would emit many `:root` blocks. Instead we lift each file's
 * declarations into ONE consolidated `:root { … }` (section banners kept as inner
 * comments). Files with no `:root` (e.g. the color utility CLASSES) are emitted
 * after the consolidated block, each under its own banner.
 *
 * TOKEN CHANGE REPORT — every build diffs the assembled token set against the
 * committed baseline tokens/tokens.lock.json, prints added/modified/removed
 * classified [branding] / [foundation] / [component], and records them newest-first
 * in tokens/TOKEN-CHANGELOG.md. Both files are generated and tracked: commit them
 * with the token change, never hand-edit them. A design system's tokens are its
 * public API; a rename that lands silently is a breaking change nobody reviewed.
 *
 * Usage:  node build/build-theme.mjs [--watch] [--ship]
 * Order of sections follows the @import order in tokens/index.css. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, watch } from "node:fs";
import { dirname, join } from "node:path";
import { projectConfig, root } from "./lib/project-config.mjs";

const cfg = projectConfig();
const tokensDir = join(root, "tokens");
const blocksDir = join(root, "src", "blocks");
const outFile = join(root, "dist", "theme.css");
const tokensOutFile = join(root, "dist", "tokens.css");
const lockFile = join(tokensDir, "tokens.lock.json");
const changelogFile = join(tokensDir, "TOKEN-CHANGELOG.md");

/* The release version stamped at the top of dist/theme.css comes from package.json
 * — its single source of truth. Bumping a release = editing package.json "version"
 * (see RELEASING.md), then rebuilding so the pasted ODC theme self-identifies and
 * matches the CHANGELOG.md entry. */
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

/* Per-file section metadata — SELF-DECLARED, read from the file itself.
 *
 * Each token / block CSS file names its own place in the Section Index with an
 * `@section` annotation in a comment near the top:
 *
 *     /* @section Colors / Primitives *\/
 *      ^ group ── ^ name (optional; omit for a single-file group)
 *
 * `group` clusters files under one top-level number; `name` is the sub-entry when a
 * group holds more than one file.
 *
 * Deliberately NOT a lookup table in this script. The previous version kept a `META`
 * map here, which meant every new token file had to be registered in TWO places —
 * `tokens/index.css` AND this table — and half-doing it silently dropped the file from
 * the theme's table of contents. One file, one declaration, one place to forget nothing. */
const SECTION_RE = /@section\s+([^\n*/]+?)\s*(?:\/\s*([^\n*/]+?))?\s*(?:\*\/|\n)/;

/* Maintenance bucket for the token change report, ALSO self-declared — a file may
 * add `@kind branding|foundation|component` next to its `@section`:
 *
 *     /* @section Colors / Primitives
 *        @kind branding *\/
 *
 * `branding` = the brand palette, the semantic role layer, and any framework
 * brand retints — the tokens a brand owner signs off. `foundation` = the
 * non-colour foundations (spacing, type, radius, border, shadow). `component` =
 * per-component tokens. Undeclared files fall back to the filename heuristic
 * below, so a project that never annotates anything still gets a useful report. */
const KIND_RE = /@kind\s+(branding|foundation|component)\b/;
const FOUNDATION_FILES = new Set(["spacing.css", "typography.css", "radius.css", "border.css", "shadows.css"]);
const BRANDING_FILES = new Set(["colors.css", "semantic-colors.css", "semantic-colors-dark.css"]);

function tokenKind(file) {
  const declared = meta(file).kind;
  if (declared) return declared;
  if (BRANDING_FILES.has(file)) return "branding";
  if (FOUNDATION_FILES.has(file)) return "foundation";
  return "component";
}

const metaCache = new Map();

/* Set once per build(): tells meta() which directory a given file came from. */
let dirOf = () => tokensDir;

function meta(file) {
  if (metaCache.has(file)) return metaCache.get(file);
  let m = null;
  let kind = null;
  try {
    const src = readFileSync(join(dirOf(file), file), "utf8");
    m = SECTION_RE.exec(src);
    kind = KIND_RE.exec(src)?.[1] ?? null;
  } catch { /* unreadable — fall through to the Misc default */ }
  const info = m
    ? { group: m[1].trim(), name: (m[2] ?? m[1]).trim(), kind }
    : { group: "Misc", name: file, kind };
  if (!m) console.warn(`build:theme — ${file} has no  /* @section Group / Name */  header; filed under "Misc".`);
  metaCache.set(file, info);
  return info;
}

/* The @section marker is build metadata, not documentation — the emitted banner already
 * states the section. Drop it from the shipped theme so it doesn't read as a stray note.
 * Handles both a standalone `/* @section … *\/` line and one opening a longer comment. */
function stripSectionMarker(s) {
  return s
    .replace(/^[ \t]*\/\*[ \t]*@section[^\n]*?\*\/[ \t]*\r?\n/, "")
    .replace(/^([ \t]*\/\*)[ \t]*@section[^\n]*(\r?\n)/, "$1$2")
    // `@kind` on its own line — keep the comment terminator if it closed there.
    .replace(
      /^[ \t]*\*?[ \t]*@kind[ \t]+(?:branding|foundation|component)[ \t]*(\*\/)?[ \t]*\r?\n/m,
      (_, close) => (close ? `${close}\n` : "")
    );
}

const RULE = "=".repeat(78); // section-banner rule width (OutSystems UI style)

/* External `@import url(...)` (e.g. Google Fonts) must sit at the very top of the
 * stylesheet — CSS ignores @import after any other rule. Token files declare them
 * inline (next to the related tokens); the build lifts them out and hoists them
 * above the head banner. Matches http(s) imports only — local `@import "./x"` is
 * resolved by importOrder(), not hoisted. */
const HOIST_IMPORT_RE = /^[ \t]*@import\s+url\(["']?https?:\/\/[^)]+\);[ \t]*\n?/gim;

function extractHoistedImports(body) {
  const imports = [];
  const stripped = body.replace(HOIST_IMPORT_RE, (m) => {
    imports.push(m.trim());
    return "";
  });
  return { stripped, imports };
}

function importOrder() {
  const index = readFileSync(join(tokensDir, "index.css"), "utf8");
  const files = [];
  const re = /@import\s+["']\.\/([^"']+)["']/g;
  let m;
  while ((m = re.exec(index))) files.push(m[1]);
  return files;
}

function blocksOrder() {
  const index = readFileSync(join(blocksDir, "index.css"), "utf8");
  const files = [];
  const re = /@import\s+["']\.\/([^"']+)["']/g;
  let m;
  while ((m = re.exec(index))) files.push(m[1]);
  return files;
}

function banner(title) {
  return `/*! ${RULE}\n${title}\n${RULE} */`;
}

/* `--ship` post-process: drop every ordinary `/* … *\/` note, KEEP the `/*!`
 * important comments (head, Section Index, section banners), then tidy the blank
 * lines and trailing whitespace those notes leave behind.
 *
 * A comment-aware scanner, NOT a regex: a `/*!` comment's own BODY may contain the
 * literal `/*` (e.g. the head's "tokens/*.css"), and since CSS comments don't nest,
 * a comment runs from `/*` to the NEXT `*\/`. Scanning for `*\/` from the opener —
 * never re-scanning the body for `/*` — keeps such comments whole; a regex that
 * hunts for `/*` mid-body would slice the keep-comment apart. */
function stripNotes(css) {
  let out = "";
  for (let i = 0; i < css.length; ) {
    if (css[i] === "/" && css[i + 1] === "*") {
      const keep = css[i + 2] === "!";
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      if (keep) out += css.slice(i, stop);
      i = stop; // ordinary comment: skip it entirely
    } else {
      out += css[i++];
    }
  }
  return out
    .replace(/[ \t]+$/gm, "") // trim trailing whitespace
    .replace(/\n{3,}/g, "\n\n") // collapse blank-line runs to one
    .replace(/^\n+/, ""); // no leading blank lines
}

/* Group files by their declared @section group, preserving first-seen order. Returns
 * the ordered group list + a group→files map, used for the N / N.M numbering. */
function groupFiles(files) {
  const order = [];
  const map = new Map();
  for (const file of files) {
    const { group } = meta(file);
    if (!map.has(group)) {
      map.set(group, []);
      order.push(group);
    }
    map.get(group).push(file);
  }
  return { order, map };
}

/* `N` for a single-file group, `N.M` for a file inside a multi-file group. */
function sectionNumber({ order, map }, file) {
  const n = order.indexOf(meta(file).group) + 1;
  const list = map.get(meta(file).group);
  return list.length === 1 ? `${n}` : `${n}.${list.indexOf(file) + 1}`;
}

/* Banner title: the group name for single-file groups, else the file's own name. */
function sectionTitle(groups, file) {
  const { group, name } = meta(file);
  return groups.map.get(group).length === 1 ? group : name;
}

function buildIndex({ order, map }) {
  // A fresh project has no block CSS yet, so paste #2 is legitimately empty. Say so —
  // an "Section Index:" with nothing under it reads as a broken build on day one.
  if (!order.length) return "/*!\n(No sections yet — nothing in this file to paste.)\n*/";
  const lines = ["/*!", "Section Index:"];
  order.forEach((group, i) => {
    const n = i + 1;
    const list = map.get(group);
    lines.push(`${n}. ${group}`);
    if (list.length > 1) {
      list.forEach((file, j) => lines.push(`    ${n}.${j + 1}. ${meta(file).name}`));
    }
  });
  lines.push("*/");
  return lines.join("\n");
}

/* Index of the first `{` that is NOT inside a `/* … *\/` comment, or -1. Used to
 * tell a real rule (e.g. an @font-face block) from prose in a file's preamble. */
function firstRuleBrace(s) {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "/" && s[i + 1] === "*") {
      const end = s.indexOf("*/", i + 2);
      if (end === -1) break;
      i = end + 1; // skip the comment (loop's i++ lands past the `/`)
      continue;
    }
    if (s[i] === "{") return i;
  }
  return -1;
}

/* Index of the brace that CLOSES the `:root {` opened at `open` (the position of
 * its `{`), found by brace-counting and skipping `/* … *\/` comments. Returns -1
 * if unbalanced. Must NOT assume it's the file's last `}` — a file may carry
 * trailing top-level rules after its :root (e.g. typography.css's `html, body` +
 * `body.phone` responsive blocks). See the 2026-06-30 responsive-scope fix. */
function matchingBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "/" && s[i + 1] === "*") {
      const end = s.indexOf("*/", i + 2);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (s[i] === "{") depth++;
    else if (s[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/* Split a file body into its leading `:root { … }` declaration block and anything
 * outside it. The inner = between the first `{` after `:root` and that block's OWN
 * matching `}` (not the file's last `}`); the preamble (the provenance/header
 * comment) is kept and re-emitted inside the merged block.
 * Files with no `:root` return inner:null and are emitted as standalone sections.
 *
 * `hoist`: real CSS that sits BEFORE the `:root` (e.g. typography.css's @font-face
 * rules). It must stay at TOP LEVEL — nesting an at-rule like @font-face inside the
 * consolidated :root is invalid CSS and silently breaks every token below it. When
 * the preamble contains a rule (a brace outside comments) we hoist the whole
 * pre-:root chunk out rather than folding it inside. See the 2026-06-25 font-face fix.
 *
 * `trailing`: real CSS that sits AFTER the `:root` close (e.g. typography.css's
 * `html, body` base rule + `body.tablet`/`body.phone` responsive overrides). Like
 * `hoist`, it must stay TOP LEVEL — folding it into the consolidated :root nests the
 * downstream component tokens inside `body.phone`, so they only apply on phones.
 * See the 2026-06-30 responsive-scope fix. */
function splitRoot(body) {
  // Match `:root {` as an actual SELECTOR (optional whitespace before the brace),
  // not the bare word ":root" — a class-only override file may mention ":root" in
  // its prose comments (e.g. "which only retints the :root --color-* vars"), and a
  // naive indexOf(":root") would mis-slice it into the consolidated :root block,
  // leaving it unclosed and breaking every token. See the 2026-06-22 alert restyle.
  const m = /:root\s*\{/.exec(body);
  if (!m) return { preamble: "", hoist: "", inner: null, trailing: "" };
  const open = m.index + m[0].length - 1; // position of the matched `{`
  const matched = matchingBrace(body, open);
  const close = matched === -1 ? body.lastIndexOf("}") : matched;
  const before = body.slice(0, m.index).trimEnd();
  const hasRule = firstRuleBrace(before) !== -1;
  return {
    preamble: hasRule ? "" : before,
    hoist: hasRule ? before : "",
    inner: body.slice(open + 1, close).replace(/^\n+/, "").trimEnd(),
    trailing: body.slice(close + 1).trim(),
  };
}

/* Extract `--name: value` declarations from a declaration block (comments
 * stripped, whitespace collapsed). Token values never contain a `;` (no data
 * URLs in tokens), so splitting on `;` is safe. */
function extractDecls(block) {
  const decls = [];
  for (const part of block.replace(/\/\*[\s\S]*?\*\//g, "").split(";")) {
    const m = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(part);
    if (m) decls.push({ name: m[1], value: m[2].replace(/\s+/g, " ") });
  }
  return decls;
}

/* Partition a file's trailing chunk (top-level rules after its :root) into
 * TOKEN rules — every declaration is a custom property, e.g. the `body.tablet` /
 * `body.phone` responsive type steps — and STYLE rules (everything else, e.g. a
 * `html, body` base type rule). Token rules ship in dist/tokens.css: they ARE
 * token definitions, merely device-scoped, and a project that splits the two
 * pastes must not strand half its type ramp in the other file. Style rules ship
 * in dist/theme.css. Comments preceding a rule travel with that rule; rules with
 * nested braces are treated as style. */
function partitionTrailing(trailing) {
  const tokenParts = [];
  const styleParts = [];
  const tokenRules = []; // [{selector, body}] for the change report
  if (!trailing) return { token: "", style: "", tokenRules };
  let i = 0;
  let pending = ""; // comment block(s) preceding the next rule
  while (i < trailing.length) {
    if (/\s/.test(trailing[i])) { i++; continue; }
    if (trailing[i] === "/" && trailing[i + 1] === "*") {
      const end = trailing.indexOf("*/", i + 2);
      const stop = end === -1 ? trailing.length : end + 2;
      pending += (pending ? "\n" : "") + trailing.slice(i, stop);
      i = stop;
      continue;
    }
    const rel = firstRuleBrace(trailing.slice(i));
    if (rel === -1) { // stray non-rule text — keep it on the style side verbatim
      styleParts.push((pending ? pending + "\n" : "") + trailing.slice(i).trim());
      pending = "";
      break;
    }
    const open = i + rel;
    const close = matchingBrace(trailing, open);
    const stop = close === -1 ? trailing.length : close + 1;
    const rule = trailing.slice(i, stop);
    const body = trailing.slice(open + 1, close === -1 ? trailing.length : close);
    const bare = body.replace(/\/\*[\s\S]*?\*\//g, "");
    const isToken =
      !bare.includes("{") &&
      bare.split(";").every((d) => { const t = d.trim(); return !t || t.startsWith("--"); });
    if (isToken) {
      tokenParts.push((pending ? pending + "\n" : "") + rule);
      tokenRules.push({ selector: trailing.slice(i, open).trim().replace(/\s+/g, " "), body });
    } else {
      styleParts.push((pending ? pending + "\n" : "") + rule);
    }
    pending = "";
    i = stop;
  }
  if (pending) styleParts.push(pending); // orphan trailing comment
  return { token: tokenParts.join("\n\n"), style: styleParts.join("\n\n"), tokenRules };
}

/* ---- Token change report (branding / foundation / component) ------------- */

/* Diff the assembled token set against tokens/tokens.lock.json, print the
 * classified changes, record them in tokens/TOKEN-CHANGELOG.md (newest first),
 * and rewrite the lock. `tokens` = { "<scope> <name>": { value, file, kind } },
 * scope being `:root` or a device class like `body.phone`. Last declaration wins
 * for a duplicate scope+name, which matches the cascade of the assembled sheet. */
function reportTokenChanges(tokens) {
  const KINDS = ["branding", "foundation", "component"];
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
  const sortedLock = () => {
    const out = {};
    for (const k of Object.keys(tokens).sort()) out[k] = tokens[k];
    return JSON.stringify({ version, tokens: out }, null, 2) + "\n";
  };

  if (!existsSync(lockFile)) {
    // First run on a fresh project: seed the baseline. Do NOT list every token as
    // "added" — a wall of additions on day one trains people to skip the report.
    writeFileSync(lockFile, sortedLock());
    const counts = KINDS.map(
      (k) => `${Object.values(tokens).filter((t) => t.kind === k).length} ${k}`
    ).join(" · ");
    const entry = `## ${stamp} — v${version} — baseline\n\nBaseline created: ${Object.keys(tokens).length} tokens (${counts}).\n`;
    writeChangelogEntry(entry);
    console.log(`Token baseline created: ${Object.keys(tokens).length} tokens (${counts}) → tokens/tokens.lock.json`);
    return { added: 0, modified: 0, removed: 0 };
  }

  const prev = JSON.parse(readFileSync(lockFile, "utf8")).tokens ?? {};
  const changes = []; // {sign, kind, line}
  for (const key of Object.keys(tokens).sort()) {
    const cur = tokens[key];
    const old = prev[key];
    const label = key.startsWith(":root ") ? key.slice(6) : key;
    if (!old) {
      changes.push({ sign: "+", kind: cur.kind, line: `\`${label}\`: \`${cur.value}\` _(${cur.file})_` });
    } else if (old.value !== cur.value) {
      changes.push({ sign: "~", kind: cur.kind, line: `\`${label}\`: \`${old.value}\` → \`${cur.value}\` _(${cur.file})_` });
    } else if (old.file !== cur.file) {
      changes.push({ sign: "~", kind: cur.kind, line: `\`${label}\`: moved ${old.file} → ${cur.file}` });
    }
  }
  for (const key of Object.keys(prev).sort()) {
    if (!tokens[key]) {
      const label = key.startsWith(":root ") ? key.slice(6) : key;
      changes.push({ sign: "−", kind: prev[key].kind, line: `\`${label}\` (was \`${prev[key].value}\`, ${prev[key].file})` });
    }
  }

  const tally = { added: 0, modified: 0, removed: 0 };
  for (const c of changes) tally[c.sign === "+" ? "added" : c.sign === "~" ? "modified" : "removed"]++;

  if (!changes.length) {
    console.log("Token changes since last build: none");
    return tally;
  }

  console.log("Token changes since last build:");
  for (const kind of KINDS) {
    for (const c of changes.filter((x) => x.kind === kind)) {
      const plain = c.line.replace(/[`_]/g, "").replace(/\((?=[\w-]+\.css\)$)/, "(");
      console.log(`  [${kind.padEnd(10)}] ${c.sign} ${plain}`);
    }
  }

  const entryLines = [`## ${stamp} — v${version}`, ""];
  for (const kind of KINDS) {
    for (const c of changes.filter((x) => x.kind === kind)) entryLines.push(`- **[${kind}]** ${c.sign} ${c.line}`);
  }
  writeChangelogEntry(entryLines.join("\n") + "\n");
  writeFileSync(lockFile, sortedLock());
  console.log(
    `→ tokens/TOKEN-CHANGELOG.md updated (${tally.added} added, ${tally.modified} modified, ${tally.removed} removed); tokens/tokens.lock.json rewritten`
  );
  return tally;
}

const CHANGELOG_HEADER = `# Token Changelog

Auto-generated by \`npm run build:theme\` — every build diffs the assembled design
tokens against the \`tokens/tokens.lock.json\` baseline and records added (+),
modified (~) and removed (−) tokens here, newest first, classified
**branding** / **foundation** / **component**. Do not edit by hand.
`;

/* Prepend a new entry directly under the header (newest first). */
function writeChangelogEntry(entry) {
  const existing = existsSync(changelogFile) ? readFileSync(changelogFile, "utf8") : CHANGELOG_HEADER;
  const at = existing.indexOf("\n## ");
  const head = at === -1 ? existing.replace(/\n*$/, "\n") : existing.slice(0, at + 1);
  const rest = at === -1 ? "" : existing.slice(at + 1);
  writeFileSync(changelogFile, `${head}\n${entry.replace(/\n*$/, "\n")}${rest ? "\n" + rest : ""}`);
}

/* --------------------------------------------------------------------------- */

function build() {
  const tokenFiles = importOrder();
  const blockFiles = blocksOrder();
  const files = [...tokenFiles, ...blockFiles];
  metaCache.clear(); // --watch: a file's @section / @kind header may have changed
  dirOf = (file) => (blockFiles.includes(file) ? blocksDir : tokensDir);
  const stamp = new Date().toISOString().slice(0, 10);

  /* First pass: read + split every file, deciding which output(s) it feeds. */
  const parts = [];
  const hoisted = []; // external @import url() lines → top of dist/theme.css
  for (const file of files) {
    const raw = stripSectionMarker(readFileSync(join(dirOf(file), file), "utf8")).trimEnd();
    const { stripped, imports } = extractHoistedImports(raw);
    hoisted.push(...imports);
    const body = stripped.trimEnd();
    const { preamble, hoist, inner, trailing } = splitRoot(body);
    const { token: tokenTrailing, style: styleTrailing, tokenRules } = partitionTrailing(trailing);
    parts.push({ file, body, preamble, hoist, inner, tokenTrailing, styleTrailing, tokenRules });
  }

  /* Which files contribute sections to which document — the Section Index is
   * numbered per document, so a file absent from one doesn't leave a gap in it. */
  const tokenDocFiles = parts.filter((p) => p.inner !== null || p.tokenTrailing).map((p) => p.file);
  const themeDocFiles = parts.filter((p) => p.hoist || p.inner === null || p.styleTrailing).map((p) => p.file);
  const tokenGroups = groupFiles(tokenDocFiles);
  const themeGroups = groupFiles(themeDocFiles);
  const titleIn = (groups, file) => `${sectionNumber(groups, file)}. ${sectionTitle(groups, file)}`;

  /* Second pass: assemble both documents + collect the token set for the report. */
  const rootSections = [];      // tokens.css — declarations lifted into the single :root
  const tokenTailSections = []; // tokens.css — device-scoped token redefinitions
  const preRootSections = [];   // theme.css — top-level rules hoisted from before a :root (@font-face)
  const tailSections = [];      // theme.css — class files + trailing style rules
  const tokens = {};            // "<scope> <name>" → { value, file, kind } (last wins, like the cascade)
  for (const p of parts) {
    const kind = tokenKind(p.file);
    // Pre-:root rules (e.g. @font-face) carry their own explanatory comment; emit
    // them at top level so they are valid CSS, not buried inside the merged :root.
    if (p.hoist) preRootSections.push(`${banner(titleIn(themeGroups, p.file))}\n\n${p.hoist}`);
    if (p.inner === null) {
      tailSections.push(`${banner(titleIn(themeGroups, p.file))}\n\n${p.body}`);
    } else {
      const sect = [banner(titleIn(tokenGroups, p.file))];
      if (p.preamble) sect.push(p.preamble);
      sect.push(p.inner);
      rootSections.push(sect.join("\n\n"));
      for (const d of extractDecls(p.inner)) tokens[`:root ${d.name}`] = { value: d.value, file: p.file, kind };
    }
    // Post-:root rules must stay top level — folding them into the merged :root
    // nests every later component token inside e.g. `body.phone`. Device-scoped
    // TOKEN rules go to tokens.css; real style rules go to theme.css.
    if (p.tokenTrailing) {
      tokenTailSections.push(`${banner(titleIn(tokenGroups, p.file))}\n\n${p.tokenTrailing}`);
      for (const r of p.tokenRules)
        for (const d of extractDecls(r.body)) tokens[`${r.selector} ${d.name}`] = { value: d.value, file: p.file, kind };
    }
    if (p.styleTrailing) tailSections.push(`${banner(titleIn(themeGroups, p.file))}\n\n${p.styleTrailing}`);
  }
  const rootBlock = `:root {\n${rootSections.join("\n\n\n")}\n}`;

  const tokensHead = [
    "/*!",
    `${cfg.customer} · "${cfg.designSystemName}" Design System — Design Tokens`,
    `Version ${version} · built ${stamp}   (see CHANGELOG.md + tokens/TOKEN-CHANGELOG.md)`,
    "Generated from tokens/*.css — do not edit directly. Rebuild: npm run build:theme.",
    "Design tokens ONLY (single :root + device-scoped redefinitions). Paste #1 of 2",
    "into the ODC Theme editor — the classes/overrides live in dist/theme.css (paste both).",
    "*/",
    "",
    buildIndex(tokenGroups),
  ].join("\n");

  const themeHead = [
    "/*!",
    `${cfg.customer} · "${cfg.designSystemName}" Design System — Theme (classes & overrides)`,
    `Version ${version} · built ${stamp}   (see CHANGELOG.md)`,
    "Generated from tokens/*.css + src/blocks/*.css — do not edit directly. Rebuild: npm run build:theme.",
    "Carries NO design tokens — those live in dist/tokens.css. Paste #2 of 2 into",
    "the ODC Theme editor (paste both).",
    "*/",
    "",
    buildIndex(themeGroups),
  ].join("\n");

  // Dedupe hoisted imports (first occurrence wins) and place them above everything.
  const importBlock = [...new Set(hoisted)].join("\n");
  const themeDocHead = importBlock ? `${importBlock}\n\n\n${themeHead}` : themeHead;

  const ship = process.argv.includes("--ship");
  let tokensOut = [tokensHead, rootBlock, ...tokenTailSections].join("\n\n\n") + "\n";
  let themeOut = [themeDocHead, ...preRootSections, ...tailSections].join("\n\n\n") + "\n";
  if (ship) {
    tokensOut = stripNotes(tokensOut);
    themeOut = stripNotes(themeOut);
  }

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(tokensOutFile, tokensOut);
  writeFileSync(outFile, themeOut);
  console.log(
    `build:theme${ship ? ":ship" : ""} → dist/tokens.css (1 :root, ${Object.keys(tokens).length} tokens, ${rootSections.length}+${tokenTailSections.length} sections) + dist/theme.css (${hoisted.length ? "1 @import, " : ""}${preRootSections.length} pre-root, ${tailSections.length} class sections${ship ? "; notes stripped, TOC + banners kept" : ""})`
  );
  reportTokenChanges(tokens);
}

build();

if (process.argv.includes("--watch")) {
  console.log("watching tokens/ and src/blocks/ …");
  let timer;
  const rebuild = () => { clearTimeout(timer); timer = setTimeout(build, 50); };
  watch(tokensDir, rebuild);
  watch(blocksDir, rebuild);
}
