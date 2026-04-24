# ADR 0067: Current time-band departure schedule projection

## Status

Accepted (2026-04-24)

## Context

Slice 020 introduced current active-time-band service projection status (`blocked`, `not-configured`, `configured`, `degraded`) and route-time summary values for completed lines.

The next planning step is a deterministic departure raster projection for the current active time band. This is needed to answer a narrow planning question before service execution exists:

> Given current active time band and configured headway, which theoretical departure minutes exist in that band?

This slice must remain projection-only and must not introduce execution semantics.

## Decision

Add a pure departure schedule projection layer that consumes active time-band + current service projection output and computes deterministic in-band departures.

### Included

1. Add canonical departure projection domain types for line-level output, projection status, selected-line inspector projection, and network summary totals.
2. Reuse Slice 020 service projection output as input truth:
   - `blocked` and `not-configured` map to departure status `unavailable`
   - `configured` maps to departure status `available`
   - `degraded` maps to departure status `degraded` (not blocked)
3. Derive departure minutes from canonical active time-band minute window with start inclusive/end exclusive semantics:
   - `startMinute, startMinute + headway, ...`
   - include only `startMinute <= departureMinute < endMinute`
4. Resolve split-band determinism (for `night`) by selecting the range that contains current simulation minute.
5. Derive previous departure, next departure, minutes until next departure, and departure count from the theoretical raster.
6. Reuse stored route segments only for total route-time summary projection; do not recalculate route segments.
7. Add a compact selected-line inspector departure section that displays status, headway, previous/next departure, minutes until next departure, departure count, and a bounded upcoming departures list.

## Rationale

Separating departure schedule projection from service execution preserves architectural boundaries: domain projection helpers can provide deterministic planning visibility while simulation/runtime execution can be introduced later without rewriting status/readiness contracts.

Reusing readiness/service projection outputs avoids duplicated logic ownership and keeps line blocking/configuration semantics centralized.

Deterministic headway raster output is sufficient for this slice because the question is schedule availability, not operational service realism.

## Consequences

- The selected-line inspector now shows active-band theoretical departures without introducing vehicle runtime behavior.
- Network-level and line-level departure counts remain pure projections derived from canonical time-band + headway values.
- Future slices can consume this projection as an input to execution models without coupling React components to scheduling semantics.

## Explicit non-goals

- no demand simulation
- no economy simulation
- no passenger assignment
- no vehicle operation model
- no actual service execution
- no route recalculation
- no import behavior
- no persistence
- no backend
- no savegame loading
- no scenario loading
- no fixture replay loader
- no multimodal expansion
- no mobile behavior
- no vehicle requirements, layovers, fleet assignment, or depot logic
