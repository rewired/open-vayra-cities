# ADR 0041: Stop rendering via GeoJSON source/layers and feature click interactions

## Status

Accepted

## Date

2026-04-23

## Context

`MapWorkspaceSurface` previously used per-stop DOM markers (`createStopMarker` + `syncStopMarkers`) as the active rendering and interaction truth.

That approach fragments rendering ownership between map style layers and DOM overlays, and it keeps stop interaction wired through marker element listeners instead of map feature events.

For the current slice, we need a single typed map-native rendering path for stops so visual state (`selected`, draft membership, build-line interactivity) is projected through GeoJSON source data and style layers.

## Decision

Adopt a canonical map-native stop rendering pipeline:

- introduce canonical stop source/layer IDs in `apps/web/src/map-workspace/mapRenderConstants.ts`
- introduce a typed stop GeoJSON builder in `apps/web/src/map-workspace/stopGeoJson.ts`
- register one GeoJSON stop source plus circle/symbol stop layers during map load/init
- refresh stop source data whenever stop state inputs change (`placedStops`, `selectedStopId`, `draftLineState.stopIds`, active tool mode)
- replace marker DOM click handling with `map.on('click', <stop-layer-id>, ...)` feature interaction

Keep scope intentionally narrow:

- no routing/pathfinding changes
- no simulation/economy changes
- no mobile/layout scope changes

## Consequences

- Stop rendering truth is centralized in map source/layer data instead of per-stop DOM marker instances.
- Stop click behavior remains mode-aware (`inspect` selection / `build-line` append) while using feature-level map events.
- Map workspace keeps strict typed contracts for source data building and stop-feature properties.

## Non-goals

- No additions of non-bus transport modes.
- No persistence, backend, or multiplayer behavior.
- No redesign of line overlay architecture in this slice.
