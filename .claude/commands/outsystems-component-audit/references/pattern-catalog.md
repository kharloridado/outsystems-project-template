# OutSystems UI Pattern Catalog

Use these exact names when classifying components. Reference: OutSystems UI v2.28.1+.

## Content Patterns
- **Accordion** — Collapsible sections
- **Alert** — Inline messages (info/success/warning/error)
- **Blank Slate** — Empty state placeholders
- **Card** — Generic content container
- **Card Background** — Card with image as background
- **Card Item** — Compact list-style card
- **Card Sectioned** — Card with dividers
- **Chat Message** — Conversation bubble
- **Flip Content** — Two-sided flippable card
- **Floating Content** — Floating panel anchored to trigger
- **List Item Content** — List row with avatar/text/action
- **Section** — Page section wrapper
- **Section Group** — Container for multiple sections
- **Tag** — Inline label
- **Tooltip** — Hover/focus contextual hint
- **User Avatar** — Profile picture circle

## Interaction Patterns
- **Action Sheet** — Bottom-anchored action picker
- **Animate** — Wrap content for entrance animations
- **Animated Label** — Floating label input pattern
- **Bottom Sheet** — Slide-up modal from bottom
- **Carousel** — Slider (Splide provider)
- **Date Picker / Date Picker Range / Month Picker** — Flatpickr provider
- **Dropdown Search / Dropdown Tags** — VirtualSelect provider
- **Dropdown Server Side** — Server-driven pagination
- **Floating Actions** — FAB with mini-actions
- **Input with Icon** — Text input with icon
- **Lightbox Image** — Fullscreen image overlay
- **Map** — Embedded map
- **Notification** — Toast/snackbar
- **Range Slider / Range Slider Interval** — noUiSlider provider
- **Scrollable Area** — Container with custom scrollbar
- **Search** — Search input
- **Sidebar** — Slide-in panel
- **Stacked Cards** — Swipeable card stack
- **Video** — Embedded video player

## Navigation Patterns
- **Bottom Bar Item** — Mobile tab bar
- **Breadcrumbs** — Hierarchical nav trail
- **Pagination** — List page navigation
- **Section Index** — A-Z scrollable index
- **Submenu** — Nested menu
- **Tabs** — Content switcher
- **Timeline Item** — Vertical timeline event
- **Wizard** — Multi-step indicator + nav

## Numbers / Indicators
- **Badge** — Notification count
- **Counter** — Animated numeric counter
- **Icon Badge** — Icon with count overlay

## Layout / Adaptive
- **Columns** — 1–6 column responsive layouts
- **Display on Device** — Conditional render
- **Gallery** — CSS Grid image/card gallery
- **Master Detail** — List + detail two-pane
- **Layout Base / Layout SideMenu / Layout Top / Layout Login** — App shells
- **Login Split** — Two-panel login
- **Popup** — Modal dialog

## Classification cheat-sheet

| Design Element | Likely Pattern |
|---|---|
| Top nav bar | `Layout Top` |
| Side nav drawer | `Layout SideMenu` or `Sidebar` |
| Mobile bottom nav | `Bottom Bar Item` |
| Breadcrumbs | `Breadcrumbs` |
| Form with floating labels | `Animated Label` |
| Searchable dropdown | `Dropdown Search` |
| Multi-select chips | `Dropdown Tags` |
| Date input | `Date Picker` |
| Modal | `Popup` |
| Toast | `Notification` |
| Image gallery | `Gallery` |
| Slide-out panel | `Sidebar` |
| Hero carousel | `Carousel` |
| Tabbed content | `Tabs` |
| FAQ collapsibles | `Accordion` |
| Step indicator | `Wizard` |
| Profile circle | `User Avatar` |
| Empty/error state | `Blank Slate` |
| Status pill | `Tag` or `Badge` |
| Animated counter | `Counter` |
| Floating action button | `Floating Actions` |

If a design element doesn't match any pattern → it's an L5 → Web Component candidate.
