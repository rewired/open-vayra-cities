# ADR 0088: Static network summary debug disclosure compaction

## Status

Accepted (2026-04-24)

## Context

The inspector static network summary currently mixes high-priority planning signals and lower-priority diagnostic counters in one always-expanded table. This makes the panel harder to scan quickly during line planning workflows.

## Decision

1. Keep key summary rows always visible:
   - stops
   - completed lines
   - projected vehicles
   - active service band
   - service-status counts (completed, degraded, blocked)
2. Move lower-priority technical/diagnostic counters into a collapsed `Debug details` subsection:
   - degraded projected vehicles
   - configured service lines
3. Apply minimal inspector CSS updates for compact spacing and disclosure styling only.
4. Preserve existing projection wiring and service/projection semantics.

## Consequences

- The static network summary is easier to scan during normal planning use.
- Diagnostic counters remain available without occupying always-visible space.
- The change stays presentation-only and does not alter domain or simulation behavior.

## Explicit non-goals (Slice 034)

- no new metrics
- no projection or service semantic changes
- no simulation/domain logic relocation into UI
- no mobile or multimodal scope expansion
