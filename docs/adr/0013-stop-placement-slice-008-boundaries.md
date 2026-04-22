# ADR 0013: Consolidate stop-placement Slice 008 boundaries and non-goals

## Status

Accepted

## Date

2026-04-22

## Context

Slice 008 completes the first playable stop-placement behavior in the map workspace.

Prior ADRs already introduced the key mechanics incrementally:
- explicit shell-level tool mode gating for map clicks
- street-oriented placement validation at click locations
- a minimal canonical stop type for local placement output

This ADR records the combined boundary for Slice 008 so constraints remain explicit as follow-up slices add lines and routing.

## Decision

- Keep **mode gating** explicit at the workspace boundary:
  - stop placement only runs when the active mode is `place-stop`
  - non-placement modes keep map clicks non-destructive
- Keep **street-based validation** lightweight and map-local:
  - validate stop placements from street-related map features near the click target
  - reject invalid non-street targets with immediate local feedback
  - do not introduce route/path computation to approve a stop click
- Keep the **minimal stop model** narrow:
  - only the stop identity and map position needed for local placement/rendering
  - deterministic placeholder naming for immediate operator feedback
  - no additional network, timetable, or economic semantics attached to stop creation

## Explicit non-goals

Slice 008 does **not** introduce:
- line creation or line editing
- routing/pathfinding semantics
- simulation behavior or economy progression
- persistence, save/load, backend sync, or multiplayer state

## Consequences

- Stop placement remains implementation-friendly and testable as a local UI/map slice.
- Follow-up slices can build lines/routing/simulation on top of a stable placement contract instead of retrofitting mixed responsibilities.
- Scope drift risk is reduced by keeping Slice 008 behavior and non-goals explicit in one ADR.
