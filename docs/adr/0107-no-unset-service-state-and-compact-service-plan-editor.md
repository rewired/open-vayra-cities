# ADR 0107: No-unset service state and compact service-plan editor

- Date: 2026-04-25
- Status: Accepted

## Context

The selected-line `Edit service plan` workflow still exposed and preserved an `unset` service-band state. That no longer matches MVP truth for canonical line service planning.

For MVP line service semantics, every canonical time band must be explicitly one of:

- `frequency`
- `no-service`

The editor UI also needed a denser, more scannable desktop layout with a compact two-choice service widget per row.

## Decision

1. Remove `unset` from canonical line service-band types.
2. Initialize new completed lines with explicit `{ kind: 'no-service' }` for all canonical time bands.
3. Keep `no-service` as explicit domain state (never numeric `0`).
4. Refactor the service-plan editor to a compact three-column layout in this order:
   - `WINDOW`
   - `TIME BAND`
   - `SERVICE`
5. Use a compact per-row service widget with only:
   - `Interval`
   - interval text input
   - `No service`
6. Use controlled text input validation (`1..999`, digits-only, max length `3`) with reducer/helper logic outside JSX.
7. When interval mode is activated without a valid prior value, apply centralized default interval minutes.

## Consequences

- Canonical line/service state is explicit and truthful with no third `unset` mode.
- Newly completed lines start fully explicit with deterministic no-service defaults.
- The editor no longer shows misleading `unset` language or three-state controls.
- Existing projection/readiness/export tests are aligned with explicit `frequency`/`no-service` semantics.

## Non-goals

- No changes to demand/economy/routing/simulation behavior.
- No mobile layout or responsive redesign.
- No persistence/backend scope expansion.
