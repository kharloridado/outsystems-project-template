---
name: outsystems-images-icons
description: Images and icons in OutSystems — ImageWidget (Static/Binary/External), Icon (font glyphs), InlineSVG, UserAvatar pattern. Use when adding photos, icons, illustrations, or handling user avatars and binary uploads.
---

# Images and Icons in OutSystems

> Quick reference for using `ImageWidget`, `Icon`, and `InlineSVG` correctly.

## Choosing between Image / Icon / InlineSVG

| Use | Widget | Notes |
|---|---|---|
| Photograph, illustration, dynamic / user-uploaded image | `ImageWidget` | Static (resource) or Binary (entity attribute). |
| Icon glyph from the OutSystems UI icon set | `Icon` | Font-icon — small, fast, color-themable. |
| Custom SVG (not in the icon set) | `InlineSVG` | Inline markup; fully styleable via CSS. |

## ImageWidget

### Properties

| Property | Purpose |
|---|---|
| `Image` | Resource name (Static) or `<Aggregate>.List.Current.<Entity>.<BinaryAttr>` (Binary). |
| `Type` | `Static` for module resources, `Binary` for entity attributes, `External` for URLs. |
| `Url` | When `Type: "External"`, the image URL. |
| `AltText` | Alternative text for screen readers. **Required.** Use empty string for decorative. |
| `Width` / `Height` | Display dimensions. |
| `ImagePosition` | `(default)`, `Center`, `Left`, `Right`. |
| `Style` / `CustomStyle` | CSS class / inline style. |

### Static vs Binary vs External

| Type | When |
|---|---|
| `Static` | Logos, hero illustrations, anything shipped with the app. Cached aggressively. |
| `Binary` | User-uploaded content, per-record images. |
| `External` | Images from a CDN or third-party host. |

For a placeholder pattern — show user image if uploaded, fall back to a default — use `IfWidget`:

```
IfWidget Condition: GetUser.List.Current.User.HasPhoto
  TrueBranch:  ImageWidget Type=Binary, Image=GetUser.List.Current.User.Photo, AltText="Photo of " + Name
  FalseBranch: UserAvatar Name=GetUser.List.Current.User.Name (initials fallback)
```

### Image accessibility (the short version)

- **Meaningful image** → set `AltText` to a description.
- **Decorative image** → set `AltText: ""` (empty string, NOT omitted).
- **Image used as the entire content of a Link or Button** → set `aria-label` on the wrapping Link/Button (and `AltText: ""` on the image), so the action text is announced.

See [`accessibility.md`](./accessibility.md) for the full accessibility ruleset.

### Sizing

OutSystems serves the binary as-is. For performance:

- Resize images **server-side** before storing (or upload pre-sized variants).
- Don't render a 4000×3000 source in a 200×200 slot — wasted bandwidth.
- Use `loading="lazy"` for offscreen images via `ExtendedProperties`:

```jsonc
{ "Object": "ImageWidget", "Image": "…",
  "ExtendedProperties": [{ "Property": "loading", "Value": "\"lazy\"" }] }
```

Don't lazy-load above-the-fold hero images — that delays LCP.

### Responsive images

Set `Width: "(fill parent)"` to let the image fluidly fill its container. The intrinsic aspect ratio is preserved unless `Height` is also set. For art-directed responsive images (different crops per breakpoint), use `DisplayOnDevice` with one `ImageWidget` per device.

## Icon (font icons)

The OutSystems UI font icon set is referenced by name:

```jsonc
{ "Object": "Icon", "Icon": "shopping-cart", "IconSize": "FontSize", "Style": "\"icon\"" }
```

### Properties

| Property | Purpose |
|---|---|
| `Icon` | Icon name (e.g., `"check"`, `"chevron-left"`, `"trash"`, `"user"`). |
| `IconSize` | `FontSize` (matches surrounding text), `Twotimes`, `Threetimes`, `Fourtimes`, … |
| `Style` | CSS classes — typically `"\"icon\""` for default sizing, `"\"icon text-primary\""` for color tinting. |

