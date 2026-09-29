/* specs.mjs — where an item's spec lives. The id prefix decides the folder:
 *   cmp-* → specs/components/<id>/   pat-* → specs/patterns/<id>/   tok-* → specs/tokens/<id>/
 * The living usage spec sits beside the folder as specs/<kind>/<id>.md. */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './project-config.mjs';

export const SPECS = join(root, 'specs');
const KINDS = { cmp: 'components', pat: 'patterns', tok: 'tokens' };

export function kindOf(id) {
  const kind = KINDS[id.split('-')[0]];
  if (!kind) throw new Error(`item id "${id}" has no known prefix (cmp-, pat-, tok-)`);
  return kind;
}

/** Repo-relative folder for an item, e.g. specs/components/cmp-button */
export function specDir(id) {
  return `specs/${kindOf(id)}/${id}`;
}

/** Every item that has a folder, in kind order then name. */
export function allItems() {
  const out = [];
  for (const kind of Object.values(KINDS)) {
    const dir = join(SPECS, kind);
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      if (d.isDirectory()) out.push(d.name);
    }
  }
  return out;
}

/** Item id from a path inside its folder (…/specs/components/cmp-button/probes.json). */
export function itemFromPath(p) {
  const m = String(p).replace(/\\/g, '/').match(/specs\/(?:components|patterns|tokens)\/([^/]+)\//);
  return m ? m[1] : null;
}
