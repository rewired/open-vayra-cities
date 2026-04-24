# ADR 0070: Map vehicle render contracts from derived projections

## Status

Accepted (2026-04-24)

## Context

Slice 023 introduced current-minute line vehicle projection output in the domain layer, but map rendering still had no canonical source/layer contracts for vehicle markers.

The map layer must consume already-derived projection output only and avoid embedding projection semantics in UI/runtime map code.

## Decision

Add map-workspace vehicle rendering contracts that:

1. introduce canonical vehicle source/layer ids and symbol paint/layout constants in `mapRenderConstants.ts`,
2. add a typed `vehicleGeoJson.ts` builder that accepts derived network vehicle projection output and emits GeoJSON point features,
3. include feature properties for projected vehicle id, line id, projection status, and degraded flag,
4. filter map markers to only `projected` and `degraded-projected` entries with non-null coordinates,
5. keep `unavailable` entries out of map rendering,
6. pass derived vehicle network projection data from `App.tsx` into `MapWorkspaceSurface`,
7. register and refresh vehicle source/layer via the same style-readiness lifecycle used for stops/lines.

## Rationale

This keeps the domain layer authoritative for projection truth while keeping map modules focused on typed rendering contracts and lifecycle-safe source/layer sync.

It also prevents map code from inferring service/departure logic and preserves strict layering between projection and UI rendering concerns.

## Consequences

- Vehicle markers now render from a canonical GeoJSON source/layer contract.
- Degraded projected vehicles are visible with explicit marker styling.
- Unavailable vehicles remain inspectable in domain data without being drawn as map markers.
- Map lifecycle consistency is preserved across stops, lines, and vehicles.

## Explicit non-goals

- no map-side vehicle projection recomputation
- no fleet/dispatch/depot simulation
- no demand/economy/passenger behavior changes
- no multimodal or mobile scope expansion
