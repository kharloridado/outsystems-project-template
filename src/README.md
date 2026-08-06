# src/

- `components/` — vanilla JS Web Components (L5 custom builds).
- `blocks/` — OutSystems Block wrappers + ExtendedClass BEM CSS (the prefix from `project.config.json` → `classPrefix`).
- `assets/` — authored files destined for ODC **Theme Resources**: SVGs referenced from CSS `url()` /
  `mask-image`, and similar. These are **source**, not build output — they belong in git, not in the
  gitignored `dist/`. Upload each to the theme module's Resources and reference it by the plain
  module-relative path; the platform resolves it at compile time (see `docs/LESSONS.md` §1.7).
