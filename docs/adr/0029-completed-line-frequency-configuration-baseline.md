# ADR 0029: Add completed-line frequency configuration baseline

## Status

Accepted

## Date

2026-04-23

## Scope

Add minimal typed line-frequency configuration structure and initialize completed lines with canonical per-time-band unset values.

## Constraints

- Preserve desktop-only, bus-first MVP scope.
- Keep frequency configuration limited to line identity linkage, time-band keys, and frequency values.
- Do not add schedule, vehicle, economy, or demand semantics in this slice.
- Keep exported symbols documented and strongly typed.

## Decision

- Add `LineFrequencyMinutes` as a branded positive-finite number type in `apps/web/src/domain/types/line.ts`.
- Add `LineFrequencyByTimeBand` keyed by canonical `TimeBandId` with nullable/optional unset support.
- Extend `Line` to include `frequencyByTimeBand`.
- Add `createUnsetLineFrequencyByTimeBand()` to create an initialized per-band map where each canonical time band starts as `null`.
- Update `MapWorkspaceSurface` line completion flow so each newly completed line stores that initialized per-band frequency configuration in session state.

## Explicit non-goals

This slice does **not** introduce:

- frequency editing UI
- schedule generation
- vehicle assignment
- economy or demand coupling
- additional transport modes

## Consequences

- Completed lines now carry a minimal, typed frequency configuration baseline suitable for later line service configuration slices.
- Time-band keys remain canonical and centralized, avoiding UI-local frequency key duplication.
- Session-state line shape now consistently includes explicit per-band frequency initialization.
