# ADR 0034: Stop marker interaction affordance and draft-membership state

## Status

Accepted

## Date

2026-04-23

## Scope

Document Slice 014b interaction updates for stop markers in `MapWorkspaceSurface` build-line workflows.

## Constraints

- Build-line drafting remains stop-marker click append only.
- Existing explicit draft controls (`Complete line`, `Cancel draft`) remain unchanged.
- No freehand or raw map click line creation may be introduced.
- Marker state projection must preserve strong typing for draft membership.

## Decision

- Increase stop marker practical click target size and strengthen marker interaction affordances for desktop use (pointer cursor, stronger hover/active state).
- Add keyboard-focus affordance support for marker elements via focus-visible styling on focusable marker elements.
- Extend marker synchronization to project draft-membership state with a dedicated CSS class (`map-workspace__stop-marker--draft-member`) so append state is confirmed immediately.
- Plumb draft-membership state into marker synchronization as `ReadonlySet<StopId>` to keep the marker projection boundary intentionally typed.

## Explicit non-goals

Slice 014b does **not** introduce:

- any changes to ordered stop append model
- any automatic line completion behavior
- any changes to explicit `Complete line` / `Cancel draft` controls
- any freehand line geometry editing
- simulation, routing, demand, economy, persistence, or backend changes

## Consequences

- Desktop marker interactions are more reliable and visually legible in build-line mode.
- Draft membership feedback is immediate at marker level during append interactions.
- Marker projection contracts remain type-safe and explicit.
