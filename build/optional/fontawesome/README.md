# FontAwesome Pro — optional icon-font pipeline

**Opt-in.** Most projects never need this. It lives under `build/optional/` so a new project
doesn't inherit an icon pipeline it isn't using, and so a **licensed** dependency is never
baked into the template by default.

## Licensing — read this first

FontAwesome Pro is a **paid, licensed** asset. The scripts here are safe to commit. The
**assets are not**:

- The woff2/OTF font files and the vector-path metadata **must never be committed or
  redistributed**. They live in gitignored `dist/` and `vendor/**/metadata/`.
- FA's `metadata/icons.json` is ~34 MB and `icon-families.json` ~110 MB — the latter exceeds
  **GitHub's 100 MB file limit** outright. Both are gitignored.
- Pin to a 6.x version. Copy the assets in locally from your Pro desktop package.

## Enable it

Add the scripts back to `package.json`:

```jsonc
"convert:fa-otf":     "node build/optional/fontawesome/convert-fa-otf.mjs",
"gen:fa-css":         "node build/optional/fontawesome/gen-fa-pro-css.mjs",
"build:fontawesome":  "node build/optional/fontawesome/build-fontawesome.mjs",
"gen:icon-data":      "node build/optional/fontawesome/gen-icon-data.mjs",
"gen:icomoon":        "node build/optional/fontawesome/gen-icomoon.mjs",
"gen:icomoon-data":   "node build/optional/fontawesome/gen-icomoon-data.mjs"
```

Then drop the licensed package into `vendor/fontawesome-6/` and run, in order:

1. `npm run convert:fa-otf` — one-time per FA version: the Pro **desktop** package ships OTFs
   and no web fonts, so convert OTF → woff2.
2. `npm run gen:fa-css` — rebuild `all.css` from the core template + `metadata/icons.json`.
3. `npm run build:fontawesome` — emit `dist/fontawesome.css` to paste into ODC, plus the three
   woff2 to upload to ODC Resources.

All of these read `odcThemeModule`, `classPrefix`, and `jsNamespace` from
`project.config.json` — nothing is hard-coded to a customer.

## The one trap that will cost you a day

**Never declare the legacy `'FontAwesome'` `@font-face` family.**

That exact family name is the one OutSystems UI's *native* Icon widget owns
(`--osui-icon-font-family: 'FontAwesome'`). Redeclaring it silently clobbers the native
widget across the whole app. Declare only the v6 family (`'Font Awesome 6 Pro'`);
`build-fontawesome.mjs` strips the legacy v4/v5 faces defensively on every run, and that guard
should stay in place across vendor bumps.

Related: the `@font-face` `src` paths are **rewritten by ODC at compile time**. The literal
path 404ing locally is *expected* — do not "fix" it. If text falls back to a serif, the cause
is a **missing** `@font-face`, not a wrong path.
