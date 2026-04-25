# ADR 0100: Single global top-bar debug entrypoint

## Status

Accepted (2026-04-25)

## Context

ADR 0099 introduced a shell-owned debug modal but exposed more than one way to reach debug diagnostics:

1. A dedicated left-rail debug control.
2. An inspector `Debug` tab containing additional technical diagnostics.

That duplication split debug affordances between shell and inspector surfaces, increased navigation noise, and made debug-entry ownership less explicit.

## Decision

1. Keep exactly one debug entry affordance: a top-bar `Debug` button in the global action cluster.
2. Keep debug modal open/close state and diagnostics snapshot ownership in `App.tsx`.
3. Remove inspector `Debug` tab identifiers/labels and corresponding debug tab rendering.
4. Remove left-rail debug button affordance so no parallel floating/inline debug entry remains.

## Consequences

- Debug diagnostics remain available through one predictable global entrypoint.
- Inspector focus remains on gameplay-facing `Network` and `Lines` navigation only.
- Shell-level ownership of debug UI state is clearer and easier to evolve.

## Explicit non-goals (this slice)

- no changes to map diagnostics payload derivation contracts
- no simulation/routing/projection semantic changes
- no stop/line gameplay behavior changes
- no mobile or multimodal scope expansion
