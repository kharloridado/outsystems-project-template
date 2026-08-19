---
name: outsystems-maps
description: OutSystems Maps — Map and Marker blocks (Google/Bing/AWS provider variants). Use when adding interactive maps, plotting markers from data, handling location-pick interactions, or composing map + sidebar layouts.
---

# OutSystems Maps

> **Asset:** OutSystems Maps (separate Forge component).
> **Live sample:** [outsystemsui.outsystems.com/OutSystemsMapsSample](https://outsystemsui.outsystems.com/OutSystemsMapsSample/Map)
> **Forge listing (O11):** [outsystems.com/forge/component-overview/9909/outsystems-maps-o11](https://www.outsystems.com/forge/component-overview/9909/outsystems-maps-o11)
> **Forge listing (ODC):** [outsystems.com/forge/component-overview/15930/outsystems-maps-odc](https://www.outsystems.com/forge/component-overview/15930/outsystems-maps-odc)

## What it is

OutSystems Maps lets you embed an interactive map (currently Google Maps; AWS Maps as an alternative variant) with markers, info windows, route plotting, and click events. Provided as a Forge component (install per-app, not built into OutSystems UI).

Two main blocks:

- **`Map`** — the map container. Configure size, initial position, zoom, type (satellite/roadmap), and provider API key.
- **`Marker`** — placed inside `Map`, represents a single pin on the map.

There's also `Marker_AdvancedFormat` for custom marker icons and `Map_StaticMap` for static (non-interactive) maps.

## When to use Maps

| Need | Approach |
|---|---|
| Show a single location | `Map` with one `Marker`. |
| Show many locations from data | `Map` with `Marker` inside an `IList` over an aggregate. |
| Pick a location | `Map` with `OnMapClick` event that adds a `Marker` at the clicked coordinates. |
| Static thumbnail map (no interaction) | `Map_StaticMap`. |
| Route between two points | `Map` with `Marker`s at start/end and `Polyline` (or use the routes API extension). |

## Map Block

The `Map` block is the container.

| Input | Type | Purpose |
|---|---|---|
| `Provider` | `MapProvider` Identifier | `Google` (default), `Bing`, etc. depending on the variant installed. |
| `APIKey` | Text | Provider API key. **Don't hardcode** — use a Site Property. |
| `Width` / `Height` | Text (CSS) | Map dimensions. |
| `Center` | Text or `Coordinates` record | Initial center as `"lat,lng"` or a record with `Latitude` and `Longitude`. |
| `InitialZoom` | Integer | Zoom level (0–20+). |
| `MapTypeId` | `MapType` Identifier | `Roadmap`, `Satellite`, `Hybrid`, `Terrain`. |
| `Markers` | `Marker` List | Optional pre-built marker list. Alternative: drop `Marker` blocks inside the `Map` placeholder. |
| `OptionalConfigs` | Record | Misc — disable controls, set styles, etc. |
| `ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `Map.Content` | Children: `Marker` blocks, info overlays, etc. |

**Events** (most useful):

| Event | Payload | Purpose |
|---|---|---|
| `OnMapReady` | — | Map fully loaded — initialize state. |
| `OnMapClick` | `Latitude`, `Longitude` | User clicked a non-marker spot. |
| `OnError` | `ErrorMessage` | API key invalid, provider error. |

## Marker Block

Drops a pin. Goes inside the `Map.Content` placeholder.

| Input | Type | Purpose |
|---|---|---|
| `Position` | Text or `Coordinates` record | `"lat,lng"` of the marker. |
| `Title` | Text | Tooltip / accessibility label. |
| `IconUrl` | Text | Custom icon image (overrides default pin). |
| `Label` | Text | Single-character label drawn on the pin. |
| `Draggable` | Boolean | User can drag the marker. |
| `Animation` | Identifier | `Drop`, `Bounce`, `None`. |
| `OptionalConfigs` | Record | Marker info window content, advanced flags. |

| Placeholder | Contents |
|---|---|
| `Marker.Content` | Optional info window content shown on click. |

**Events:**

| Event | Payload | Purpose |
|---|---|---|
| `OnMarkerClick` | `MarkerInfo` | User clicked the marker. |
| `OnMarkerDragEnd` | `Latitude`, `Longitude` | After a drag (when `Draggable: True`). |

## Minimal example — single location

```jsonc
{
  "Object": "UIBlockInstanceWidget",
  "SourceBlock": "Map",
  "Arguments": [
    { "Object": "Argument", "Parameter": "APIKey",      "Value": "Site.GoogleMapsAPIKey" },
    { "Object": "Argument", "Parameter": "Width",       "Value": "\"100%\"" },
    { "Object": "Argument", "Parameter": "Height",      "Value": "\"400px\"" },
    { "Object": "Argument", "Parameter": "Center",      "Value": "\"38.7223,-9.1393\"" },
    { "Object": "Argument", "Parameter": "InitialZoom", "Value": "12" },
    { "Object": "Argument", "Parameter": "MapTypeId",   "Value": "Entities.MapType.Roadmap" }
  ],
  "PlaceholdersContent": [{
    "Object": "PlaceholderContentWidget",
    "Placeholder": "Map.Content",
    "Widgets": [{
      "Object": "UIBlockInstanceWidget",
      "SourceBlock": "Marker",
      "Arguments": [
        { "Object": "Argument", "Parameter": "Position", "Value": "\"38.7223,-9.1393\"" },
        { "Object": "Argument", "Parameter": "Title",    "Value": "\"OutSystems HQ\"" }
      ],
      "PlaceholdersContent": []
    }]
  }]
}
```

## Multiple markers from an aggregate

Wrap `Marker` in an `IList` bound to your aggregate. Each list iteration places one pin.

```jsonc
"PlaceholdersContent": [{
  "Placeholder": "Map.Content",
  "Widgets": [{
    "Object": "List",
    "Source": "GetStores.List",
    "content": [{
      "Object": "UIBlockInstanceWidget",
      "SourceBlock": "Marker",
      "Arguments": [
        { "Parameter": "Position",
          "Value": "GetStores.List.Current.Store.Latitude + \",\" + GetStores.List.Current.Store.Longitude" },
        { "Parameter": "Title", "Value": "GetStores.List.Current.Store.Name" }
      ],
      "PlaceholdersContent": [{
        "Placeholder": "Marker.Content",
        "Widgets": [
          { "Object": "Container", "Style": "\"padding-base\"",
            "content": [
              { "Object": "TextWidget", "Text": "Store details:" },
              { "Object": "Expression", "Value": "GetStores.List.Current.Store.Address" }
            ]}
        ]
      }]
    }]
  }]
}]
```

## Add a marker on click

Wire the `OnMapClick` event to a ScreenAction that appends a `Marker` record to a List variable, then `RefreshDataNode` the part of the screen that renders markers (or use a more direct provider-specific action exposed by the component).

See [How to add a marker on map click](https://success.outsystems.com/Documentation/11/Developing_an_Application/Design_UI/Patterns/Using_Mobile_and_Reactive_Patterns/Interaction/Map/How_to_add_a_marker_on_map_click).

## API key handling

- **Always** store the provider API key in a Site Property (e.g., `GoogleMapsAPIKey`), not in module CSS or directly in the `APIKey` argument as a literal.
- Restrict the key in the provider console to your app's domain to avoid abuse.
- For Mobile Apps, restrict the key by app bundle identifier.

## Composition with OutSystems UI

Maps are large visual elements. Common compositions:

- **Map + sidebar list** → `ColumnsSmallRight` with `Column1` = Map, `Column2` = list of locations. Clicking a list item updates `Map.Center`.
- **Map inside a Card** → `Card` wrapping a Map for a polished container with shadow / padding.
- **Filter bar above the map** → `Container` row with search/dropdown filters that update the aggregate driving the markers, then `RefreshDataNode`.

## Performance

- **Cluster markers** when showing many. Most map providers support marker clustering — enable via `OptionalConfigs` (provider-specific). Don't render 1000 raw `Marker`s on screen.
- **Don't re-render the map on every interaction.** The map block initializes once on `OnMapReady`. Updating markers is far cheaper than reinitializing the map.
- **Pre-cache map tiles** for known regions if your app shows the same area repeatedly (provider-specific configuration).

## Accessibility

- Maps are inherently visual. For users who can't see the map, provide an alternative `TableRecords` view of the same data (toggleable).
- Markers expose their `Title` for screen readers — set it descriptively.
- The map container should have an `aria-label` describing what's shown ("Map of nearby stores").
- Keyboard users can pan/zoom most provider maps via standard keys; don't disable provider-default keyboard support.

See [`common/accessibility.md`](../../common/accessibility.md).

## Anti-patterns

- **Hardcoded API key.** Always Site Property.
- **Single Map with thousands of markers.** Cluster.
- **Maps inside heavy parent loops** (e.g., a Map per row in a list). Each map is heavy — render one map at a time.
- **Custom map widgets built from raw HTML.** Use the Maps component — it handles provider quirks and lifecycle.
- **Mixing OutSystems Maps and Google Maps Markers** (the older Forge component). Pick one.

## Reference

- [Live sample](https://outsystemsui.outsystems.com/OutSystemsMapsSample/Map) — interactive examples of every Map / Marker feature.
- [How to use the Map component](https://success.outsystems.com/Documentation/11/Developing_an_Application/Design_UI/Patterns/Using_Mobile_and_Reactive_Patterns/Interaction/Map/How_to_use_the_Map_component) — getting started.
- [How to add a marker on map click](https://success.outsystems.com/Documentation/11/Developing_an_Application/Design_UI/Patterns/Using_Mobile_and_Reactive_Patterns/Interaction/Map/How_to_add_a_marker_on_map_click).
- [Forge: OutSystems Maps (O11)](https://www.outsystems.com/forge/component-overview/9909/outsystems-maps-o11).
- [Forge: OutSystems Maps (ODC)](https://www.outsystems.com/forge/component-overview/15930/outsystems-maps-odc).
- [Forge: OutSystems Maps Sample (O11)](https://www.outsystems.com/forge/component-overview/10984/outsystems-maps-sample-o11) — example app to install and inspect.
