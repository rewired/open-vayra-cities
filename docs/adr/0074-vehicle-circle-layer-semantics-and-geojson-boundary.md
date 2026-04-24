# ADR 0074: Vehicle circle layer semantics and map-native GeoJSON boundary

## Status

Accepted (2026-04-24)

## Context

The projected vehicle map slice moved from a symbol/glyph marker contract to a circle-marker contract so projected buses render as compact geometric points instead of text-driven symbols.

The same slice also clarified degraded-vs-normal marker semantics and tightened the render boundary so map rendering consumes only typed vehicle GeoJSON output from domain projection builders.

## Decision

Adopt a circle-based vehicle layer contract with explicit degraded-vs-normal styling semantics and retain map-native GeoJSON rendering as the only map ingestion boundary for projected vehicles.

### Included

- replace symbol-glyph vehicle marker styling with circle-layer paint semantics
- preserve projected vehicle status rendering split between normal and degraded markers through canonical feature properties
- keep map consumption limited to vehicle GeoJSON features produced by the projection/builder layer
- keep map rendering responsibilities presentation-only (source/layer sync + style application)

## Styling semantics

- **Normal projected marker**: rendered with the canonical primary vehicle fill/stroke styling
- **Degraded projected marker**: rendered with the canonical degraded fill treatment while preserving the same geometric marker shape
- **Shared marker geometry**: both statuses remain circle markers so the status distinction is semantic/color-driven, not a shape-system expansion

## Map-native boundary

The map layer must consume prebuilt vehicle GeoJSON and must not compute simulation, fleet, depot, or routing truth during rendering.

- GeoJSON builders own feature property mapping (`degraded` and related marker metadata)
- map workspace code owns source/layer registration and paint/layout application
- no domain truth is re-derived inside map event/render handlers

## Consequences

- projected vehicle rendering is independent from glyph/font text behavior
- degraded markers remain visually distinct without introducing new runtime simulation state
- GeoJSON builder test coverage remains the contract guard for map-facing vehicle features
- HUD diagnostic counts can consume the same projected/degraded split without map-layer coupling

## Explicit non-goals

- no expansion into authoritative vehicle simulation execution
- no fleet sizing, assignment, or dispatch model introduction
- no depot/layover operations modeling
- no routing algorithm expansion or reroute engine adoption
- no persistence/import/export/savegame scope expansion
