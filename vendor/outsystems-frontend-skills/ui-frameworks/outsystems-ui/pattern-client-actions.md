---
name: osui-pattern-client-actions
description: Catalog of public Client Actions the OutSystemsUI module exposes for programmatic pattern control — open/close a Sidebar, advance a Carousel, set a DatePicker date, toggle a Tab, fire a toast Notification, update a ProgressBar, scroll to an element, detect device/network, etc. Use when wiring a Button/Link/event handler that must DRIVE a pattern (not just configure it via inputs). Pair with [`extensibility.md`](extensibility.md) for `Set<Provider>Configs` / `Set<Provider>Event` (provider-config-level extensibility).
---

# OutSystems UI — Pattern Client Actions

> Most pattern behavior happens through input parameters (`Sidebar.IsOpen`, `Carousel.ItemsPerSlide`) and event handlers (`DatePicker.OnSelected`, `Tabs.OnTabChange`). When you need to **drive a pattern from outside** — open a Sidebar from a header button, advance a Carousel from a custom prev/next pair, set a DatePicker's value from an action flow, show a toast Notification — call one of the public **Client Actions** the OutSystemsUI module ships under each pattern's `ClientActions` folder.

This doc is the catalog: which Client Action exists for which pattern, the signature, and what it does.

## When to reach for a Client Action

| You want to… | Client Action |
|---|---|
| Open/close an overlay from a button outside the pattern (Sidebar, BottomSheet, Tooltip, Notification, Dropdown, DatePicker, MonthPicker, TimePicker) | `<Pattern>Open(WidgetId)` / `<Pattern>Close(WidgetId)` |
| Move through a Carousel programmatically | `CarouselNext`, `CarouselPrevious`, `CarouselGoTo` |
| Set or clear a picker's value from logic (not user input) | `<Pattern>UpdateDate/Time/Month`, `<Pattern>Clear` |
| Switch tabs programmatically (e.g. from a wizard step) | `SetActiveTab(WidgetId, TabsNumber)` |
| Expand / collapse Accordion items in bulk | `AccordionExpandAll` / `AccordionCollapseAll` |
| Update a ProgressBar / ProgressCircle live | `SetProgressBarValue` / `SetProgressCircleValue` |
| Pop a toast / Notification without an event source | `FeedbackMessageShow(...)` or `NotificationOpen(WidgetId)` |
| Scroll the page to a target widget | `ScrollToElement(WidgetId, IsSmooth, OffSet, …)` |
| Detect device / browser / network state inside a flow | `IsPhone`, `IsTablet`, `IsDesktop`, `GetDeviceType`, `GetNetworkStatus`, `GetBrowser` |
| Configure a provider-level option not exposed as an input | `Set<Provider>Configs(WidgetId, ProviderConfigs)` — see [`extensibility.md`](extensibility.md) |
| Wire a provider-native event the pattern doesn't expose | `Set<Provider>Event(WidgetId, EventName, Handler)` — see [`extensibility.md`](extensibility.md) |

**Don't reach here when:**

- The pattern's INPUT exposes the same behavior (`Sidebar.IsOpen`, `Tabs.StartingTab`). Inputs are simpler and re-render with state.
- The pattern's EVENT already fires what you want to listen to (`OnSelected`, `OnTabChange`, `OnSlideMoved`). Don't override; subscribe.
- The behavior is a `Set<Provider>Configs` / `Set<Provider>Event` use case — that's [`extensibility.md`](extensibility.md), called from the pattern's `Initialized` handler.

## How to call

All Client Actions live on the **`OutSystemsUI`** reference and are invoked via an `ExecuteClientActionNode` inside a Screen / Client Action flow. The first argument is almost always the pattern instance's **`WidgetId`** — the runtime ID of the block instance, available as `<Pattern>.Id` when you have a direct reference, or from the pattern's `Initialized` event payload otherwise.

```
ScreenAction: OpenFilters
  StartNode
    → ExecuteClientActionNode SidebarOpen(WidgetId = FiltersSidebar.Id)
    → EndNode
```

In the Model API:

```csharp
var osui = eSpace.References.Named("OutSystemsUI");
var sidebarOpen = osui.ClientActions.Named("SidebarOpen");

var openNode = action.CreateNode<OutSystems.Model.Logic.Nodes.IExecuteClientActionNode>();
openNode.ClientAction = sidebarOpen;
openNode.SetArgumentValue(sidebarOpen.InputParameters.Named("WidgetId"), "FiltersSidebar.Id");
```

