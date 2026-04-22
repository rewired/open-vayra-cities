# ADR 0017: Clarify stop placement feedback with a typed UI contract

## Status

Accepted

## Date

2026-04-22

## Context

The map workspace previously rendered placement feedback in an ad-hoc inline conditional string inside the HUD row.
That made the placement interaction state harder to scan and offered no dedicated, always-visible placement-mode indicator while stop placement was active.

For this slice, feedback requirements are UI-layer only:
- show concise, persistent placement-mode status while `place-stop` is active
- keep feedback copy centralized and intentional
- model feedback shape explicitly with typed UI contracts
- avoid introducing routing, line planning, or simulation semantics

## Decision

- Introduce a small typed UI feedback contract in `MapWorkspaceSurface` that contains:
  - placement-mode indicator visibility
  - mode instruction copy
  - street-rule hint visibility/copy
  - last-attempt message
- Centralize placement feedback display strings in local UI constants instead of inline ternaries in JSX.
- Render a dedicated placement-mode overlay indicator whenever `activeToolMode === 'place-stop'`.
- Keep all changes inside the interaction/view layer with no new domain or simulation behavior.

## Explicit non-goals

This decision does **not** add:
- routing/pathfinding logic
- line editing semantics
- economy or passenger simulation behavior
- generalized notification or toast frameworks

## Consequences

- Placement-mode state is easier to understand at a glance.
- Feedback copy management is simpler and less error-prone.
- UI feedback remains narrowly scoped and does not expand gameplay semantics.
