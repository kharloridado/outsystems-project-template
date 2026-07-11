# Lessons

Platform and process knowledge that was expensive to acquire on a real engagement. Every item here cost
at least one rebuild, one reversed decision, or one correction in front of a client. Read this before the
first component, not after the first bug.

Each item states the lesson, then a one-line **why this is here** — the concrete failure that put it on
the list. Nothing in this file is speculative.

---

## 1. Host-platform gotchas (OutSystems / ODC)

These are behaviours of the host platform that contradict what a competent web developer would reasonably
assume. They do not announce themselves; they present as "the component is mysteriously broken".

### 1.1 Boolean attributes arrive with a forced value — parse the value, never `hasAttribute()`

When a Web Component is wrapped in a Block, the platform binds an attribute from an expression, and the
idiomatic binding is `If(Flag, "true", "false")`. That means the attribute is **always present in the
DOM** — as the literal string `"false"` when the flag is off. Any component that tests presence
(`hasAttribute("dismissible")`, or a bare `dismissible` check) sees the feature as permanently enabled and
can never be turned off from the platform side.

Write a value-aware helper and use it everywhere a boolean is read:

```js
_boolAttr(name, fallback = false) {
  if (!this.hasAttribute(name)) return fallback;
  const v = (this.getAttribute(name) || "").trim().toLowerCase();
  return v !== "false" && v !== "0" && v !== "";
}
```

**Why this is here:** a component shipped with a "dismissible" flag that could not be switched off,
because the attribute was present-with-value-`"false"` and the component only checked presence.

### 1.2 Element ids are platform-generated — never hand-type one

The platform mangles ids at compile time. An id you can see in the browser inspector is not stable across
publishes, and an id you invent in JS or CSS will not match the rendered widget. When a component or a
script needs to point at a widget, pass the widget's **runtime `.Id`** through an input parameter and use
that. The same applies to `for`/`aria-labelledby`/`aria-controls` wiring: bind the runtime id, do not
type a string.

**Why this is here:** hand-typed ids in a handover worked in preview and silently pointed at nothing once
published.

### 1.3 Enumerable inputs must be Static Entities, not free Text

A Block input that accepts one of a fixed set of values (size, variant, tone, placement) should be typed
as a **Static Entity**, not `Text`. Free text gives the consuming developer no autocomplete, no
compile-time check, and no discoverability, and it produces silent no-ops when someone types `"Regular"`
where the CSS expects `"regular"`. Enumerate it, and the platform validates it for you.

**Why this is here:** size and variant inputs typed as `Text` produced components that rendered the base
style with no error whenever the string did not match exactly.

### 1.4 A 1px border adds 2px of height — never let a border resize a component

A component with a pinned height and a real `border` is 2px taller than its spec, and a component that
grows a border on hover or focus jumps by 2px. Both are fidelity failures and both are easy to miss in a
static screenshot. Use an **inset `box-shadow`** or an **`outline`** for any edge that appears, changes
width, or changes on state — these paint without participating in layout — and pin the component's height
explicitly.

**Why this is here:** a status badge was 2px taller than the mockup in every size, traced to a genuine
1px border where the design intended a painted edge.

### 1.5 Never use a framework runtime utility class as a CSS selector

Frameworks ship classes that their **JavaScript** adds and removes at runtime to signal state (the
canonical example being a `.placeholder-empty`-style class stamped on empty placeholders). These are
behavioural markers, not styling hooks. They appear and disappear on conditions you do not control, and
the framework is free to change their semantics in a minor release. Target elements **structurally**
instead — by their real role in the DOM.

**Why this is here:** one selector keyed on the framework's empty-placeholder class removed every native
breadcrumb separator across the application, because the class was present on elements that were not, in
any design sense, "empty".

Corollary: empty placeholders are already zero-size. There is nothing to collapse — do not write CSS to
collapse them.

### 1.6 The framework's `@media` breakpoints are not yours

The host framework has its own responsive breakpoints and its own opinion about where tablet and phone
begin. If you author raw `@media (max-width: …)` rules, your breakpoints and the framework's will disagree
somewhere, and the disagreement zone is where the layout looks broken. Prefer the framework's own
device classes (`.tablet` / `.phone` or their equivalent), which the framework applies consistently across
every widget you are sitting on top of.

