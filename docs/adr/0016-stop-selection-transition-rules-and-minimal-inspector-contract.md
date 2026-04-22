# ADR 0016: Define explicit stop selection transitions with a minimal inspector contract

## Status

Accepted

## Date

2026-04-22

## Context

The previous stop selection projection exposed additional selected-stop fields (`label`, `lng`, `lat`) to the shell inspector.
That exceeded the immediate slice requirement for explicit selection transitions and introduced avoidable payload coupling.

The requested behavior is narrow and explicit:
- click stop X => `selectedStopId = X`
- click stop Y => `selectedStopId = Y`
- click non-stop map area in inspect mode => clear selection (`null`)

## Decision

- Keep selection state shape minimal and explicit: `null | { selectedStopId: StopId }`.
- Use one canonical selection source (`selectedStopId`) for both:
  - map marker selected styling
  - right-panel inspector selection rendering
- Keep marker click behavior deterministic:
  - marker click sets selection to the clicked marker stop id
  - map background click in inspect mode clears selection
- Preserve current placement behavior:
  - valid place-stop click selects the newly created stop
  - invalid place-stop click clears selection

## Explicit non-goals

This decision does **not** introduce:
- generalized editor/selection frameworks
- multi-entity inspector payloads
- additional inspector detail contracts unrelated to selection identity

## Consequences

- Selection transitions are now easier to reason about and test.
- Inspector/map coupling is reduced to stop identity, avoiding duplicate data projections.
- Future inspector detail expansion requires explicit scope and contract updates.