## Catalog

> `DEPRECATED_*` actions are kept for back-compat — **never call them in new code**, the non-DEPRECATED equivalents below cover every case. Listed only so you recognize them if you see them in older OMLs.

### Sidebar

| Action | Inputs | Purpose |
|---|---|---|
| `SidebarOpen` | `WidgetId:Text` | Slide the sidebar in. |
| `SidebarClose` | `WidgetId:Text` | Slide the sidebar out. |
| `SidebarToggleSwipe` | `WidgetId:Text`, `EnableSwipe:Boolean` | Enable/disable touch-swipe to open/close. |
| `SidebarClickOutsideToClose` | `WidgetId:Text`, `CloseOnOutsideClick:Boolean` | Dismiss on backdrop click. |

Typical wiring: header "Filters" button → `SidebarOpen(FiltersSidebar.Id)`. Apply/Cancel buttons inside → `SidebarClose` after they run their logic.

### BottomSheet

| Action | Inputs | Purpose |
|---|---|---|
| `BottomSheetOpen` | `WidgetId:Text` | Slide the bottom sheet up. |
| `BottomSheetClose` | `WidgetId:Text` | Slide it down. |

### Carousel

| Action | Inputs | Purpose |
|---|---|---|
| `CarouselNext` | `WidgetId:Text` | Advance one slide / page. |
| `CarouselPrevious` | `WidgetId:Text` | Go back one slide / page. |
| `CarouselGoTo` | `WidgetId:Text`, `ItemIndex:Integer` | Jump to a specific slide. |
| `CarouselToggleDrag` | `WidgetId:Text`, `HasDrag:Boolean` | Enable/disable mouse-drag. |
| `CarouselDisableOnRender` | `WidgetId:Text` | Disable the carousel mechanics (lock current slide). |
| `CarouselEnableOnRender` | `WidgetId:Text` | Re-enable a previously disabled carousel. |
| `SetCarouselDirection` | `WidgetId:Text`, `Direction:CarouselDirection Identifier` | Switch horizontal ↔ vertical at runtime. |

Use these to back **custom prev/next arrows** that sit outside the Carousel block's own pagination region. (For provider-level options like `perMove`, see `SetSplideConfigs` in [`extensibility.md`](extensibility.md).)

> Deprecated: `DEPRECATED_CarouselNext`, `DEPRECATED_CarouselPrevious`, `DEPRECATED_CarouselGoTo`, `DEPRECATED_CarouselUpdate`, `DEPRECATED_CarouselDisableSwipe`.

### DatePicker (single date)

| Action | Inputs | Purpose |
|---|---|---|
| `DatePickerOpen` | `WidgetId:Text` | Open the calendar overlay. |
| `DatePickerClose` | `WidgetId:Text` | Close it. |
| `DatePickerClear` | `WidgetId:Text` | Clear the selected value. |
| `DatePickerUpdateDate` | `WidgetId:Text`, `NewDate:Date Time` | Set the picker's value programmatically (without firing user-typed change). |
| `DatePickerUpdatePrompt` | `WidgetId:Text`, `Prompt:Text` | Change the placeholder text. |
| `DatePickerDisableDays` | `WidgetId:Text`, `DisabledDays:Date List` | Disable specific dates (blackouts, holidays). |
| `DatePickerDisableWeekDays` | `WidgetId:Text`, `DisableMondays:Boolean`, `…Tuesdays`, `…Wednesdays`, `…Thursdays`, `…Fridays`, `…Saturdays`, `…Sundays` | Disable whole weekdays (e.g. weekends-off booking). |
| `DatePickerSetLanguage` | `WidgetId:Text`, `Language:DatePickerLanguage Identifier` | Change locale at runtime. |
| `DatePickerSetEditableInput` | `WidgetId:Text`, `IsEditableInput:Boolean` | Allow/forbid typing into the input. |
| `DatePickerToggleNativeBehavior` | `WidgetId:Text`, `IsNative:Boolean` | Switch to / from the native browser picker. |

Provider extensibility for Flatpickr-specific options: `SetFlatpickrConfigs`, `SetFlatpickrEvent`, `UnsetFlatpickrEvent` — see [`extensibility.md`](extensibility.md).

