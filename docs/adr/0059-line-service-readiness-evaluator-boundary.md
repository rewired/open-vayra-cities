# ADR 0059: Line service readiness evaluator boundary

## Status

Accepted

## Date

2026-04-24

## Context

The in-memory completed-line workflow now stores enough canonical structure (ordered stops, route segments, route statuses, and time-band frequencies) to support a deterministic pre-simulation readiness check.

Until demand/economy/simulation layers are introduced, the project still needs a typed, pure domain-level guard that can answer whether a completed line is structurally serviceable.

This guard must remain independent from React and MapLibre to preserve domain testability and avoid UI-layer ownership of service rules.

## Decision

- Add a dedicated domain readiness module at `apps/web/src/domain/readiness/lineServiceReadiness.ts`.
- Export strongly typed readiness contracts:
  - line readiness status union (`ready`, `partially-ready`, `blocked`)
  - issue severity
  - issue code
  - issue structure with optional `lineId` / `stopId` / `routeSegmentId` / `timeBandId`
  - readiness result shape with summary counts and flags
- Keep the evaluator pure and deterministic (`evaluateLineServiceReadiness`) against one in-memory line + placed stops + canonical time bands.
- Reuse canonical constants and domains instead of local literals, including:
  - `MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE`
  - canonical time-band ids (`MVP_TIME_BAND_IDS` by default)
  - canonical route statuses (`ROUTE_STATUSES`)
- Evaluate readiness using structural and configuration checks only:
  - line id/label validity
  - ordered-stop minimum and coherence
  - placed-stop reference existence
  - route-segment existence/count/adjacency/line-id consistency
  - route timing usability
  - known route status validation
  - canonical time-band presence
  - frequency validity (unset or positive finite)
  - at least one configured frequency and whether all canonical bands are configured
  - fallback-only routing detection

## Consequences

- The app gains a reusable readiness contract for future inspector and simulation-entry gating without coupling to map or component lifecycle code.
- Readiness results can be consumed by multiple surfaces through typed issue codes and summary flags.
- Service readiness remains intentionally structural/configuration-focused and does not imply demand/economy performance correctness.

## Non-goals

- no React/UI rendering changes
- no MapLibre integration changes
- no persistence/import/export changes
- no demand, economy, passenger, or vehicle simulation logic
- no multimodal scope expansion
- no mobile support
