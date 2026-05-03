# 0173. Demand Gap OD Context Projection

## Status

Accepted

## Context

The map workspace provides a demand gap overlay to help players identify where service is missing (Slice 170). When a planner focuses on a gap via the Inspector, they need to understand the Origin-Destination (OD) context to resolve the gap effectively.

For example:
- If a residential cluster is unserved, where should the line go? (Candidate destinations)
- If a workplace is unreachable, where should the line come from? (Candidate origins)

OpenVayra - Cities requires strict separation between canonical simulation logic and pure UI projections. The simulation does not compute continuous, hypothetical passenger flows across unserved network edges.

## Decision

We introduce a pure projection (`DemandGapOdContextProjection`) to derive and display likely candidate connections for a focused demand gap.

1. **Projection-Only Boundaries**: The context logic is projection-only. It strictly consumes the scenario demand artifact and the currently focused gap item without mutating domain state or introducing speculative trip assignments into the simulation core.
2. **Deterministic Ranking**: Candidates are ranked by active time-band weight (descending), geographic distance (ascending), and stable ID (ascending) to guarantee determinism.
3. **Capping**: The number of visible candidates is strictly capped (e.g., `DEMAND_GAP_OD_CONTEXT_MAX_CANDIDATES = 5`) to prevent UI clutter and unbounded iterations.
4. **Inspector-First UI**: The OD context is rendered exclusively within the `InspectorDemandTab` under the focused gap. Map-based hint rendering is explicitly deferred to preserve the integrity of the MVP map pipeline and prevent uncontrolled scope sprawl.
5. **Explicit Non-Claim Boundary**: These candidates are presented strictly as contextual planning guidance. They do not represent exact real-world Origin-Destination flow truth, they do not imply route geometry, and they are not a substitute for passenger-flow simulation.

## Consequences

- Planners receive actionable, contextual guidance on how to resolve specific demand gaps without cluttering the map.
- The projection remains lightweight and type-safe, relying on simple distance and weight heuristics rather than heavy route-finding.
- Deferring desire hints ensures the map rendering layer remains stable and focused on authoritative network entities.