> Deprecated: `DEPRECATED_DatePickerClearInputDate(InputId)`.

### DatePickerRange

| Action | Inputs | Purpose |
|---|---|---|
| `DatePickerRangeUpdateDates` | `WidgetId:Text`, `NewStartDate:Date Time`, `NewEndDate:Date Time` | Set both ends of a range together. |

(All Open/Close/Clear/Configs equivalents are shared with `DatePicker` — same Flatpickr provider, same instance APIs.)

### MonthPicker

| Action | Inputs | Purpose |
|---|---|---|
| `MonthPickerOpen` | `WidgetId:Text` | Open the picker. |
| `MonthPickerClose` | `WidgetId:Text` | Close it. |
| `MonthPickerClear` | `WidgetId:Text` | Clear selection. |
| `MonthPickerUpdateMonth` | `WidgetId:Text`, `NewMonth:MonthYear` | Set selected month programmatically. |
| `MonthPickerUpdatePrompt` | `WidgetId:Text`, `Prompt:Text` | Change placeholder. |
| `MonthPickerSetEditableInput` | `WidgetId:Text`, `IsEditableInput:Boolean` | Toggle typed input. |
| `MonthPickerSetLanguage` | `WidgetId:Text`, `Language:DatePickerLanguage Identifier` | Locale. |
| `MonthPickerGetMonthYearFromDate` | `Date:Date Time` | Helper: extract `MonthYear` record from a full `Date Time`. |

### TimePicker

| Action | Inputs | Purpose |
|---|---|---|
| `TimePickerOpen` | `WidgetId:Text` | Open. |
| `TimePickerClose` | `WidgetId:Text` | Close. |
| `TimePickerClear` | `WidgetId:Text` | Clear. |
| `TimePickerUpdateTime` | `WidgetId:Text`, `NewTime:Time` | Set value. |
| `TimePickerUpdatePrompt` | `WidgetId:Text`, `Prompt:Text` | Placeholder. |
| `TimePickerSetEditableInput` | `WidgetId:Text`, `IsEditableInput:Boolean` | Typed input toggle. |
| `TimePickerToggleNativeBehavior` | `WidgetId:Text`, `IsNative:Boolean` | Native vs. Flatpickr time picker. |

### Notification (toast)

| Action | Inputs | Purpose |
|---|---|---|
| `NotificationOpen` | `WidgetId:Text` | Show the notification toast. |
| `NotificationClose` | `WidgetId:Text` | Dismiss it. |

For the simpler "fire-and-forget" toast that doesn't require dropping a `Notification` widget on the screen, use **`FeedbackMessageShow`** below.

### FeedbackMessage (one-shot toast — no widget needed)

| Action | Inputs | Purpose |
|---|---|---|
| `FeedbackMessageShow` | `Message:Text`, `MessageType:Integer`, `EncodedHTML:Boolean`, `ExtendedClass:Text`, `CloseOnClick:Boolean` | Pop a one-shot toast (`MessageType` 1=Success, 2=Warning, 3=Error, 4=Info). |
| `FeedbackMessageClose` | *(none)* | Dismiss the active feedback message. |

Use after save/delete operations: `FeedbackMessageShow(Message="Saved", MessageType=1, EncodedHTML=False, ExtendedClass="", CloseOnClick=True)`.

### Tabs

| Action | Inputs | Purpose |
|---|---|---|
| `SetActiveTab` | `WidgetId:Text`, `TabsNumber:Integer` | Switch to tab N (0-indexed). |
| `EnableTabItem` | `WidgetId:Text` | Re-enable a previously disabled tab. |
| `DisableTabItem` | `WidgetId:Text` | Disable a single tab (per-`TabsHeaderItem`). |
| `TabsToggleSwipe` | `WidgetId:Text`, `EnableSwipe:Boolean` | Touch-swipe between tabs on/off. |

> Deprecated: `DEPRECATED_TabsGoTo(WidgetId, TabNumber)`, `DEPRECATED_TabsDisableSwipe(TabID)`.

### Accordion

