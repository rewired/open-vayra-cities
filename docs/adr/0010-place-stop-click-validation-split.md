# ADR 0010: Split neutral click telemetry from stop-placement click validation

## Status

Accepted

## Date

2026-04-22

## Context

`MapWorkspaceSurface` previously handled all click outcomes in one neutral interaction path and accepted `place-stop` clicks without validating whether the target represented a street-related map feature.

For the bus-first MVP, stop placement must stay constrained to plausible street geometry while remaining local to the map UI slice and avoiding routing or network semantics.

## Decision

- Keep neutral pointer/click telemetry as its own local concern that always updates pointer status.
- Add a separate `place-stop` click handler that runs only when tool mode is `place-stop`.
- Validate placement eligibility using current map style metadata (`layers` and related source/source-layer hints) plus rendered-feature queries at click point.
- Reject invalid placement targets and emit minimal local UI feedback in the map HUD.

## Consequences

- `inspect` mode retains neutral click behavior only.
- `place-stop` mode no longer permits unrestricted free placement.
- Validation remains lightweight and local, without introducing routing/pathfinding/network coupling.
