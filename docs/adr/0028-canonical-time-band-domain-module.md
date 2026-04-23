# ADR 0028: Add canonical time-band domain module

## Status

Accepted

## Date

2026-04-23

## Scope

Introduce a canonical, strongly typed MVP time-band module and remove any need for UI-local time-band literal lists.

## Constraints

- Preserve desktop-only, bus-first MVP scope.
- Keep time-band truth centralized in domain modules.
- Keep exported symbols documented and type-safe.
- Do not add simulation behavior or economy semantics in this slice.

## Decision

- Add `TimeBandId` as a canonical strict union type in `apps/web/src/domain/types/timeBand.ts`.
- Add `MVP_TIME_BAND_IDS` in `apps/web/src/domain/constants/timeBands.ts` as the canonical ordered list:
  - `morning-rush`
  - `late-morning`
  - `midday`
  - `afternoon`
  - `evening-rush`
  - `evening`
  - `night`
- Add `TIME_BAND_DISPLAY_LABELS` in the same constants module for minimal inspector-safe labels.
- Update `App.tsx` inspector rendering to consume the canonical domain constants instead of local literals.

## Explicit non-goals

This slice does **not** introduce:

- frequency editing UI
- simulation time-band transitions
- line/service operational logic
- additional transport modes

## Consequences

- Time-band identifiers now have one typed canonical source.
- UI rendering can reuse canonical labels/order without local literal duplication.
- Later simulation and frequency features can depend on this shared domain module.
