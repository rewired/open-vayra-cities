# ADR 0022: Centralize line-building constants and expose minimal selected-line inspector data

## Status

Accepted

## Date

2026-04-22

## Context

Line-building rules were partially centralized (`MINIMUM_STOPS_PER_LINE`) but the module scope and naming were narrow, and placeholder line-label generation still depended on local literals.

The shell inspector also lacked a selected-line projection contract, so structural line details (id/label, stop count, ordered stops) were not visible when a completed line was selected.

## Decision

- Introduce `apps/web/src/domain/constants/lineBuilding.ts` as the canonical constants module for this slice.
- Define and document:
  - `MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE = 2`
  - `LINE_BUILD_PLACEHOLDER_LABEL_PREFIX = 'Line'`
- Replace local magic values in line drafting/completion flows with those constants.
- Add a minimal line-selection projection from `MapWorkspaceSurface` to `App` and render only structural selected-line fields in the inspector.

## Explicit non-goals

This decision does **not** introduce:

- demand, economy, or service data in inspector rendering
- persistence or backend synchronization for line entities
- generalized multi-entity inspector frameworks

## Consequences

- Line-building thresholds and deterministic placeholder label semantics are now centrally defined in the domain constants layer.
- Inspector output remains scope-safe and structural while still reflecting selected completed line information.
