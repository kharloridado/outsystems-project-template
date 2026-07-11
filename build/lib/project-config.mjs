/* project-config.mjs — the ONE place build scripts read project values from.
 *
 * Every build script that needs the class prefix, the JS namespace, the design-system
 * name, or the ODC theme-module name reads it from `project.config.json` through here.
 * Nothing hard-codes them.
 *
 * This exists because the previous generation of this template had the class prefix
 * TYPED INTO the agents, nine build scripts, CLAUDE.md, and project-context.md. Nothing
 * read config; everything restated it — so the files drifted apart and shipped a prefix
 * that contradicted itself. One source, many readers. */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

let cached;

export function projectConfig() {
  if (cached) return cached;
  const path = join(root, "project.config.json");
  try {
    cached = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(
      `Could not read project.config.json at ${path}.\n` +
        `It is the source of truth for this project's values. Run: npm run init\n${err.message}`
    );
  }
  return cached;
}

/** A convention is only a RULE when it is explicitly confirmed.
 *  `assumed` and `TBD` are NOT rules — never enforce them, never raise findings against them.
 *  (A plausible-but-unverified "4pt grid" default once manufactured a whole batch of
 *  false-positive findings. A credible-looking default is worse than a blank.) */
export function isConfirmed(conventionName) {
  const c = projectConfig().conventions?.[conventionName];
  return c?.status === "confirmed";
}
