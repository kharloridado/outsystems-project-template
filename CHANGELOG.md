# Changelog

All notable changes to this design system are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) in the **0.x** range —
pre-1.0, so token and class renames are expected and are **not** treated as breaking. Bump the
MINOR for a new component or feature tier; bump the PATCH for fixes only.

The version lives in one place: the `version` field in `package.json`. The theme build reads it
and stamps it at the top of `dist/theme.css`, so the file a developer pastes into the ODC Theme
editor self-identifies and matches its entry below. See `CLAUDE.md` → "Releasing" for how
a release is cut.

"Shipped" means merged to `main`. Merging is not the same as delivered: **only board-Approved
items reach an OutSystems build**, and only a human moves an item to Approved.

Use these section headings, in this order, under each version: `Added`, `Changed`,
`Deprecated`, `Removed`, `Fixed`, `Security`. Write entries for the person integrating the
component, not for the person who wrote the commit — say what changed in the rendered result
and what they have to re-paste.

## [Unreleased]

### Added

- **Mentor guide: structural handovers.** `handover/MENTOR-STUDIO-PROMPT.md` gains a method for
  prompts that restructure a Layout or shared `Common` Blocks: start from the live DOM, give Mentor
  the target HTML with a widget legend ("build real widgets, never paste this HTML"), keep the
  prompt self-contained (Mentor sees the module, not the repo; imported `specs/` Markdown only once
  proven), placeholders over containers, one prompt per module in build order (theme module, then
  each consumer app), and verify the published page before sending a short delta prompt.
- **Several Mentor prompts per handover.** A `handover-map.json` entry may give
  `mentor.prompts: [{ title, text }, …]`; `npm run embed:handover` renders each as its own
  subsection, for changes that span the theme module and consumer apps.
