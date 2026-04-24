# ADR 0053: Routing-support boundary and fallback truth contract

## Status

Accepted

## Date

2026-04-24

## Context

Slice 015 introduced canonical line-route segment types, fallback segment generation, and route-segment-first completed-line rendering.

The project needs an explicit boundary statement for why routing support is introduced now without claiming full pathfinding or service simulation completeness.

## Decision

- Introduce a **routing-support boundary** now so completed lines can carry deterministic, typed `routeSegments` required for map projection and structural inspector debugging.
- Treat the current fallback resolver (`buildFallbackLineRouteSegments`) as an explicit deterministic baseline:
  - it resolves ordered adjacent stop pairs only
  - it generates deterministic segment ids and deterministic output order
  - it computes fallback geometry and fallback travel-time values for structural continuity
- Treat fallback geometry and fallback travel-time outputs as **non-final service truth**:
  - these values are baseline placeholders for continuity/debug visibility
  - they must not be interpreted as validated operational routing accuracy
- Keep completed-line rendering aligned to **segment geometry first**:
  - GeoJSON projection prefers persisted `routeSegments[*].geometry.coordinates`
  - stop-order straight-line fallback remains only for segments lacking routed geometry

## Consequences

- Completed lines now have a clear typed routing-support boundary that unblocks deterministic map rendering and route-baseline inspector output.
- Fallback outputs remain intentionally constrained and explicitly labeled, reducing accidental over-claims about routing realism.
- Segment-first rendering keeps line geometry compatible with future routing resolver upgrades without changing line ownership boundaries.

## Non-goals

- No full graph routing engine.
- No traffic model integration.
- No demand, economy, or vehicle simulation.
- No persistence model changes.
- No backend or remote routing integration.
- No multimodal expansion beyond the bus-first MVP.
