# ADR 0027: Add explicit inspector selection-priority state machine

## Status

Accepted

## Date

2026-04-22

## Scope

Refine the right-panel inspector rendering in `App.tsx` to an explicit selection-priority state machine that resolves one visual state at a time.

## Constraints

- Keep behavior inside the existing desktop-only, browser-based, bus-first MVP shell.
- Keep the selected-line inspector minimal and structural only.
- Do not add routing, service, simulation, economy, or persistence fields.
- Preserve existing map workspace callbacks and ownership boundaries for stop/line selection.

## Decision

- Add a typed inspector state resolver that applies strict priority in this order:
  1. selected line exists
  2. else selected stop exists
  3. else neutral empty state
- Render only one inspector block at a time based on that resolved mode.
- Keep the selected-line inspector limited to `id/label`, stop count, and ordered stop-id summary.

## Explicit non-goals

This slice does **not** introduce:

- generalized entity-inspector framework abstractions
- additional line operational metrics
- demand, service, economy, or simulation output in the inspector
- mobile inspector behavior variants

## Consequences

- Inspector output is deterministic and no longer additive across stop/line sections.
- Selection-priority behavior is explicit and testable via typed state resolution.
- The line inspector remains within the MVP structural scope.
