# ADR 0061: Selected-line readiness inspector projection boundary

## Status

Accepted

## Date

2026-04-24

## Context

A pure domain evaluator (`evaluateLineServiceReadiness`) already provides deterministic selected-line readiness status, summary counters, and typed issues.

`App.tsx` must render selected-line readiness information without re-implementing readiness semantics in UI-local logic.

## Decision

- Compute selected-line readiness in `App.tsx` only by calling `evaluateLineServiceReadiness(selectedLine, placedStops)` when a line is selected.
- Render a compact readiness section in the line-selected inspector only, projecting evaluator outputs for:
  - readiness status
  - configured time-band count
  - missing/unset time-band count
  - route segment count
  - blocker issue count
  - warning issue count
  - short issue list with message and optional code tag
- Keep readiness semantics (validation rules, status derivation, issue typing/severity) owned by the domain evaluator.
- Keep this slice structural-only and inspector-only.

## Consequences

- The inspector now surfaces deterministic readiness diagnostics without duplicating domain rule logic.
- UI rendering remains a projection layer over domain results, preserving architecture boundaries.
- Future readiness rule updates can remain evaluator-local and automatically flow to inspector output.

## Non-goals

- no simulation, demand, economy, revenue, satisfaction, or vehicle KPI additions
- no readiness rule changes in this slice
- no mobile or multimodal scope expansion
- no persistence or backend integration
