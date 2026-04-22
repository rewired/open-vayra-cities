# ADR 0014: Keep map workspace selection local and stop-only

## Status

Accepted

## Date

2026-04-22

## Context

The map workspace now supports local stop placement with pointer telemetry and placement feedback.
A follow-up slice needs a minimal selection state that can represent either:
- no selection
- a single selected stop by canonical stop identity (`StopId`)

There is a risk of prematurely introducing a generic entity-selection framework before line editing, routing, and other domain objects exist in scope.

## Decision

- Introduce a narrow local selection state in `MapWorkspaceSurface`:
  - `null` means no selection
  - `{ selectedStopId: StopId }` means exactly one selected stop
- Keep this selection state independent from:
  - pointer telemetry (`interactionState`)
  - stop placement feedback (`placementFeedback`)
- Keep selection behavior slice-local to map workspace stop interactions:
  - successful stop placement selects the placed stop
  - invalid placement clears selection
- Do not introduce cross-entity selection abstractions, registries, or shared selection frameworks in this slice.

## Explicit non-goals

This decision does **not** introduce:
- generic map entity selection contracts
- multi-select behavior
- non-stop selection targets
- global/store-level selection state

## Consequences

- Selection semantics stay explicit, strongly typed, and aligned with the bus-first MVP scope.
- Future slices can widen selection intentionally when domain requirements exist, instead of inheriting premature abstractions.
