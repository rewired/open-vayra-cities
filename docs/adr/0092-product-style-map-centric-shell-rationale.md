# ADR 0092: Product-style map-centric shell presentation boundaries

## Status

Accepted (2026-04-24)

## Context

Recent desktop-shell presentation slices introduced a unified top bar, compact left rail, contextual inspector density controls, a selected-line bottom tray, and a dark basemap.
We need one ADR that records the shared rationale as a coherent product-style map-centric shell decision while making explicit that these are layout/presentation choices only and do not change simulation/domain semantics.

## Decision

1. Preserve a product-style, map-centric shell where the map remains the dominant workspace and surrounding chrome is compact, contextual, and read-only where possible.
2. Keep simulation/session controls integrated in one top bar so time context and primary actions remain co-located without introducing new behavior semantics.
3. Keep the left rail constrained to real existing workspace tools only; do not add placeholder modes or speculative controls.
4. Keep the inspector contextual and planning-focused; do not turn it into a fake product dashboard with invented metrics.
5. Keep the bottom selected-line tray limited to existing selected-line/session/projection data already available in the app state.
6. Explicitly avoid fake KPIs, fabricated data, and out-of-scope feature surfacing in shell UI surfaces.
7. Use a dark basemap for map-first legibility and UI contrast while keeping map bootstrap ownership centralized.

## Consequences

- The shell reads like a coherent desktop product surface while preserving strict map-first focus.
- Top bar, left rail, inspector, and bottom tray remain composition choices, not new domain/simulation owners.
- Presentation density improves without introducing speculative controls or unverifiable metrics.
- Existing semantic contracts for simulation clock, projections, and selected-line data remain unchanged.

## Explicit non-goals (this slice)

- no simulation logic changes
- no routing behavior changes
- no demand/economy/passenger/vehicle model expansion
- no new KPIs beyond existing computed/projected values
- no fake dashboard panels or fabricated status cards
- no new tool modes beyond currently implemented tools
- no persistence/backend/import/export contract expansion
- no mobile layout scope
- no multimodal transport scope expansion
