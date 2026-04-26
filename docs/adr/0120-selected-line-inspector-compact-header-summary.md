# ADR 0120: Selected-Line Inspector Compact Header Summary

- Status: Accepted
- Date: 2026-04-26

## Context

The selected-line inspector previously split core line context across a table layout, stop-sequence disclosure, three KPI cards, and a separate readiness pill section.

Slice 071 requires a denser and faster-scannable header that keeps the same data truth while removing expansion-heavy or duplicated framing.

## Decision

Replace the top selected-line inspector structure with one compact summary header that contains:

- line badge (line id),
- readable line label with inline rename entrypoint,
- compact metadata rows for topology, service pattern, stop and segment counts, runtime, readiness, warnings, and blockers.

The removed elements are:

- ID/Label table row structure,
- ordered-stop chip preview and `+N more` behavior,
- expandable full stop-sequence details block,
- three KPI summary cards,
- separate readiness card section.

All displayed values continue to originate from existing selected-line panel/projection inputs; no domain simulation or readiness logic is changed.

## Consequences

- The selected-line header becomes more compact while preserving the same source-of-truth data inputs.
- Rename behavior is now directly accessible in line detail view without adding new domain write paths.
- Inspector visual complexity decreases without introducing new transport modes, simulation behavior, or persistence changes.
