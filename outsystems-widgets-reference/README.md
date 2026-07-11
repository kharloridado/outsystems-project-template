# outsystems-widgets-reference

Captured **real rendered HTML** for each OutSystems UI widget you intend to restyle. One file
per widget. Paste the actual DOM straight out of the browser's inspector on a published page.

## Why this folder exists

Because the vendored SCSS lies to you — not deliberately, just eventually.

`vendor/outsystems-ui/` is the framework's *source*, and it is the right place to understand
intent. But the DOM the platform actually ships can differ from what that source suggests:
styling migrates into shared "Feature" classes, providers emit their own placement vocabulary,
some parts are positioned by JavaScript at runtime, and providers inject their own stylesheet at
a specificity your class override cannot beat.

Restyles written against the vendored SCSS alone produced, in a real project: a doubled tooltip
bubble, a mispositioned arrow, and a pile of dead rules that matched nothing. Every one of them
was obvious the moment someone looked at the rendered element instead.

So: **anchor an override on the rendered DOM, and cross-reference the SCSS for intent.** Never
the other way around.

## What to capture

For each widget, record:

- The full rendered element, including every class the platform put on it (the framework's own,
  the Feature classes, and any provider classes).
- Each **state** you need to style — default, hover, focus, disabled, error, open/closed.
- Anything the platform sets **inline**. An inline custom property beats your stylesheet, and it
  is invisible in the SCSS.
- The **provider** markup, when a widget delegates to one. The provider's DOM is the one you are
  actually styling.

## How to use it

1. Publish a page with the native widget on it.
2. Inspect the rendered element in a real browser and copy its outer HTML here.
3. Write the override against *that*, and drop the same markup into `preview/index.html` so the
   local preview exercises the real structure.
4. Cross-check `vendor/outsystems-ui/` to understand why the framework styles it as it does — so
   your override cooperates with the framework rather than fighting it.
