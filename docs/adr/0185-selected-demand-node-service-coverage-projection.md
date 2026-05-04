# ADR 0185: Selected Demand Node Service Coverage Projection

## Status

Accepted

## Context

Selected demand node inspection already lets players select scenario demand nodes, inspect an override time band, and view locality-aware opposite-side context candidates. The next planning need is to explain whether the player-created bus network can currently help the selected node without turning inspection into passenger assignment or simulation truth.

The explanation must bridge existing read-only state:

- selected demand node inspection projection
- placed stops
- completed bus lines
- selected inspection time band
- canonical stop-access radius
- existing line service readiness and service-plan projection helpers

## Decision

We add a pure selected-demand-node service coverage projection consumed by the Demand inspector.

The projection explains:

- whether the selected node is within stop-access radius of placed stops
- which nearby placed stops cover the selected side
- whether completed lines include selected-side covering stops
- whether completed lines structurally connect the selected side to at least one covered opposite-side context candidate
- whether those structurally connecting lines have active frequency service in the selected inspection time band

For selected residential origins, travel direction is evaluated from the selected side toward workplace context candidates. For selected workplace destinations, travel direction is evaluated from residential context candidates toward the selected side. Linear one-way, bidirectional, and loop behavior follows the existing line topology and service-pattern semantics used by current demand/service projections.

The UI consumes the projection output directly and does not own demand, network, routing, service, or simulation truth.

## Consequences

- Players get a compact selected-node `Network coverage` explanation in the Demand tab.
- The selected inspection time band affects only this inspection projection and does not mutate the simulation clock, line service plans, or global active service truth.
- Detail lists are deterministic and capped for inspector display.
- The map remains unchanged; existing selected-node context hint lines remain the only selected-node map guidance.

## Non-Goals

This decision does not introduce:

- exact OD truth or OD matrices
- passenger assignment
- passenger-flow simulation
- routed passenger paths
- transfer logic
- route computation
- demand generation changes
- demand capture math changes
- served-demand math changes
- economy, revenue, cost, satisfaction, fleet, depot, staff, maintenance, crowding, or transfer models
- automatic stop creation, line creation, draft-line edits, or service-plan edits
- raw OSM, PBF, OSRM, CSV, or source-material runtime reads
