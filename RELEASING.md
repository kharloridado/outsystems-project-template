# Releasing — cutting a versioned theme build

The version lives in **one place**: the `version` field in `package.json`. The theme build
reads it and stamps it at the top of `dist/theme.css`, so whatever a developer pastes into
the ODC Theme editor self-identifies and matches its [`CHANGELOG.md`](./CHANGELOG.md)
entry.

Versioning is [SemVer](https://semver.org) in the **0.x** range (pre-1.0): bump the **MINOR**
for a new component/feature tier, the **PATCH** for fixes only. Token/class renames are
expected at this stage and are not treated as breaking.

## When to cut a release

When a batch of work has been **Approved** on the board (only Approved items reach a real
OutSystems build — see the board workflow). The release captures exactly that approved set.

## Steps

1. **Bump the version** in `package.json`:
   ```bash
   npm version <major|minor|patch> --no-git-tag-version
   # e.g. minor: 0.6.0 → 0.7.0   (we create the tag by hand in step 4)
   ```
2. **Update `CHANGELOG.md`**: move the relevant notes out of `## [Unreleased]` into a new
   `## [x.y.z] — YYYY-MM-DD` section (newest first), grouped under **Added / Changed /
   Fixed** with component scope and PR/issue refs. Add the compare-link line at the bottom.
3. **Build the theme** so the stamp picks up the new version:
   ```bash
   npm run build:theme
   ```
   Confirm the top of `dist/theme.css` reads `Version x.y.z · built <date>`. This is the
   file pasted into ODC.
4. **Tag and push**:
   ```bash
   git commit -am "release: vx.y.z"
   git tag -a vx.y.z -m "vx.y.z — <one-line summary>"
   git push && git push --tags
   ```

The version at the top of the pasted theme now always matches the changelog entry and the
git tag.

## Notes

- `dist/theme.min.css` (`npm run build:theme:min`) is **not** the file pasted into ODC. It
  is compiled independently by lightningcss straight from `tokens/index.css` — it does not
  go through the assembler, so it carries neither the version banner nor the block CSS. The
  file pasted into ODC is always `dist/theme.css`.
- No release automation (`changesets` / `standard-version` / CI) is wired up by design —
  releases are manual and gated on board approval.
