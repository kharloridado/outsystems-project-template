#!/usr/bin/env node
/* check-config.mjs — the guard that makes template drift impossible.
 *
 * Runs as the first step of `npm run build:theme`, which means it sits inside the
 * @checker's DETERMINISTIC GATE. A project that has not been initialised, or that has
 * leaked the template's own example values into real code, cannot build — and therefore
 * cannot pass review.
 *
 * It exists because the last generation of this template shipped a plausible-looking
 * example prefix (`rnt-`) and a plausible-looking spacing base (`4pt`). Both were wrong.
 * The prefix silently contradicted itself across two config files for the life of the
 * project; the spacing base manufactured a batch of false-positive findings. Neither
 * failed anything loudly, so neither got caught.
 *
 * Usage:  node build/check-config.mjs
 * Exits non-zero (loudly) on any violation. */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { projectConfig, root } from "./lib/project-config.mjs";

const PLACEHOLDER_RE = /<<[A-Z_/]+>>/;
const EXAMPLE_PREFIX = "acme-"; // the neutral prefix used in template/skill examples
const SCAN_DIRS = ["tokens", "src", "preview", "loop", "handover", "findings", "design", "style-guide"];
const SCAN_EXT = /\.(css|js|html|md|json|sh)$/;
const errors = [];

/* ---- 1. project.config.json itself must be filled in --------------------------- */
const cfg = projectConfig();
const raw = readFileSync(join(root, "project.config.json"), "utf8");
if (PLACEHOLDER_RE.test(raw)) {
  const left = [...raw.matchAll(/<<[A-Z_/]+>>/g)].map((m) => m[0]);
  errors.push(
    `project.config.json still holds ${[...new Set(left)].length} unfilled placeholder(s): ` +
      `${[...new Set(left)].join(", ")}\n    → run:  npm run init`
  );
}

/* ---- 2. the class prefix must be real, and must not be the example one ---------- */
if (cfg.classPrefix === EXAMPLE_PREFIX) {
  errors.push(
    `classPrefix is still the template's example value "${EXAMPLE_PREFIX}".\n` +
      `    → set a real prefix for this project in project.config.json`
  );
}
if (cfg.classPrefix && !/^[a-z][a-z0-9]*-$/.test(cfg.classPrefix) && !PLACEHOLDER_RE.test(cfg.classPrefix)) {
  errors.push(`classPrefix "${cfg.classPrefix}" should be lowercase and end with a hyphen (e.g. "acme-").`);
}

/* ---- 3. conventions must be three-state, and only `confirmed` is a rule --------- */
for (const [name, c] of Object.entries(cfg.conventions ?? {})) {
  if (name === "$comment") continue;
  if (!c || typeof c !== "object" || !("status" in c)) {
    errors.push(
      `conventions.${name} must be an object with a "status" of confirmed | assumed | TBD — ` +
        `never a bare value. An unverified convention that looks like a rule is how false-positive findings get manufactured.`
    );
    continue;
  }
  if (!["confirmed", "assumed", "TBD"].includes(c.status)) {
    errors.push(`conventions.${name}.status is "${c.status}" — must be confirmed | assumed | TBD.`);
  }
  if (c.status === "confirmed" && (c.value === null || c.value === undefined)) {
    errors.push(`conventions.${name} is marked "confirmed" but has no value. Confirm it properly or set status back to TBD.`);
  }
}

/* ---- 4. no placeholder or example prefix may survive in real project files ------ */
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "vendor" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (SCAN_EXT.test(entry)) scan(p);
  }
}

function scan(path) {
  const rel = relative(root, path).replace(/\\/g, "/");
  // The template's own worked examples are allowed to keep the example prefix.
  // `src/examples/` exists precisely so the reference component never sits in a real
  // source path — copy it out and rename it; do not build on top of it in place.
  const isExampleDoc =
    /(^|\/)(EXAMPLE-|MENTOR-STUDIO-PROMPT|README|LESSONS|WORKFLOW|CHANGELOG)/i.test(rel) ||
    rel.startsWith("src/examples/");
  const text = readFileSync(path, "utf8");

  text.split("\n").forEach((line, i) => {
    if (PLACEHOLDER_RE.test(line) && !isExampleDoc) {
      errors.push(`${rel}:${i + 1} — unfilled placeholder ${line.match(PLACEHOLDER_RE)[0]}`);
    }
    // Real code must never carry the example prefix — that's the `rnt-` leak, exactly.
    if (line.includes(EXAMPLE_PREFIX) && !isExampleDoc && /^(tokens|src|preview|style-guide)\//.test(rel)) {
      errors.push(`${rel}:${i + 1} — the template's example prefix "${EXAMPLE_PREFIX}" leaked into real code`);
    }
  });
}

SCAN_DIRS.forEach((d) => walk(join(root, d)));

/* ---- report --------------------------------------------------------------------- */
if (errors.length) {
  console.error(`\ncheck:config FAILED — ${errors.length} problem(s):\n`);
  errors.slice(0, 40).forEach((e) => console.error(`  ✗ ${e}`));
  if (errors.length > 40) console.error(`  … and ${errors.length - 40} more`);
  console.error(
    `\nThis gate is deliberate. An uninitialised template that silently "works" is how a wrong\n` +
      `class prefix or an unverified convention ships into a real project.\n`
  );
  process.exit(1);
}

const confirmed = Object.entries(cfg.conventions ?? {})
  .filter(([k, c]) => k !== "$comment" && c?.status === "confirmed")
  .map(([k]) => k);
console.log(
  `check:config → ok (prefix "${cfg.classPrefix}", ${confirmed.length} confirmed convention(s)` +
    `${confirmed.length ? `: ${confirmed.join(", ")}` : "; none confirmed — no grid/spacing rules will be enforced"})`
);
