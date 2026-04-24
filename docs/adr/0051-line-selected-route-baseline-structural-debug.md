# ADR 0051: Line-selected route baseline structural debug inspector

## Status

Accepted

## Date

2026-04-24

## Context

Completed lines now carry canonical `routeSegments` with distance, in-motion travel time, dwell time, total travel time, and explicit route status.

The line-selected inspector currently exposes only minimal line identity and stop-order fields, which makes route-segment travel baselines hard to inspect during routing/debug slices.

## Decision

Add a compact `Route baseline` block under the line-selected inspector in `apps/web/src/App.tsx` that:

- projects aggregate route metrics from selected-line `routeSegments`:
  - segment count
  - total distance
  - total in-motion time
  - total dwell time
  - total line time
- renders per-segment rows with:
  - `fromStopId`
  - `toStopId`
  - distance and travel timing values
  - route status label
- uses explicit route status label text `Fallback routed` for `fallback-routed` segments
- displays explicit fallback disclaimer text when any segment is `fallback-routed` and avoids accuracy claims

## Consequences

- Route-segment baseline values are visible directly from inspector state for structural/debug verification.
- Fallback route status is explicit at both aggregate and per-segment levels.
- Existing line frequency editing remains unchanged and co-located with line-selected inspector context.

## Non-goals

- No demand, economy, or vehicle KPIs are added.
- No simulation logic changes are introduced.
- No routing algorithm, geometry, or segment-generation behavior changes are introduced.
