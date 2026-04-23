# ADR 0043: Feature-first map interaction entry and inspect empty-click clearing

## Status

Accepted

## Date

2026-04-23

## Context

`MapWorkspaceSurface` already used layer-constrained feature handlers for stop and completed-line interactions. At the same time, inspect-mode map-level click handling still cleared selection on every map click, which could race or compete with feature click intent.

The gameplay semantics must remain unchanged:

- manual street-constrained stop placement in `place-stop`
- ordered stop-based line drafting in `build-line`
- explicit user-triggered line completion
- inspect-mode empty-map click clears current stop/line selection

We need a minimal architecture adjustment so interaction entry points are explicitly feature-first, without introducing a generalized interaction framework.

## Decision

Keep interaction architecture small and local while making feature interactions authoritative:

- retain layer-constrained feature click handlers as the entry points for stop and completed-line selection behavior
- add narrow property decoders in `MapWorkspaceSurface`:
  - `decodeStopIdFromFeatureProperties(...)` for typed `StopId`
  - `decodeLineIdFromFeatureProperties(...)` for typed line IDs
- gate inspect-mode map-level clearing behind a rendered feature check over interactive selection layers (stop circle and completed-line layers)
- only run inspect clear behavior on non-feature map clicks

## Consequences

- Stop and completed-line feature clicks preserve current selection priority semantics without being overridden by inspect map clearing.
- Inspect-mode empty-map clicks continue to clear both selected stop and selected completed line.
- The interaction change remains adapter-sized and local to `MapWorkspaceSurface`; no scene abstraction is introduced.

## Non-goals

- No changes to stop placement validation or street snapping behavior.
- No changes to ordered draft-stop capture or explicit line completion flow.
- No simulation, economy, persistence, or mobile behavior changes.