Common icon names from the OutSystems UI font set include:

- Navigation: `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`, `arrow-left`, `angle-left`, `angle-right`, `angle-double-up`, `angle-double-down`
- Actions: `check`, `close`, `plus`, `minus`, `edit`, `trash`, `search`, `filter`, `cog`
- Domain: `user`, `users`, `envelope`, `phone`, `home`, `bell`, `calendar`, `clock`, `map-marker`, `sticky-note-o`
- Status: `info-circle`, `exclamation-triangle`, `check-circle`, `times-circle`

The exact list depends on the OutSystems UI version. To check available icons, browse the icon library in Service Studio's Icon picker.

### Icon sizing

`IconSize: FontSize` makes the icon scale with surrounding text — best when the icon is inline with text. For decorative icons (Counter cards, BlankSlate), use `Twotimes` or `Threetimes`.

### Icon color

Icons inherit text color by default. Tint via a Style class:

```jsonc
{ "Style": "\"icon text-danger\"" }
```

(Where `text-danger`, `text-primary`, `text-neutral-7`, … come from the [design tokens](../foundations/outsystems-design-tokens/design-tokens.md).)

## InlineSVG (custom illustrations)

When you need an SVG that's not in the icon set, or one that needs custom styling per element:

```jsonc
{ "Object": "UIBlockInstanceWidget", "SourceBlock": "InlineSVG",
  "Arguments": [
    { "type_": "IArgument", "Parameter": "InlineSVG.SVGCode",
      "Value": "\"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>…</svg>\"" }
  ],
  "PlaceholdersContent": []
}
```

### Accessibility for InlineSVG

- **Meaningful SVG** → set `role="img"` and `aria-label` inside the `<svg>` tag.
- **Decorative SVG** → set `aria-hidden="true"` inside the `<svg>` tag.

```html
<svg role="img" aria-label="Sales chart trending upward" viewBox="…">…</svg>
<svg aria-hidden="true" viewBox="…">…</svg>
```

### When to inline vs link

- **Inline** when the SVG needs runtime styling (CSS color via `currentColor`, hover effects).
- **External file** when the SVG is large, reused across many screens, and doesn't need runtime styling — store as a Static resource and reference via `ImageWidget Type=Static`.

## UserAvatar

For user profile images specifically, use the [`UserAvatar`](../ui-frameworks/outsystems-ui/patterns/content.md#useravatar) pattern instead of raw `ImageWidget`. It handles the initials fallback automatically and ensures consistent sizing/shape across the app.

```jsonc
{ "Object": "UIBlockInstanceWidget", "SourceBlock": "UserAvatar",
  "Arguments": [
    { "type_": "IArgument", "Parameter": "UserAvatar.Name",  "Value": "User.FullName" },
    { "type_": "IArgument", "Parameter": "UserAvatar.Image", "Value": "User.Photo" },
    { "type_": "IArgument", "Parameter": "UserAvatar.Color", "Value": "Entities.Color.Primary" },
    { "type_": "IArgument", "Parameter": "UserAvatar.Size",  "Value": "Entities.Size.Medium" },
    { "type_": "IArgument", "Parameter": "UserAvatar.Shape", "Value": "Entities.Shape.Rounded" }
  ],
  "PlaceholdersContent": []
}
```

## Quick checklist

- [ ] Every `ImageWidget` has `AltText` (descriptive or empty string for decorative).
- [ ] Images are sized appropriately — no 4000px source rendered into a 200px slot.
- [ ] Offscreen images use `loading="lazy"`.
- [ ] User avatars use the `UserAvatar` pattern, not raw `ImageWidget` + initials fallback.
- [ ] Decorative SVGs have `aria-hidden="true"`; meaningful ones have `role="img"` and `aria-label`.
- [ ] Icons use the `Icon` widget (font glyph) for tiny graphics rather than separate image files.
- [ ] Icon-only buttons / links have `aria-label` for screen readers.
