# ADR 0081: Slice 023b map diagnostics and deterministic layer-order hardening

## Status

Accepted (2026-04-24)

## Context

Slice 023a fixed loaded-session source synchronization, but several map diagnostics and lifecycle boundaries still needed to be made explicit for stability and debuggability:

- builder feature counts versus source readback counts versus rendered-feature diagnostics are distinct signals and should not be conflated
- source `setData(...)` updates and style-readiness source/layer creation are different lifecycle concerns
- completed-line rendering should stay resilient when partial/invalid inputs are present
- custom-layer stack order must be enforced deterministically through one canonical order list

## Decision

1. Keep diagnostics explicitly split into:
   - **builder counts** (pure builder output cardinality)
   - **source counts** (MapLibre source readback cardinality)
   - **rendered counts** (currently rendered map features in interactive layers)
2. Preserve the lifecycle distinction between immediate source `setData(...)` writes for existing sources and style-ready source/layer creation for missing style artifacts.
3. Harden completed-line GeoJSON rendering behavior so insufficient geometry is filtered and deterministic feature cardinality remains stable.
4. Enforce explicit custom-layer order from one canonical helper-driven list and expose a deterministic helper for present custom-layer id listing.

## Consequences

- diagnostics become easier to reason about during map-sync regressions because counts have clear ownership boundaries
- reactive map data refreshes remain immediate when source handles already exist, without waiting for style-ready gates
- completed-line rendering becomes more robust to mixed valid/invalid line inputs
- custom-layer ordering remains deterministic after data-only sync passes and style transitions

## Explicit non-goals (Slice 023b)

- no changes to route computation or route-segment generation
- no changes to demand, economy, satisfaction, or simulation execution semantics
- no changes to selected-line export schema or fixture format
- no UI redesign beyond diagnostics/readability hardening
- no mobile support or multimodal scope expansion
