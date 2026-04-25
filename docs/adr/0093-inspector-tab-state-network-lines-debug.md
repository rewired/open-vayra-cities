# ADR 0093: Inspector tab-state model (`Network`, `Lines`, `Debug`)

## Status

Accepted (2026-04-25)

## Context

The inspector had grown into one vertically stacked surface that mixed network summaries, selected-line editing/detail sections, and development-oriented diagnostics in a single flow.
This reduced scanability and made line-detail interactions harder to contextualize.
We need a UI-only organization change that keeps existing projection consumption read-only and does not introduce new simulation/domain truth in React.

## Decision

1. Replace the stacked inspector composition with a UI-local tab state model under `apps/web/src/inspector/` with exactly three tabs: `Network`, `Lines`, and `Debug`.
2. Rename `Static network summary` to `Network` and keep this tab limited to concise network-level summary data.
3. Remove the standalone `Active mode: ...` line from inspector content.
4. Make `Lines` list-first by default and provide an explicit Back action when a selected-line detail view is shown.
5. Move technical/development diagnostics (raw ids, session counts, and schematic caveat text) into `Debug`.
6. Preserve existing selected-line inspector projection wiring and frequency-edit callback behavior (no new simulation/domain semantics in UI).

## Consequences

- Inspector scanability improves by separating planning summaries, line workflows, and diagnostics into explicit tabs.
- The network summary remains concise and presentation-focused.
- Selected-line detail becomes an intentional drill-down from a completed-line list surface.
- Debug-only implementation details no longer compete with planning-first inspector content.
- Existing domain/simulation/projection ownership boundaries remain unchanged.

## Explicit non-goals (this slice)

- no simulation logic changes
- no route computation changes
- no new transport-mode scope
- no mobile layout support
- no persistence/backend/session model changes
- no new projection truth introduced in UI components
