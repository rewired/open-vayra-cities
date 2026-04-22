# ADR 0011: Keep placed stops in local map state with canonical minimal stop type

## Status

Accepted

## Date

2026-04-22

## Context

`MapWorkspaceSurface` validates stop-placement clicks but did not persist successful placements in a typed local stop model, and no visual stop markers were rendered after valid placement.

For the bus-first MVP, we need a small canonical stop type and deterministic local map feedback without introducing line, route, simulation, economy, or persistence concerns.

## Decision

- Add a canonical domain stop type under `apps/web/src/domain/types/` with:
  - branded `StopId`
  - geographic `StopPosition`
  - minimal `Stop` shape with optional display label
- Keep placed stops as local in-memory React state in `MapWorkspaceSurface`.
- Append a stop only after placement validation succeeds.
- Generate deterministic placeholder labels (`Stop 1`, `Stop 2`, ...).
- Render each placed stop as a lightweight MapLibre marker tied to this local state.

## Consequences

- Valid placements now produce persistent visual feedback inside the current map session.
- Stop modeling remains tightly scoped to placement and display, with no premature network/simulation/economy coupling.
- Domain typing for stop identity and location is reusable for later transit network slices.
