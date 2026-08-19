# Vendored copy — a stopgap, not a fork

This directory is **OutSystems' `outsystems-frontend-skills` pack, copied in whole**. It is not
part of this project and nothing here is ours.

It exists as a checked-in copy for one reason: we do not yet have access to the upstream
repository. The moment we do, this directory is deleted and replaced by a pinned submodule at
**this same path**, so no skill or citation has to change.

## Provenance

| | |
| --- | --- |
| Source | `outsystems-frontend-skills`, branch `main`, obtained as a zip download |
| Obtained | 2026-08-19 |
| Commit | **unknown — a zip carries no git metadata** |
| Owner | `@OutSystems/rd-ui-components` |
| Licence | BSD 3-Clause. `LICENCE.txt` in this directory is the original and must stay. |

**"Commit: unknown" is the whole problem.** We cannot say which upstream state this matches, cannot
diff against a newer one, and cannot tell whether a difference we notice later is upstream moving or
this copy being stale. A submodule answers all three by construction. Treat every day this directory
survives as borrowed time.

## Rules while it is here

1. **Never edit anything in this directory.** Not a typo fix, not a formatting pass. The first edit
   turns a stale copy into a fork, and a fork cannot be swapped for a submodule — it has to be
   merged, by someone who no longer remembers what they changed.
2. **Never add files here.** If something is missing, that is a gap on our side of the boundary —
   the loop plugin holds it. See `ARCHITECTURE.md` in `outsystems-loop`.
3. **Do not copy anything out of here into the loop plugin.** Skills read this by path at runtime.
   A second copy defeats the point twice over.
4. **Do not register these skills at project scope.** The pack ships `.claude/skills/` wrappers for
   its own consumers; this project reads the files by path instead. If they start appearing in the
   session's skill list, that is worth investigating — it means something is loading them.

## Replacing it with the real thing

When the URL is confirmed:

```bash
git rm -r --cached vendor/outsystems-frontend-skills
rm -rf vendor/outsystems-frontend-skills
git submodule add <CONFIRMED_URL> vendor/outsystems-frontend-skills
git -C vendor/outsystems-frontend-skills checkout <tag-or-sha>
git add .gitmodules vendor/outsystems-frontend-skills
```

Then set `platformKnowledge.mode` to `"submodule"` and fill `repo` and `pin` in
`project.config.json`, and **diff the two trees before deleting this one** — anything that differs
is either upstream moving forward or an edit someone made here despite rule 1. Both are worth
knowing about; the second is worth telling the team about.

## Verifying it is intact

```bash
test -f vendor/outsystems-frontend-skills/ui-frameworks/outsystems-ui/blocks-index.md && echo ok
```

Skills that cannot find that file are required to say so and stop, rather than answering from
memory. If you see an audit classifying components without ever citing a block argument, check
this first.