**Why this is here:** hand-rolled breakpoints in a layout override desynchronised from the framework's
navigation collapse, producing a window width at which both the desktop and mobile navigation showed.

### 1.7 `@font-face` src paths are rewritten at compile time — the literal path 404ing is expected

Fonts referenced from theme CSS get their URLs rewritten and fingerprinted by the platform build. The
path you author is **not** the path that ships. Fetching the literal authored path and getting a 404 is
therefore not evidence of a bug, and "fixing" the path breaks the rewrite.

If text renders in a fallback face (the classic symptom is a serif fallback where you expect the brand
sans), the cause is almost always a **missing `@font-face` declaration** — a weight or style you use but
never declared — not a wrong path. Check the declared faces against the weights actually used before you
touch a URL.

**Why this is here:** a serif fallback was diagnosed as a broken font path, and the "fix" — rewriting the
`src` — made it worse. The real cause was an undeclared 500-weight face.

---

## 2. Build the framework's widget, not a parallel universe

### 2.1 Restyle native first; a Web Component is the last resort

The escalation order is: use the framework widget as-is → configure it → **override its own classes**
(`.btn`, `.card`, `.dropdown`, the switch, the text field) with `ExtendedClass` → and only when the
framework genuinely has no widget for the thing, build a vanilla JS Web Component. Do not build a
parallel `<<CLASS_PREFIX>>button` / `<<CLASS_PREFIX>>card` system alongside the framework's own. A
parallel system inherits none of the framework's accessibility, state handling, or form integration, and
every consuming developer has to be told which one to use.

**Why this is here:** a from-scratch button system, a from-scratch card system, and a from-scratch set of
colour utility classes were all built, reviewed, and then **reversed** — each replaced by an override of
the framework's own class. That is three components' worth of work spent twice.

Colour and typography utilities are the same story: override the framework's existing bare utility
classes; introduce a prefixed `<<CLASS_PREFIX>>`-namespaced class only for a role the framework genuinely
does not have.

### 2.2 Verify a restyle against the LIVE RENDERED DOM, not the vendored SCSS

The framework source you have vendored is a *reference*, and it goes stale relative to what the platform
actually ships and what third-party providers actually emit. Before writing an override, capture the real
rendered HTML of the widget from a published page and style against that. Four specific traps, all of
which were hit:

- **Styling can live in a shared "Feature" class**, not on the element you expect. The painted element may
  be a shared balloon/overlay class used by several widgets, not the inner element you were aiming at.
  Style the element that is actually painted.
- **Providers emit their own placement tokens.** A third-party dropdown/date-picker/tooltip provider will
  emit placement classes in its own vocabulary (`bottom-start`, not `.bottom`). Match the provider's
  vocabulary, or your rule never matches.
- **Arrows and overlays are often JS-positioned.** Do not re-implement geometry the provider computes at
  runtime (a rotated-square arrow, an offset popover). Restyle it; do not relocate it.
- **Inline custom-property declarations beat your stylesheet.** If the provider or the framework writes
  `style="--x: …"` on the element, no amount of specificity in your stylesheet wins. Override the custom
  property at the same or a more specific inline-reachable scope, or accept the value.

And a fifth: **provider CSS is frequently injected into the document at high specificity** (or as an
injected `<style>` block). Beating it legitimately requires `!important` on the handful of declarations
it owns. That is not a code smell here; it is the only lever available. Keep it narrow and comment why.

**Why this is here:** a multi-select restyle rendered wrong three times running, each time because the
override was written against the vendored SCSS rather than the DOM the provider actually produced.

### 2.3 Every `src/blocks/*.css` must be `<link>`ed in `preview/index.html`

