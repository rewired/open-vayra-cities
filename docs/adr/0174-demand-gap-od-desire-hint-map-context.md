# 0174. Demand Gap OD Desire Hint Map Context

Date: 2026-05-03

## Status

Accepted

## Context

When planning transit routes, users need to understand where unserved demand wants to go, or where unreachable destinations expect passengers from. Slice 172/173 introduced a pure projection (`DemandGapOdContextProjection`) that pairs a focused demand gap with highly ranked Origin-Destination (OD) candidates based on distance and active weight.

To make this projection actionable without forcing users to rely entirely on the textual Inspector, we need to provide a spatial context on the map. However, this visualization must strictly avoid misrepresenting itself as a real passenger route, assigned flow, or detailed simulation artifact.

## Decision

We will implement a projection-only map context for focused demand gap OD candidates.

1. **Desire Hints, Not Routes:** The visualization consists of straight contextual lines ("desire hints") between the focused demand gap and likely OD candidates. It uses a dashed, subordinate style (`MAP_DEMAND_GAP_OD_CONTEXT_HINT_PAINT`) to clearly distinguish it from completed or draft transit lines.
2. **Pure Projection:** A pure MapLibre GeoJSON builder (`demandGapOdContextGeoJson.ts`) derives the LineString features from the existing `DemandGapOdContextProjection`. It does not calculate demand, routing, or passenger assignment.
3. **Visibility Control:** The layer (`demand-gap-od-context`) is registered in the map layer flyout as "Demand gap hints". Its default visibility is `false` to avoid map clutter.
4. **Architectural Safety:** Map code solely consumes the projection; no domain or simulation state is moved into React or MapLibre components.

## Consequences

* **Positive:** Users receive immediate, spatial planning guidance for connecting unserved demand areas.
* **Positive:** By capping candidates and using straight lines, the map remains performant and visually bounded.
* **Negative:** Users might still misinterpret straight dashed lines as actual shortest-path walking or routing routes, requiring careful UI wording (hence "hints").
* **Constraint:** Adding this feature introduces another map layer that must participate in the deterministic custom layer ordering.
