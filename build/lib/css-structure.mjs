/* css-structure.mjs — balanced braces and terminated comments, by hand.
 *
 * Lifted out of build/validate-theme.mjs, which had it inline and applied it to
 * dist/theme.css only. It now has two callers, because the failure it catches turned out
 * not to be specific to the assembled theme at all.
 *
 * WHY BY HAND, AND NOT WITH A PARSER. A CSS parser will not report this. An unclosed rule
 * is not a syntax error: the parser treats everything that follows as further declarations
 * of that rule, finds them invalid, and drops them — silently. The stylesheet still loads,
 * still reports a non-zero `cssRules.length`, and simply misses every rule in the swallowed
 * region. Nothing throws, nothing warns, and the page just renders wrong.
 *
 * WHAT IT COST BEFORE IT EXISTED. Three separate occurrences in this project, all from the
 * same cause: a hand-resolved merge conflict whose boundary fell INSIDE a rule, leaving it
 * open and swallowing the next item's whole chrome section.
 *
 *   1. cmp-input onto cmp-checkbox — `.wf-preview__variant-name` left open, swallowing
 *      `.wf-preview__grid`. The input's specimens fell out of their three-up grid and
 *      measured 324px -> 1020px, which read as a fidelity regression in the component.
 *   2 & 3. The primitives merges — `.wf-preview__stack--tall` and `.wf-preview__spinner`
 *      left open, swallowing the cmp-button and cmp-link sections. `.wf-preview__icon`
 *      disappeared, the button's icon stand-ins had no size at all, and the gate reported
 *      eight "element has a zero-size box" regressions against a component whose CSS was
 *      perfectly fine. `main` stayed red across three runs.
 *
 * In all three the stylesheet was structurally broken and NOTHING in the build said so:
 * validate-theme.mjs ran this exact check, but only on dist/theme.css, and the chrome sheet is
 * not in it. The check was right; its scope was wrong.
 */

/** @returns {string|null} a human-readable problem, or null when the file is sound. */
export function checkStructure(s, label = "stylesheet") {
  let depth = 0;
  let line = 1;
  let openedAt = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\n") { line++; continue; }
    if (s[i] === "/" && s[i + 1] === "*") {
      const end = s.indexOf("*/", i + 2);
      if (end === -1) return `unterminated comment opened at ${label}:${line}`;
      line += s.slice(i, end).split("\n").length - 1;
      i = end + 1;
      continue;
    }
    if (s[i] === "{") {
      if (depth === 0) openedAt = line;
      depth++;
    } else if (s[i] === "}" && --depth < 0) {
      return `unexpected "}" at ${label}:${line}`;
    }
  }
  if (depth > 0) {
    return `${depth} unclosed "{" in ${label} — a block is never closed. ` +
           `The last top-level block opens at ${label}:${openedAt}. ` +
           `Everything after an unclosed rule is silently dropped at parse time, so the ` +
           `page renders without it and nothing errors.`;
  }
  return null;
}
