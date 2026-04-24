# ADR 0069: Route-geometry distance-walk interpolation helper

## Status

Accepted (2026-04-24)

## Context

Current line-vehicle projection requires a reusable way to project a coordinate along routed segment geometry.

Interpolating only between the first and last coordinate of a segment discards intermediate shape points and yields incorrect positions for curved or multi-leg geometry.

## Decision

Add a pure domain projection helper in `apps/web/src/domain/projection/routeGeometryInterpolation.ts` that:

1. accepts ordered `RouteGeometryCoordinate` values and a raw segment progress ratio,
2. clamps progress to `[0, 1]` with explicit documented behavior,
3. requires at least two geometry coordinates,
4. walks each geometry leg by distance and interpolates inside the active leg,
5. returns a projected `[lng, lat]` coordinate,
6. imports no MapLibre APIs.

Also reuse this helper in line-vehicle projection to keep geometry interpolation logic centralized and domain-scoped.

## Rationale

This keeps projection math in domain modules, preserves strict route coordinate typing, and avoids React/map-layer ownership drift.

The helper also standardizes clamping and geometry validation behavior at a single boundary for future projection consumers.

## Consequences

- Multi-point route geometry now produces marker coordinates that follow ordered legs.
- Segment progress clamping and finite-ratio validation are explicit and testable.
- Map runtime dependencies remain outside interpolation logic.

## Explicit non-goals

- no route recomputation or traffic model
- no map-library runtime integration
- no multimodal or mobile scope expansion
- no simulation execution semantics
