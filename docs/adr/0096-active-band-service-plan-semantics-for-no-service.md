# ADR 0096: Active-band service-plan semantics for explicit `no-service`

## Status

Accepted (2026-04-25)

## Context

Line service planning supports three active-band plan kinds: `unset`, `frequency`, and `no-service`.
Existing readiness/projection logic treated configured state too narrowly around positive frequency only.
That caused explicit `no-service` plans to be interpreted as missing frequency configuration in diagnostics and downstream projections.

## Decision

1. Treat canonical time bands configured as `frequency` or `no-service` as configured service-plan bands for readiness counters.
2. Treat only `unset` canonical bands as missing service-plan configuration.
3. Keep existing readiness issue code ids stable where possible, while updating human-readable messages for the new semantics.
4. Expose explicit active-band state in line service plan projection output as `unset | no-service | frequency`.
5. Resolve service projection status truthfully:
   - `unset` active band => `not-configured`
   - `no-service` active band => configured-state service plan with no departures
   - `frequency` active band => existing configured/degraded behavior
6. Project departures only when the active band is `frequency`, and expose explicit unavailable reasons (including active-band `no-service`).
7. Keep vehicle projection aligned with departure output so active-band `no-service` yields zero projected vehicles and no required departure-based vehicles.

## Consequences

- Explicit no-service planning is treated as intentional configuration, not missing setup.
- Readiness and projection surfaces stay semantically aligned while preserving stable diagnostic code contracts.
- Downstream UI consumers can branch on explicit active-band state and unavailable-reason contracts without re-deriving semantics.

## Explicit non-goals (this slice)

- no route recomputation changes
- no simulation clock changes
- no demand/economy/passenger model changes
- no mobile or multimodal scope expansion