The local preview is the fidelity gate. A component whose stylesheet is not loaded in the preview will
look fine in the preview (because it falls back to the framework's default, which is often *close*) and
then diverge in production — or worse, pass review on the strength of a preview that never rendered it.

Make it a checklist item: new block CSS file → new `<link>` in the preview harness, in the right layer
order (framework base → theme → overrides).

**Why this is here:** one component passed preview review and broke in production purely because its CSS
was never loaded in the preview at all.

---

## 3. Design-source traps

### 3.1 Design variables are mode-bound: one NAME can be many values

A single design variable name resolves to **different values in different modes** — per component size,
per device/breakpoint, per theme. The variables panel shows you one resolved value: the value for
whichever mode the frame you are looking at happens to be in.

Freezing that one value into a single shared token silently breaks every other mode. A body-text size that
reads as one number on the type page may in fact be three numbers across desktop/tablet/phone. A label
token that looks shared may be pinned per-component.

The discipline: **snapshot every size variant and every device frame** of a component before extracting
its tokens, and extract the variable *per mode*, not once. When a token legitimately varies by device,
express that in CSS (device classes or a responsive step), not by picking a winner.

**Why this is here:** a responsive type ramp was extracted from a single desktop frame and shipped as flat
fixed sizes; the device axis was only discovered later, and a finding had been filed against the design
that was in fact a misreading of the design.

### 3.2 Never trust a documentation or handover claim about the design

A handover note, a design-system page, or a component description that says "single size" / "one variant"
/ "not responsive" is a **claim**, not evidence. Verify it against the design file's own component-size
and variant collections. Designs routinely carry more variants than their own documentation admits, and
the shipped "default" is frequently not the variant labelled default.

**Why this is here:** a badge was built as single-size on the strength of a handover note. The design's
component-size collection in fact carried four sizes, and the variant that had been shipped as "default"
was the largest one.

### 3.3 Do not enforce a convention nobody confirmed

`project.config.json` states each convention as `confirmed` / `assumed` / `TBD`. A convention that is not
`confirmed` **is not a rule**: do not enforce it, and do not raise findings against it. A plausible-looking
default is worse than a blank, because it manufactures false positives that cost real review time and
real credibility.

**Why this is here:** a template shipped a spacing base of "4pt" that nobody had verified. The loop then
flagged every value that was not a multiple of four, producing a run of false-positive findings and at
least one GitHub bug that had to be closed as not-planned. See `knownFalsePositiveClasses` in the config —
add to it whenever a class of false positive is identified, so the checker stops re-raising it.

---

## 4. Build and repository hygiene

### 4.1 Generated files must look generated, and drift must fail the build

Every file emitted by a generator carries a banner comment at the top saying it is generated, by which
script, and that edits will be overwritten. Beyond that, a build step should be able to **detect drift** —
regenerate and compare — and fail rather than quietly accept a hand-edited generated file.

**Why this is here:** hand edits to generated utility files were lost on the next build, twice, and the
second time the loss was not noticed for several commits.

### 4.2 Licensed vendor assets stay in gitignored `dist/` — never commit vector artwork

Icon fonts and similar licensed vendor assets are **licensed, not redistributable**. Any build output that
embeds the licensed vector artwork (glyph path data, font binaries, export manifests carrying paths) stays
in a gitignored `dist/`. It is generated on demand from the vendored, licence-covered source; it is never
committed to the repository.

Two practical corollaries:

- Watch the hosting provider's **per-file size limit** (GitHub rejects files over 100MB, and warns well
  below that). Font and icon manifests get large fast.
- **Never redeclare a font family the framework's own icon widget owns.** The framework's icon widget
  declares a family under a well-known legacy name; if your self-hosted font redeclares that same family
  name, you clobber the framework's icon widget everywhere. Declare your font under its own current family
  name and leave the legacy name alone.

**Why this is here:** an early icon build committed the full path-bearing manifests, and a separate build
redeclared the legacy icon family name and broke every native icon in the application.

### 4.3 Concurrent agents on one working tree race each other

A scheduled routine and an interactive session both writing the same checkout will interleave: one stages
files the other is mid-edit on, or commits a tree containing the other's half-finished work. Give any
**scheduled or background routine its own git worktree and its own branch**, so it can never touch the
tree a human is working in.

Regardless: **re-check `git status` immediately before every commit**, and stage explicit paths rather than
`git add -A`. What was in the tree when you started planning the commit is not necessarily what is in it
now.

**Why this is here:** a scheduled routine committed an interactive session's uncommitted, unfinished work
into an unrelated branch, and the untangling cost more than the routine saved.
