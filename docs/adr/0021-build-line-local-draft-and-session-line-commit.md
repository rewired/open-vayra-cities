# ADR 0021: Keep build-line drafting local to the map workspace with explicit cancel/complete controls

## Status

Accepted

## Date

2026-04-22

## Context

`build-line` mode existed as a placeholder mode without local draft behavior.
Marker clicks always performed stop inspection selection, and line completion controls did not exist.

The MVP needs a minimal but deterministic line-draft workflow that:
- captures ordered stop ids from marker clicks
- does not overlap with stop placement behavior
- supports explicit abandon/complete actions
- commits completed lines only to local in-memory session state

## Decision

- Add a typed local draft-line state in `MapWorkspaceSurface` containing ordered `StopId[]` and draft metadata.
- In `build-line` mode, treat marker clicks as append-only line drafting in click order.
- Keep stop placement limited to `place-stop` mode and keep inspect map-click selection clearing isolated to `inspect`.
- Add explicit build-line controls:
  - **Cancel draft** to abandon the current draft
  - **Complete line** gated by a centralized minimum-stop constant
- Introduce a canonical line-build domain constant `MINIMUM_STOPS_PER_LINE` with value `2`.
- Persist completed lines in local in-memory session state only.

## Explicit non-goals

This decision does **not** introduce:
- persistent storage for lines
- line geometry/routing generation
- schedule/timetable simulation behavior
- backend synchronization

## Consequences

- Build-line mode now has deterministic, user-visible draft lifecycle controls.
- Marker interaction semantics are explicitly mode-dependent without cross-mode leakage.
- Minimum stop requirements are centralized and reusable instead of hard-coded in UI logic.
