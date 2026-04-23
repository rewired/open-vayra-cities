# ADR 0030: Add line-selected frequency editing with shell-owned session line state

## Status

Accepted

## Date

2026-04-23

## Scope

Enable minimal frequency editing for completed lines in the `line-selected` inspector while preserving canonical time-band keys and desktop-only workflow simplicity.

## Constraints

- Use canonical MVP time-band ids and labels.
- Keep edits in current in-memory session state only.
- Allow unset frequency values per band.
- Reject zero and negative values with simple inline feedback.
- Avoid form frameworks or advanced analytics UI.
- Ensure draft lines are excluded from frequency configuration edits.

## Decision

- Lift completed session line ownership (`sessionLines`) and selected completed line id (`selectedLineId`) from `MapWorkspaceSurface` to `App`.
- Update `MapWorkspaceSurface` to receive session lines and selection as props and expose mutation callbacks (`onSessionLinesChange`, `onSelectedLineIdChange`) for map-originated interactions.
- Extend the `line-selected` inspector panel to render one numeric input per canonical time band with label + interval editing semantics in minutes.
- Bind inspector inputs to selected completed line frequency state and persist valid positive values using `createLineFrequencyMinutes(...)`.
- Treat empty input as unset (`null`) and provide inline error text for invalid non-positive values.

## Explicit non-goals

This slice does **not** introduce:

- frequency editing for draft lines
- schedule generation or dispatch logic
- economy/demand analytics controls
- persistence or backend synchronization
- mobile-specific UI behavior

## Consequences

- Inspector edits now directly mutate completed line frequency configuration in active session memory.
- Canonical time-band constants remain the single source for editor field generation.
- Draft and completed line responsibilities stay separated, preventing accidental frequency config on incomplete drafts.
