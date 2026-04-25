# ADR 0103: Inspector compact-table value alignment

## Status

Accepted (2026-04-25)

## Context

Inspector and selected-line dialogs use a shared `inspector-compact-table` style for compact summary rows. The prior rule left-aligned both header and value cells.

That reduced scanability for numeric summaries and made it harder to visually compare values across rows, while some textual/status values still read better left-aligned.

## Decision

1. Keep `inspector-compact-table th` explicitly left-aligned.
2. Set `inspector-compact-table td` to right alignment by default for compact value scanning.
3. Introduce one explicit opt-out class (`inspector-compact-table__value--left`) for readability exceptions where values are primarily textual/status content.
4. Apply opt-out usage only where needed in player-facing summaries:
   - Network
   - Selected line
   - Service plan
   - Departures
   - Projected vehicles

## Consequences

- Compact metric/value tables now present stronger visual consistency for right-aligned value scanning.
- Textual and status-heavy cells can remain readable without changing global table behavior.
- The alignment contract remains centralized and reusable across inspector/dialog surfaces.

## Explicit non-goals (this slice)

- no simulation, projection, or domain logic changes
- no changes to route baseline segment table alignment contract
- no mobile or multimodal scope expansion
