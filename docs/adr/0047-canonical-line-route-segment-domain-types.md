# ADR 0047: Canonical line-route segment domain types

## Status

Accepted

## Date

2026-04-24

## Context

The line domain model currently stores ordered stop ids and per-time-band frequencies, but it does not yet provide a canonical typed shape for routed inter-stop segments.

Without a shared route-segment contract, future route computation and simulation projections risk ad-hoc object shapes, weakly typed status semantics, or duplicated distance/travel units.

## Decision

Add a dedicated route domain module at `apps/web/src/domain/types/lineRoute.ts` that defines:

- branded `LineSegmentId`
- tuple `RouteGeometryCoordinate` as `[longitude, latitude]`
- branded `RouteDistanceMeters`
- branded `RouteTravelMinutes`
- narrow `RouteStatus` union with explicit fallback status (`fallback-routed`)
- canonical `LineRouteSegment` interface carrying segment identity, line ownership, from/to stop ids, ordered geometry, distance, in-motion travel, dwell, total travel, and status

Extend canonical `Line` with a readonly `routeSegments` collection of `LineRouteSegment` entries.

Initialize newly completed lines with `routeSegments: []` to keep current behavior unchanged while preserving the typed field contract.

## Consequences

- Route-segment payloads now have a strict, reusable domain contract.
- Segment distance/travel values are strongly typed through branded units.
- Route status semantics are explicit, including fallback route provenance.
- Existing line creation flow remains behaviorally unchanged, now with an explicit empty route-segment baseline.

## Non-goals

- No route computation or geometry generation logic is added in this slice.
- No changes to line-building UX, stop placement rules, or frequency editing behavior.
- No expansion beyond bus-first MVP scope.
