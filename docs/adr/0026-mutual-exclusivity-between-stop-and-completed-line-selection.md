# ADR 0026: Enforce mutual exclusivity between stop and completed-line selection

## Status

Accepted

## Date

2026-04-22

## Scope

Refine map workspace selection transitions so stop selection and completed-line selection are explicitly mutually exclusive within inspect interactions, while keeping line-draft state independent.

## Constraints

- Keep behavior scoped to current desktop, browser, bus-first MVP interaction rules.
- Do not merge draft-line state with completed-line selection state.
- Do not broaden into generalized multi-entity selection frameworks.
- Preserve existing mode boundaries for stop placement and line drafting.

## Decision

- When a completed line is selected from the line overlay, clear stop selection first and then update completed-line selection.
- When a stop is selected in inspect mode, clear the selected completed line before projecting stop selection.
- On inspect-mode empty-map clicks, clear both stop and completed-line selections.
- In build-line mode, ignore completed-line overlay clicks so drafting interactions do not accidentally select completed lines.
- Keep line-draft state (`draftLineState`) separate from selected completed-line state (`selectedLineId`).

## Explicit non-goals

This slice does **not** introduce:

- draft-line selection via line-overlay clicks
- persistence or server synchronization for selections
- route/simulation/economy behavior changes
- mobile interaction variants

## Consequences

- Inspector output now reflects a single active entity context (stop or completed line) during inspect interactions.
- Build-line workflow remains focused on ordered stop capture without accidental completed-line selection changes.
- Selection rules become deterministic and mode-aware without changing broader game systems.
