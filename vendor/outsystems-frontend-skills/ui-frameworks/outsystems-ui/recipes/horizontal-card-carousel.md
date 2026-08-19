---
name: osui-recipe-horizontal-card-carousel
description: How to build a horizontally scrollable row of cards using the Carousel block + Card blocks. Use when the request mentions a card slider, scrollable card list, currency cards row, product highlight strip, or any "horizontal cards with arrows / swipe."
---

# Recipe — Horizontal Card Carousel

> **Goal:** a horizontally scrollable / swipeable row of equally-sized card surfaces with arrow + dot navigation. The canonical OutSystems UI shape is `Carousel` block wrapping a list of `Card` (or `CardSectioned` / `CardBackground`) block instances — **never** a `Container` with custom horizontal scroll CSS.

## When to use this recipe

Trigger phrases in the user's request:

- "horizontally scrollable cards", "swipe between cards", "carousel of …"
- "currency cards row", "balance cards", "wallet cards"
- "product highlights strip", "featured items row"
- "left/right arrows to navigate items", "dots indicator"

If the request mentions any of those, use `Carousel` + `Card`. Don't write `<Container Style="cards-carousel">`.

## What you'll build

```
Carousel (block instance — from OutSystemsUI/Interaction)
  Carousel.Navigation       = Entities.CarouselNavigation.Both       ← arrows + dots
  Carousel.ItemsPerSlide    = ItemsPerSlide{Desktop:3, Tablet:2, Phone:1}   ← responsive cards-per-slide
  Carousel.OptionalConfigs  = OptionalConfigsCarousel{Loop: False, AutoPlay: False}
  └── Carousel.CarouselItems (placeholder)
        ├── ⚠️ default IList widget (auto-created — DELETE for static cards)
        └── one Card block per item (from OutSystemsUI/Content)
              └── Card.Content (placeholder)
                    └── flag image · amount text · currency name
```

> **Why `ItemsPerSlide` matters:** it defaults to **1**. If you omit it, the carousel renders one giant card per slide even when the design clearly shows 3 cards side-by-side (with a peek of the next one overlapping the edge). That peek/overlap effect is `ItemsPerSlide.Desktop > 1`. Pick the integer from the design — count visible whole cards, then add a fractional value (e.g. `3.2`) only if the design intentionally shows part of the next card. `ItemsPerSlide` is a **Record** with `Desktop` / `Tablet` / `Phone` fields, NOT an integer — it is a SEPARATE input from `OptionalConfigs`, which carries only `Loop` / `AutoPlay` / etc.

## Required references

Both blocks live in the **OutSystemsUI** reference (a dependency on every Reactive Web app). Look them up via the cross-library lookup pattern documented in [`../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern`](../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern).

| Block | OutSystemsUI flow | Key args | Key placeholders |
|---|---|---|---|
| `Carousel` | `Interaction` | `Carousel.Navigation`, **`Carousel.ItemsPerSlide`**, `Carousel.OptionalConfigs`, `Carousel.Height` | **`Carousel.CarouselItems`** (NOT `Carousel.Content`) |
| `Card` | `Content` | `Card.UsePadding`, `Card.ExtendedClass` | `Card.Content` |

