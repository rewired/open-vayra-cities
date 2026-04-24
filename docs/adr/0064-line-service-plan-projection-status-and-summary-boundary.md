# ADR 0064: Line service plan projection status and summary boundary

## Status

Accepted (2026-04-24)

## Context

CityOps already has deterministic line service-readiness diagnostics that classify lines as `ready`, `partially-ready`, or `blocked` and expose typed issues.

The next step needs a projection surface that can be consumed by UI and future simulation orchestration without duplicating readiness rules. This surface must provide active-time-band service hints (headway and theoretical departures), line-level status, and network-level aggregates.

## Decision

Introduce a dedicated domain projection module for line service plans.

### Included

1. New documented projection contracts under `apps/web/src/domain/types/lineServicePlanProjection.ts`.
2. New pure helper functions under `apps/web/src/domain/projection/lineServicePlanProjection.ts`.
3. Reuse of `evaluateLineServiceReadiness` output as the single readiness-rule owner.
4. Deterministic status resolution for active time band:
   - `blocked` when readiness is blocked.
   - `not-configured` when readiness is non-blocked but current-band frequency is unset/invalid.
   - `degraded` when current-band frequency is valid but readiness is warning-only (`partially-ready`, including fallback-only routing).
   - `configured` when current-band frequency is valid and readiness is fully `ready`.
5. Network summary totals for line counts by status, route segment counts, route travel minutes, and theoretical departures per hour.

### Explicit non-goals

- no demand simulation
- no economy simulation
- no passenger assignment
- no vehicle execution model
- no route recalculation
- no persistence/import/backend expansion

## Rationale

### Why this projection exists instead of extending readiness directly

Readiness and projection answer different questions:

- readiness: structural/service eligibility diagnostics
- projection: active-band operational snapshot and summary math

Keeping them separate preserves single responsibility while allowing projection to reuse readiness without rule duplication.

### Why `degraded` is derived from readiness warnings plus valid active-band frequency

A line with warning-only diagnostics can still be serviceable in MVP, but it should not be presented as fully healthy configuration quality. `degraded` keeps that distinction explicit.

### Why active-band frequency is evaluated independently of readiness

Readiness validates at least one canonical frequency and complete-band quality. Active-band projection needs a narrower question: can this line run now in the currently active band?

## Consequences

- UI and future simulation entry points can consume one deterministic projection surface.
- Readiness rules stay centralized in one evaluator.
- Status semantics now clearly separate blocked, currently not configured, configured, and degraded lines.
