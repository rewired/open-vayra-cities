# ADR 0073: Vehicle circle-layer rendering contract for projected markers

## Status

Accepted (2026-04-24)

## Context

ADR 0070 introduced map-native vehicle marker rendering as a symbol-layer contract that depended on text/glyph styling. That worked for early projection visibility, but it couples projected vehicle markers to font/glyph behavior and text-halo semantics.

For projected bus markers, we only need compact positional dots with high street/stop contrast and degraded-status signaling. A circle layer is the more direct MapLibre primitive for that requirement.

## Decision

Replace the vehicle marker render contract from symbol-specific layout/paint exports to a circle-paint export consumed by the existing vehicle layer id/source id pair.

### Included

- keep canonical `MAP_SOURCE_ID_VEHICLES` and `MAP_LAYER_ID_VEHICLES`
- render vehicles using `type: 'circle'`
- style vehicle markers via one canonical circle-paint constant
- preserve degraded-status color signaling through `['get', 'degraded']`
- add explicit marker stroke contrast for legibility against map basemap and stop markers

## Rationale

### Why circle instead of symbol

Vehicle markers are geometric dots, not text. Circle layers remove glyph/text-field dependencies and avoid style fragility tied to font availability or symbol layout behavior.

### Why preserve source and layer ids

Keeping canonical ids stable avoids unnecessary churn in source update wiring and layer registration order, while still allowing style-contract evolution.

### Why keep degraded-driven color expression

`degraded` is already exported by vehicle projection GeoJSON properties as a render-only status cue. Reusing that property preserves projection-to-render boundary clarity without introducing new map-specific status derivation.

## Consequences

- vehicle markers no longer depend on text-field/glyph rendering paths
- marker legibility improves via explicit radius and stroke contrast
- projection feature property contract remains unchanged (`degraded` drives color choice)

## Explicit non-goals

- no authoritative runtime vehicle simulation state
- no demand/economy/passenger/depot/dispatch scope expansion
- no map interaction behavior changes for vehicles
- no multimodal or mobile scope expansion