For the full block API see [`../patterns/interaction.md#carousel`](../patterns/interaction.md#carousel) (Carousel) and [`../patterns/content.md#card`](../patterns/content.md#card) (Card).

## C# template

```csharp
// 1) Look up the block signatures from the OutSystemsUI reference
var app          = eSpace.GetESpace();
var outSystemsUI = app.References.Named("OutSystemsUI");
var interFlow    = outSystemsUI.MobileFlows.Named("Interaction");
var contentFlow  = outSystemsUI.MobileFlows.Named("Content");

var carouselSig = interFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "Carousel");
var cardSig     = contentFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "Card");

// 2) Instantiate Carousel inside the parent placeholder/container
var carousel = parentContainer.CreateWidget<IMobileBlockInstanceWidget>("CurrencyCarousel");
carousel.SourceBlock = carouselSig;
// SetArgumentValue takes (IInputParameterSignature, ExpressionDefinition).
// Look up the parameter by BARE name (not "Carousel.Navigation"), and pass the value as a string
// (it implicitly converts to ExpressionDefinition).
carousel.SetArgumentValue(
    carousel.SourceBlock.InputParameters.Named("Navigation"),
    "Entities.CarouselNavigation.Both");
// ItemsPerSlide is its OWN input (a Record with Desktop/Tablet/Phone) — NOT a field inside OptionalConfigs.
// Skip it ONLY when the design genuinely shows ONE card per slide. Anything else (3 visible + peek of a 4th,
// 2-up gallery, etc.) means you MUST set it — defaults to 1-per-slide and you lose the whole multi-card visual.
carousel.SetArgumentValue(
    carousel.SourceBlock.InputParameters.Named("ItemsPerSlide"),
    "ItemsPerSlide{Desktop: 3, Tablet: 2, Phone: 1}");
// OptionalConfigs carries Loop / AutoPlay / etc. — and ONLY those. No Items* fields belong here.
carousel.SetArgumentValue(
    carousel.SourceBlock.InputParameters.Named("OptionalConfigs"),
    "OptionalConfigsCarousel{Loop: False, AutoPlay: False}");

// 3) Find the CarouselItems placeholder (NOT "Content")
var carouselItemsPh = carousel.PlaceholdersContent
    .FirstOrDefault(p => p.Placeholder == "CarouselItems");  // BARE name — see blocks-index.md

// 4) Carousel auto-creates a default IList widget inside CarouselItems.
//    For STATIC cards (compile-time data), delete it. For data-bound, keep it and bind Source.
carouselItemsPh.Widgets.OfType<IList>().ToList().ForEach(x => x.Delete());

// 5) Add one Card per item directly under CarouselItems
foreach (var (currencyName, flagAsset, amount) in currencies)
{
    var card = carouselItemsPh.CreateWidget<IMobileBlockInstanceWidget>($"Card_{currencyName}");
    card.SourceBlock = cardSig;
    card.SetArgumentValue(card.SourceBlock.InputParameters.Named("UsePadding"),    "True");
    card.SetArgumentValue(card.SourceBlock.InputParameters.Named("ExtendedClass"), "\"currency-card\"");

    var cardContent = card.PlaceholdersContent
        .FirstOrDefault(p => p.Placeholder == "Content");  // BARE name

    // Use primitive widgets directly inside Card.Content — NOT another Container that mimics a card.
    var flag = cardContent.CreateWidget<IImage>("Flag");
    flag.Image = flagAsset;

    var amountText = cardContent.CreateWidget<IAdvancedHtml>("Amount");
    amountText.Tag = "h3";
    // For AdvancedHtml content text, mutate the inner content collection directly per its API.

    var nameText = cardContent.CreateWidget<IText>("CurrencyName");
    nameText.Value = $"\"{currencyName}\"";
}
```

> **Block-argument note:** `SetArgumentValue` is an **extension method** with signature `(IInputParameterSignature, ExpressionDefinition)`. Look up the parameter by **bare name** (e.g. `"Navigation"`, NOT `"Carousel.Navigation"`) on `inst.SourceBlock.InputParameters.Named("…")`. Pass the value as a string — it implicitly converts to `ExpressionDefinition`. The `Arguments` collection is auto-populated from defaults at instantiation; you mutate values, not add entries. See [`../blocks-index.md`](../blocks-index.md) for the canonical pattern.

## Anti-patterns to AVOID

❌ **Leaving `ItemsPerSlide` unset when the design shows multiple cards visible at once.** Carousel defaults to 1-per-slide, so the rendered result is one full-width card with the rest hidden — even when the design clearly shows 3 currency cards in a row with the next one peeking past the right edge. Count visible whole cards in the design and set `ItemsPerSlide.Desktop` to that number (`3.x` if a fractional peek of the next card is intentional). Mirror reasonable Tablet / Phone counts.

❌ **Putting `ItemsDesktop` / `ItemsTablet` / `ItemsPhone` inside `OptionalConfigs`.** Those fields do not exist on `OptionalConfigsCarousel` — the responsive items count lives on the dedicated `ItemsPerSlide` Record input. Setting them on `OptionalConfigs` silently does nothing and you fall back to the 1-per-slide default.

❌ `Container` with `Style: "\"cards-carousel\""` and a custom CSS rule applying `display: flex; overflow-x: scroll`. **This bypasses Carousel entirely**, loses arrow / dot navigation, doesn't expose responsive item counts, and signals to reviewers that the agent didn't recognize the pattern.

❌ Hand-rolled cards (`Container` with `box-shadow`, `border-radius`, `padding` baked into a stylesheet). **That's exactly what `Card` exists to express.** Use `Card.UsePadding` and `Card.ExtendedClass` for variations.

❌ Using `Carousel` but putting raw `Container`s inside its `Content` placeholder instead of `Card` blocks. The carousel mechanism still works, but every item is a custom design surface — losing visual consistency with the rest of OutSystems UI.

## Related

- For card layouts that need a header/footer split, use `CardSectioned` ([`../patterns/content.md#cardsectioned`](../patterns/content.md#cardsectioned)).
- For a row layout (avatar + title + content + action), use `CardItem`.
- For backgroundimage cards (hero), use `CardBackground`.
- For a vertical scrolling list (not horizontal), `List` widget with `Card` items per row is the right shape — `Carousel` is specifically horizontal+swipe.
