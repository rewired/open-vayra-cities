# ADR 0094: Selected-line inspector compact header and dialog-first actions

## Status

Accepted (2026-04-25)

## Context

The selected-line inspector still exposed frequency editing and multiple dense detail sections in one always-expanded stack.
This made line detail scanning noisier and mixed summary context with heavy diagnostics.
We need a UI-only compaction that keeps existing domain/projection/session ownership unchanged, including line frequency validation semantics and projection-driven unavailable states.

## Decision

1. Keep a compact selected-line header in the inspector with identity, stop count, ordered stop sequence, and segment/time summary when baseline metrics exist.
2. Add compact top pills for blockers/warnings and service readiness status.
3. Replace always-visible detailed sections with five explicit actions: `Edit frequency`, `Service plan`, `Departures`, `Projected vehicles`, and `Route baseline`.
4. Move each detail section into a dedicated dialog component under `apps/web/src/inspector/`.
5. Preserve existing frequency callback contract: empty input means unset, positive minutes are valid, and zero/negative values remain invalid via current validation plumbing.
6. Render truthful unavailable messages in dialog content whenever selected-line projection data or baseline metrics are null/missing.

## Consequences

- Selected-line scanability improves by separating summary context from deep detail.
- Frequency editing is still available but no longer competes with summary information in the default inspector view.
- Existing service/departure/vehicle/route details remain accessible without changing projection logic.
- Domain constants for time-band ids and display labels remain the single source of truth in frequency editing UI.

## Explicit non-goals (this slice)

- no simulation logic changes
- no routing/projection algorithm changes
- no transport-mode scope expansion
- no mobile layout support
- no persistence/backend/session-ownership changes
