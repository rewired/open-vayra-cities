# ADR 0140: Scenario-Bound Demand Overlay Skeleton

## Status

Accepted

## Date

2026-04-28

## Context

Previously, demand nodes used by the transit simulation were hardcoded in memory (`mvpDemandScenario.ts`). To support multiple playable zones and realistic spatial patterns, demand datasets must be scenario-bound, dynamically loaded, and strictly typed.

## Decision

- Replace hardcoded demand constants with dynamic client-side loading from scenario JSON assets (`/generated/scenarios/{id}.demand.json`).
- Enforce strict, narrow type safety over untrusted demand payloads via small local type guards (`isRecord`, `isDemandNodeRole`, `isDemandClass`) instead of broad type casts.
- Standardize access-radius demand scoring loops to iterate strictly over canonical `MVP_TIME_BAND_IDS` instead of arbitrary object keys.
- Introduce parser-oriented test suites to protect spatial geometries and role bindings.

## Consequences

- Clean, declarative data decoupling allowing zero rebuild overhead on scenario swaps.
- Hardened boundaries against data corruption, preventing silent runtime exceptions.
- Fully compliant documentation and test standards mapping to the Slice 131 boundaries.

## Data Architecture & Non-Goals Boundary

- **Generated Artifact Boundary**: Generated public demand JSON (compiled into `/generated/scenarios/`) is a browser delivery artifact. The canonical, editable demand source resides strictly under `data/scenarios/`.
- **Presentation-Only Scope**: The map overlay remains purely presentation/debug only. Stop placement workflows and stops themselves do not generate demand.
- **Intentional Gameplay Limits**: This demand baseline deliberately excludes passenger assignment, transit economy logic, route choice simulations, and fine-grained walking network access calculations.
- **Strict Input Verification**: The loader actively treats scenario demand payloads as untrusted input, parsing and validating bounds before constructing canonical `DemandNode` objects.

