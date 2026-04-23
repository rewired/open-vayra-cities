# ADR 0042: Map-native line GeoJSON rendering and feature selection

## Status

Accepted

## Date

2026-04-23

## Context

`MapWorkspaceSurface` rendered completed and draft lines through an SVG overlay projected from map coordinates. That required explicit projection refresh wiring (`render`/`idle` binding) and a React-side line-segment projection utility.

For this slice, line rendering should be map-native like stop rendering: typed GeoJSON sources plus MapLibre line layers. We also need line selection through layer-constrained feature interactions instead of SVG polyline click handlers.

## Decision

Adopt map-native GeoJSON line rendering and interaction for completed and draft lines:

- remove SVG overlay projection state/binding (`toProjectedLineSegments`, projection refresh tick state, and projection refresh setup wiring)
- introduce typed line GeoJSON builders in `apps/web/src/map-workspace/lineGeoJson.ts` for:
  - completed session lines (`sessionLines`)
  - draft line preview (`draftLineState.stopIds`)
- centralize completed/draft line source IDs, layer IDs, and style/filter constants in `apps/web/src/map-workspace/mapRenderConstants.ts`
- register line sources and line layers in map initialization and refresh source data whenever line/stop selection inputs change
- bind completed-line selection through map feature handlers (`map.on('click', completed-line-layer-id, ...)`) and preserve mode behavior:
  - build-line mode does not select completed lines
  - line selection clears stop selection to preserve inspect semantics

## Consequences

- Line rendering no longer depends on screen-projection lifecycle plumbing in React state.
- Selected vs non-selected completed-line styling is encoded via source feature properties and layer filters.
- Interaction ownership shifts to map layer feature clicks, matching the stop interaction architecture.

## Non-goals

- No street-routed line geometry in this slice (rendering remains schematic stop-order paths).
- No simulation, economy, or routing model changes.
- No mobile-specific behavior.
