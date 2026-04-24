# ADR 0068: Current-minute line vehicle projection boundary

## Status

Accepted (2026-04-24)

## Context

Slice 021 added deterministic active-time-band departure schedule projection. That output provides departure minutes and per-line route travel totals, but map vehicle marker projection is still missing.

The next scoped step is to derive **projection-only** current-minute vehicle marker positions from existing departure output, without introducing simulation execution or route recomputation.

## Decision

Add a pure domain projection module that converts active departures into per-vehicle map projection output.

### Included

1. Add canonical line-vehicle projection domain types with:
   - branded projection id
   - projection status union (`projected`, `degraded-projected`, `unavailable`)
   - per-vehicle projection contract (line/time-band/departure/elapsed/progress/current-segment/coordinate/status/degraded note)
   - per-line projection result type
   - network summary type (projected totals, degraded totals, lines with projected vehicles, active time-band id)
2. Add `projectLineVehicleNetwork` as a pure projection function that consumes:
   - current simulation minute
   - active time-band id
   - existing departure schedule projection output
   - completed lines with stored `line.routeSegments`
3. Derive active departures with deterministic bounds:
   - `departureMinute <= currentMinuteOfDay < departureMinute + totalRouteTimeMinutes`
4. Use stored `line.routeSegments` only for segment progress and coordinate interpolation; no route recomputation.
5. Map degraded upstream departure/service conditions to `degraded-projected` per-vehicle status.
6. Emit optional line-level unavailable notes when a line cannot project markers, while returning no markers for those lines.
7. Preserve immutability by treating all input values as read-only and returning new projection objects.

## Rationale

This preserves architecture boundaries from DD/TDD: simulation and routing truth stay outside UI components, and projection remains a deterministic, typed read model.

Reusing departure schedule output avoids duplicating service/configuration semantics and keeps degraded-state ownership centralized.

## Consequences

- Current-minute map marker projection can consume one canonical domain output.
- Degraded and unavailable conditions are explicit at projection boundaries without introducing execution semantics.
- Later simulation slices can replace or enrich marker motion logic without rewriting UI-local logic.

## Explicit non-goals

- no vehicle dispatch/execution model
- no fleet/depot/layover logic
- no demand/economy/passenger scoring changes
- no route recalculation
- no persistence/import/savegame/backend changes
- no multimodal expansion
- no mobile behavior