| Action | Inputs | Purpose |
|---|---|---|
| `AccordionExpandAll` | `WidgetId:Text` | Expand every item in the Accordion. |
| `AccordionCollapseAll` | `WidgetId:Text` | Collapse every item. |
| `AccordionItemExpand` | `WidgetId:Text` | Expand one specific `AccordionItem` (pass that item's Id). |
| `AccordionItemCollapse` | `WidgetId:Text` | Collapse one specific item. |
| `AccordionItemAllowTitleEvents` | `WidgetId:Text` | Re-arm click-on-title to toggle. |

### Dropdown / DropdownSearch / DropdownTags (VirtualSelect provider)

| Action | Inputs | Purpose |
|---|---|---|
| `DropdownOpen` | `WidgetId:Text` | Open the popup. |
| `DropdownClose` | `WidgetId:Text` | Close it. |
| `DropdownTogglePopup` | `WidgetId:Text`, `EnablePopup:Boolean` | Enable/disable the popup entirely. |
| `DropdownClear` | `WidgetId:Text`, `SilentOnChangedEvent:Boolean` | Clear selection (optionally without firing `OnChanged`). |
| `DropdownClearValidation` | `WidgetId:Text` | Clear the not-valid message + styling. |
| `DropdownEnable` | `WidgetId:Text` | Re-enable a disabled dropdown. |
| `DropdownDisable` | `WidgetId:Text` | Disable interaction. |
| `DropdownGetSelectedValues` | `WidgetId:Text` | Return the currently selected option records. |
| `DropdownSetValue` | `WidgetId:Text`, `SelectedValues:DropdownOption List`, `SilentOnChangedEvent:Boolean` | Set selection programmatically (use `SilentOnChangedEvent=True` when seeding from `OnInitialize` to avoid an unwanted `OnChanged` cycle). |
| `DropdownNotValid` | `WidgetId:Text`, `ValidationMessage:Text` | Show a validation error on the dropdown. |

Provider extensibility: `SetVirtualSelectConfigs`, `SetVirtualSelectEvent`, `UnsetVirtualSelectEvent` — see [`extensibility.md`](extensibility.md).

### DropdownServerSide

| Action | Inputs | Purpose |
|---|---|---|
| `DropdownServerSideOpen` | `WidgetId:Text` | Open. |
| `DropdownServerSideClose` | `WidgetId:Text` | Close. |
| `DropdownServerSideClear` | `WidgetId:Text` | Clear selection. |
| `DropdownServerSideClearValidation` | `WidgetId:Text` | Clear error state. |
| `DropdownServerSideEnable` | `WidgetId:Text` | Enable. |
| `DropdownServerSideDisable` | `WidgetId:Text` | Disable. |
| `DropdownServerSideNotValid` | `WidgetId:Text`, `ValidationMessage:Text` | Show validation error. |

### RangeSlider (noUiSlider provider)

| Action | Inputs | Purpose |
|---|---|---|
| `RangeSliderEnable` | `WidgetId:Text` | Enable interaction. |
| `RangeSliderDisable` | `WidgetId:Text` | Disable. |
| `ResetRangeSlider` | `WidgetId:Text` | Reset to initial values. |
| `SetRangeSliderValue` | `WidgetId:Text`, `Value:Decimal` | Set the single-handle value. |
| `SetRangeSliderChangeOnDragEnd` | `WidgetId:Text` | Fire `OnValueChange` only on drag-release (not on every step). |

Provider extensibility: `SetNoUISliderConfigs`, `SetNoUISliderEvent`, `UnsetNoUISliderEvent` — see [`extensibility.md`](extensibility.md).

> Deprecated: `DEPRECATED_RangeSliderReset(WidgetId)`.

### RangeSliderInterval

| Action | Inputs | Purpose |
|---|---|---|
| `SetRangeSliderIntervalValue` | `WidgetId:Text`, `IntervalStart:Decimal`, `IntervalEnd:Decimal` | Set both ends of the interval. |
| `SetRangeSliderIntervalChangeOnDragEnd` | `WidgetId:Text` | Fire change only on drag-release. |
| `ResetRangeSliderInterval` | `WidgetId:Text` | Reset both handles. |

### Tooltip

| Action | Inputs | Purpose |
|---|---|---|
| `TooltipOpen` | `WidgetId:Text` | Force-show. |
| `TooltipClose` | `WidgetId:Text` | Force-hide. |

### Video

| Action | Inputs | Purpose |
|---|---|---|
| `VideoPlay` | `WidgetId:Text` | Start playback. |
| `VideoPause` | `WidgetId:Text` | Pause. |
| `VideoJumpToTime` | `WidgetId:Text`, `JumpToTime:Time` | Seek to timestamp. |
| `VideoGetState` | `WidgetId:Text` | Read current state (playing/paused/ended). |

> Deprecated: `DEPRECATED_VideoPlay`, `DEPRECATED_VideoPause`.

### ProgressBar

| Action | Inputs | Purpose |
|---|---|---|
| `SetProgressBarValue` | `WidgetId:Text`, `Progress:Integer` | Animate to a new percentage. |
| `ResetProgressBar` | `WidgetId:Text` | Reset to zero. |
| `ProgressApplyGradient` | `WidgetId:Text`, `GradientType:Gradient Identifier`, `Colors:GradientColor List` | Apply a multi-color gradient fill at runtime. |

### ProgressCircle

| Action | Inputs | Purpose |
|---|---|---|
| `SetProgressCircleValue` | `WidgetId:Text`, `Progress:Integer` | Animate to a new percentage. |
| `ResetProgressCircle` | `WidgetId:Text` | Reset to zero. |

(`ProgressApplyGradient` works for both `ProgressBar` and `ProgressCircle` — the same action targets either.)

### Rating

| Action | Inputs | Purpose |
|---|---|---|
| `RatingEnable` | `WidgetId:Text` | Re-enable interaction. |
| `RatingDisable` | `WidgetId:Text` | Make read-only. |

### StackedCards (swipe-deck pattern)

| Action | Inputs | Purpose |
|---|---|---|
| `StackedCardsSwipeLeft` | `WidgetId:Text` | Swipe the top card off to the left. |
| `StackedCardsSwipeRight` | `WidgetId:Text` | Swipe right. |
| `StackedCardsSwipeTop` | `WidgetId:Text` | Swipe up. |
| `StackedCardsUpdate` | `WidgetId:Text` | Force re-evaluate the stack (after data mutations). |

Use these to back Yes/No/Skip buttons next to a Tinder-style deck.

### FlipContent

| Action | Inputs | Purpose |
|---|---|---|
| `FlipContentFront` | `WidgetId:Text` | Show the front face. |
| `FlipContentBack` | `WidgetId:Text` | Show the back face. |
| `FlipContentToggle` | `WidgetId:Text` | Flip whichever side is visible. |

### Menu / Submenu / OverflowMenu

| Action | Inputs | Purpose |
|---|---|---|
| `MenuShow` | *(none)* | Show the app-level Menu block (e.g. mobile sidebar drawer). |
| `MenuHide` | *(none)* | Hide it. |
| `MenuReady` | `Callback:Object` | Run a callback once the Menu finishes initializing. |
| `MenuDestroy` | *(none)* | Tear down Menu listeners (typically on logout / layout swap). |
| `SetMenuListeners` | `WidgetId:Text` | Re-attach the Menu's event listeners after DOM mutations. |
| `SetMenuAttributes` | *(none)* | Refresh ARIA / data attributes on the Menu root. |
| `SetMenuIcon` | `MenuAction:MenuAction Identifier` | Switch the Menu trigger icon (hamburger ↔ close). |
| `SetMenuIconListeners` | *(none)* | Re-attach click listeners to the Menu icon trigger. |
| `SetActiveMenuItems` | `WidgetId:Text`, `ActiveItem:Integer`, `ActiveSubItem:Integer` | Mark a menu item (and optional sub-item) as the active route. |
| `SetBottomBarActiveElement` | `ActiveItem:Integer` | Mark the active item on a bottom-bar nav. |
| `IsMenuDraggable` | *(none)* | Return whether the Menu supports drag-to-open on this device. |
| `ToggleSideMenu` | *(none)* | Show/hide the side menu (paired with `LayoutSideMenu`). |
| `SubmenuOpen` | `WidgetId:Text` | Open a Submenu. |
| `SubmenuClose` | `WidgetId:Text` | Close it. |
| `SubmenuOpenOnHover` | `WidgetId:Text` | Arm hover-to-open behavior. |
| `SubmenuClickOutsideToClose` | `WidgetId:Text`, `CloseOnOutsideClick:Boolean` | Dismiss on backdrop click. |
| `OverflowMenuOpen` | `WidgetId:Text` | Open an OverflowMenu (3-dot more menu). |
| `OverflowMenuClose` | `WidgetId:Text` | Close it. |
| `OverflowMenuEnable` | `WidgetId:Text` | Enable. |
| `OverflowMenuDisable` | `WidgetId:Text` | Disable. |

### Layout / MasterDetail / Table / List

| Action | Inputs | Purpose |
|---|---|---|
| `LayoutReady` | *(none)* | Signal that the screen layout has finished mounting (for code that needs a stable DOM). |
| `LayoutDestroy` | *(none)* | Tear down layout-level listeners. |
| `IsLayoutNative` | *(none)* | Return whether the screen is running inside the native shell. |
| `MasterDetailSetContentFocus` | `ContentId:Text`, `TriggerItem:Text` | Move focus to the detail panel when an item is selected (for accessibility on master-detail screens). |
| `SetSelectedTableRow` | `TableId:Text`, `RowNumber:Integer`, `IsSelected:Boolean` | Programmatically select/deselect a row in a Table. |
| `ListItemHint` | `ListId:Text`, `HasLeftAction:Boolean`, `HasRightAction:Boolean`, `AnimationTime:Decimal` | Trigger the "swipe hint" animation on a list to teach users that left/right actions exist. |

### Offline data sync (PWA / hybrid)

| Action | Inputs | Purpose |
|---|---|---|
| `ConfigureOfflineDataSync` | `SyncOnOnline:Boolean`, `SyncOnResume:Boolean`, `RetryOnError:Boolean`, `RetryIntervalInSeconds:Integer` | Set the global offline-sync policy. |
| `StartOfflineDataSync` | `SyncUnit:Text`, `DiscardPendingSyncUnits:Boolean` | Kick off a sync run for a named unit. |
| `EndOfflineDataSync` | `HasError:Boolean`, `ErrorMessage:Text`, `AllowRetry:Boolean` | Signal completion (called from your sync logic — pair with `OnSync` events the framework raises). |

### Scroll / focus / accessibility utilities

| Action | Inputs | Purpose |
|---|---|---|
| `ScrollToElement` | `WidgetId:Text`, `IsSmooth:Boolean`, `OffSet:Integer`, `ElementParentClass:Text`, `ScrollDelay:Integer` | Scroll the viewport (or a scrollable parent) so the target widget is visible. |
| `SkipToContent` | `TargetId:Text` | Move focus to the main content (a11y "skip nav" pattern). |
| `FocusFirstInvalidInput` | `WidgetId:Text`, `IsSmooth:Boolean`, `ElementParentClass:Text` | After validation fails, scroll + focus the first input with an error inside a container. |
| `SetFocus` | `WidgetId:Text` | Move focus to a specific widget. |
| `SetActiveElement` | `WidgetId:Text`, `IsActive:Boolean` | Toggle an `is-active` class on a widget (for custom active states). |
| `SetAccessibilityRole` | `WidgetId:Text`, `Role:Text` | Set an ARIA role at runtime. |
| `SetAriaHidden` | `WidgetId:Text`, `IsHidden:Boolean` | Toggle `aria-hidden`. |
| `ToggleTextSpacing` | *(none)* | App-wide accessibility toggle that loosens letter/word/line spacing. |
| `MoveElement` | `WidgetId:Object`, `Target:Object` | Re-parent a widget in the DOM (rare — use only for portal-style overlays the framework doesn't natively support). |

### Device / browser / network detection

| Action | Inputs | Returns / Purpose |
|---|---|---|
| `IsDesktop` | *(none)* | Boolean — current breakpoint is desktop. |
| `IsTablet` | *(none)* | Boolean — current breakpoint is tablet. |
| `IsPhone` | *(none)* | Boolean — current breakpoint is phone. |
| `GetDeviceType` | *(none)* | Enum — Desktop / Tablet / Phone. |
| `GetDeviceOrientation` | *(none)* | Enum — Portrait / Landscape. |
| `GetIsTouch` | *(none)* | Boolean — touch input available. |
| `GetOS` | `UserAgent:Text` | Enum — parse OS from a user-agent string. |
| `GetBrowser` | *(none)* | Enum — browser family. |
| `IsRTL` | *(none)* | Boolean — current locale is right-to-left. |
| `IsWebApp` | *(none)* | Boolean — running as Reactive Web (vs. Mobile App). |
| `IsRunningAsPWA` | *(none)* | Boolean — installed as PWA. |
| `GetNetworkStatus` | *(none)* | Enum — Online / Offline. |
| `GetNetworkType` | *(none)* | Enum — Wi-Fi / Cellular / Ethernet / etc. |
| `SetDeviceBreakpoints` | `DeviceConfiguration:DeviceConfiguration` | Override the framework's default breakpoint thresholds. |

### Misc helpers

| Action | Inputs | Purpose |
|---|---|---|
| `TextEllipsis` | `Text:Text`, `NumberOfChars:Integer` | Return `Text` truncated with `…` if longer than `NumberOfChars`. |
| `BinaryToURLImage` | `Image:Binary Data` | Convert binary image data to a usable URL (object URL). |
| `ShowPassword` | `WidgetId:Text` | Toggle a password input's reveal/hide. |
| `AddFavicon` | `URL:Text` | Add/replace the page favicon at runtime. |
| `SetLang` | `Lang:Text` | Set the `<html lang="…">` attribute. |
| `LoadOutSystemsUIScript` | *(none)* | Force-load the OutSystems UI JS bundle (for late-mounted regions). |

> Deprecated: `DEPRECATED_ShowPassword()` — use `ShowPassword(WidgetId)`.

## Wiring example — header button opens filters Sidebar

```
ScreenAction: OpenFilters
  StartNode
    → ExecuteClientActionNode SidebarOpen(WidgetId = FiltersSidebar.Id)
    → EndNode

Button "Filters" → OnClick → OpenFilters
```

Model API:

```csharp
var osui = eSpace.References.Named("OutSystemsUI");
var sidebarOpen = osui.ClientActions.Named("SidebarOpen");

var openFilters = screen.CreateScreenAction("OpenFilters");
var start = openFilters.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
var exec = openFilters.CreateNode<OutSystems.Model.Logic.Nodes.IExecuteClientActionNode>();
exec.ClientAction = sidebarOpen;
exec.SetArgumentValue(sidebarOpen.InputParameters.Named("WidgetId"), "FiltersSidebar.Id");
start.Target = exec;
exec.Target = openFilters.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>();

filtersButton.OnClick.Destination = openFilters;
```

## Anti-patterns

❌ **Calling `<Pattern>Open` without `WidgetId`.** Most actions require the runtime ID — `<Pattern>.Id` resolves the right one. Hardcoding a name string fails.

❌ **Calling `SetActiveTab` instead of binding `Tabs.StartingTab`** at screen-init time. Use the INPUT for the initial value; use the Client Action only for runtime switches.

❌ **Calling `DropdownSetValue` from `OnInitialize` without `SilentOnChangedEvent=True`.** Triggers a spurious `OnChanged` cycle that re-runs filter actions.

❌ **Wiring `SidebarClose` after every internal action (Apply, Save, …) and ALSO leaving `IsOpen` bound** to a LocalVariable. Pick ONE strategy — bound-input OR imperative-action — not both, or they fight.

❌ **Using `DEPRECATED_*` actions in new code.** Each has a non-deprecated equivalent above. The deprecated variants are kept only so existing OMLs continue to compile.

❌ **Calling provider-config actions (`Set<Provider>Configs`) from a regular ScreenAction instead of from the pattern's `Initialized` event.** Before init, the provider doesn't exist yet — the call is silently dropped. See [`extensibility.md`](extensibility.md).

❌ **Using `FeedbackMessageShow` for a pinned/persistent notice.** Toasts auto-dismiss; for in-page banners use `Alert` or a `Notification` widget with `IsOpen` bound to a LocalVariable.

## Related

- [`extensibility.md`](extensibility.md) — `Set<Provider>Configs` / `Set<Provider>Event` (provider-level config + custom events) and the direct JS API for cases not covered by Client Actions.
- [`patterns/interaction.md`](patterns/interaction.md) — pattern inputs/events (the declarative side; Client Actions are the imperative complement).
- [`patterns/navigation.md`](patterns/navigation.md) — `Tabs`, `Pagination`, breadcrumbs.
- [`widget-conventions.md`](widget-conventions.md) — `ExecuteClientActionNode` JSON shape for raw widget specs.
