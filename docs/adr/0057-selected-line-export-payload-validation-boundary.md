# ADR 0057: Selected-line export payload validation boundary and tolerance constants

## Status

Accepted

## Date

2026-04-24

## Context

Slice 016 introduces selected-line export JSON payloads as deterministic fixtures and interoperability artifacts.

Without a canonical domain validator boundary, import/read paths can drift into ad-hoc parsing logic, throw-first control flow, duplicated schema literals, and unreviewed tolerance values for geometry and travel-time consistency checks.

The project needs a pure validator that:

- accepts `unknown` input
- reports multiple typed validation issues in one pass where practical
- reuses canonical schema/kind constants and domain types
- enforces line/stop/segment/metadata coherence checks required by the slice

## Decision

- Add a domain-level selected-line export validator as a pure function that returns a discriminated typed result (`ok: true` with typed payload, or `ok: false` with typed issue list).
- Define and export documented public validator types:
  - issue code union
  - validation issue shape
  - validation result union
- Reuse existing canonical selected-line export schema constants (`SELECTED_LINE_EXPORT_SCHEMA_VERSION`, `SELECTED_LINE_EXPORT_KIND`) and domain canonical sets (`MVP_TIME_BAND_IDS`, route-status values).
- Centralize validation tolerances in domain constants (`selectedLineExportValidation` constants module) rather than inline numeric literals.
- Validate structural and coherence rules for:
  - root required fields
  - schema/kind discriminators
  - parseable timestamp
  - source metadata source string
  - line shape, ordered stops, and frequency map
  - stops shape, coordinate ranges, uniqueness, and references
  - route segment shape, uniqueness, line/stop consistency, adjacency, geometry endpoint consistency, and travel-time totals
  - metadata count and included-time-band canonical-order coherence

## Consequences

- Consumers can safely parse unknown payloads without exception-driven happy-path logic.
- Validation failures become machine-addressable through stable typed issue codes.
- Schema and domain truth remain centralized and less prone to drift.
- Geometry and travel-time consistency checks become deterministic and reviewable via canonical tolerance constants.

## Non-goals

- No import persistence pipeline.
- No backend/API synchronization.
- No expansion beyond selected-line export payload validation.
- No changes to simulation, economy, demand, or multimodal scope.
