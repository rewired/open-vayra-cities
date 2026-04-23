# ADR 0045: Deterministic street snap candidate ranking

## Status

Accepted

## Date

2026-04-23

## Context

Street stop placement currently resolves a snapped point from rendered street geometry candidates.

While candidate selection already uses pixel distance, practical map interactions can produce multiple nearby line geometry candidates across direct-hit and fallback queries. Relying on distance-only ranking can lead to less predictable tie handling and inconsistent ordering between candidate-resolution branches.

## Decision

Keep the existing stop-placement model and geometry scope unchanged, and add deterministic ranking metadata plus a shared compare helper:

- each snap candidate now carries ranking metadata:
  - provenance (`direct-hit` or `fallback`)
  - feature/layer match strength
- one compare helper defines canonical ordering precedence:
  1. direct-hit provenance before fallback
  2. stronger feature/layer match
  3. lower pixel distance
  4. stable coordinate tie-breakers (`lng`, then `lat`)
- all snap resolution phases use the same helper:
  - per-segment nearest candidate updates
  - per-feature / per-query aggregation
  - fallback offset aggregation
  - final direct-hit vs fallback selection

## Consequences

- Snap selection behavior is deterministic under equal or near-equal distance cases.
- Direct-hit and fallback paths now share identical ranking semantics.
- Placement scope remains bus-stop snap-on-street only, without routing/pathfinding expansion.

## Non-goals

- No new routing, pathfinding, or street-network traversal logic.
- No changes to stop placement eligibility rules.
- No changes to line building, demand, economy, persistence, or mobile scope.
