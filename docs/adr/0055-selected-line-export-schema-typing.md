# ADR 0055: Selected-line export schema typing baseline

## Status

Accepted

## Date

2026-04-24

## Context

The codebase lacked a dedicated domain module for selected-line export payload typing, which risked ad-hoc object shapes at public export boundaries.

Route-segment fields in export payloads must remain directly aligned to canonical `LineRouteSegment` truth to avoid accidental recomputation or drift.

## Decision

- Add `apps/web/src/domain/types/selectedLineExport.ts` as the canonical selected-line export type module.
- Define one canonical schema version constant:
  - `SELECTED_LINE_EXPORT_SCHEMA_VERSION = "cityops-selected-line-export-v1"`
- Define one payload discriminator literal type:
  - `SelectedLineExportKind = "selected-line"`
- Define typed interfaces for:
  - payload root block
  - selected-line block
  - exported route-segment block
  - exported stop block
  - lightweight metadata block
- Keep exported route-segment fields aligned with canonical `LineRouteSegment` fields by type reference, including:
  - segment id
  - line id
  - from/to stop id
  - ordered geometry
  - distance meters
  - in-motion minutes
  - dwell minutes
  - total minutes
  - status

## Consequences

- Selected-line export payload boundaries are now explicit and strongly typed.
- Export schema versioning and payload discrimination are centralized in one canonical module.
- Route-segment export field contracts stay coupled to canonical route truth, reducing schema drift risk.

## Non-goals

- No runtime serialization/deserialization logic is introduced.
- No persistence, backend, or API contract expansion is introduced.
- No routing behavior changes or recomputation logic is introduced.
