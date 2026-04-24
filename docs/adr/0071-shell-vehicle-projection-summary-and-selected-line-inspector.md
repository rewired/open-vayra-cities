# ADR 0071: Shell vehicle projection summary and selected-line inspector

## Status

Accepted (2026-04-24)

## Context

Slice 023/025 introduced canonical current-minute vehicle projection output and map marker rendering, but the shell inspector still did not expose compact network-level vehicle totals or selected-line projected departure diagnostics.

The shell needs to consume existing projection output from the simulation clock and departure schedule without creating new authoritative vehicle state.

## Decision

In `App.tsx`:

1. derive `currentSimulationMinuteOfDay` and `activeSimulationTimeBandId` from the existing simulation clock state,
2. call `projectLineVehicleNetwork` with existing completed session lines plus network departure schedule projection output,
3. continue passing vehicle projection output into `MapWorkspaceSurface` as render-only input,
4. add compact network summary counters for projected and degraded projected vehicles,
5. add a selected-line projected vehicles section (count, active departure minutes, degraded note) driven only by selected-line vehicle projection output.

## Rationale

This keeps the simulation and projection boundaries explicit: clock and departure schedule remain authoritative inputs, vehicle projection stays pure/derived, and UI remains a consumer rather than an owner of vehicle execution state.

## Consequences

- The inspector now shows compact vehicle projection diagnostics at network and selected-line scope.
- Map vehicle marker input remains projection-driven with no new state owner for authoritative vehicles.
- No demand/economy/passenger/fleet/depot/layover/capacity KPI expansion is introduced.

## Explicit non-goals

- no authoritative vehicle runtime state in React
- no dispatch/depot/fleet execution modeling
- no demand/economy/passenger KPI additions
- no mobile-specific UI behavior
