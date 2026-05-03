# 0176. Demand Gap OD Candidate Focus and Readability

Date: 2026-05-03

## Status

Accepted

## Context

In Slice 174, we introduced the `DemandGapOdContextProjection` to identify likely workplace or residential candidates for a focused demand gap. The initial implementation rendered these candidates in the Inspector using raw, truncated node IDs. This proved difficult to read and lacked actionable UI paths for the player to easily focus on these candidate locations on the map.

We needed a way to present OD candidates cleanly, decoupling the raw domain identifiers from the UI's display semantics, while ensuring the player can seamlessly transition their map viewport to inspect these candidates.

## Decision

1. **Candidate Readability Projection**: We introduced `DemandGapOdCandidateListProjection`, a dedicated projection that consumes `DemandGapOdContextProjection`. It maps raw candidates into a set of strictly typed, deterministic display rows (`DemandGapOdCandidateDisplayRow`). It generates accessible ordinal labels (e.g., `#1 Workplace candidate`) and formats weights and distances.
2. **Actionable Candidate Rows**: We added a map-focus action to each candidate row. Clicking the focus button dispatches an `onPositionFocus` intent with the candidate's coordinates.
3. **Strict Domain Separation**: The `InspectorDemandTab` now relies completely on the new display projection for rendering the candidate table, removing ad-hoc string formatting (e.g., `.split('-')`) from React components.
4. **No New Simulation State**: The map focus uses existing spatial focus intents. No playable bus lines, routing entities, new demand rules, or simulation-level selection states are introduced by this feature. OD hints remain strictly planning context.

## Consequences

- **Improved Readability**: Players see understandable, ordinal candidate lists instead of opaque system IDs.
- **Improved Actionability**: Players can quickly pan the map to a candidate destination or origin to begin planning a route or placing stops.
- **Architectural Safety**: The UI component remains purely presentational, and all display logic is localized within a testable, pure projection boundary.
- **Scope Integrity**: The implementation conforms entirely to the bus-first MVP requirement and projection-only boundaries without mutating canonical simulation state.
