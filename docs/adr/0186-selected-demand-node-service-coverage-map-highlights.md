# ADR 0186: Selected Demand Node Service Coverage Map Highlights

## Status

Accepted

## Date

2026-05-04

## Context

ADR 0185 introduced a selected-demand-node service coverage projection for the Inspector Demand tab. That projection explains whether the selected node has nearby stop coverage, structural line context, and active inspected-band service without changing network or simulation state.

The remaining readability gap is spatial: players can read which stops matter in the Inspector, but the map should also highlight those stop relationships while preserving projection-only boundaries.

## Decision

Add display-only map highlights for stops already exposed by the selected-demand-node service coverage projection.

The map overlay:

- consumes the Slice 183 service coverage projection output;
- highlights selected-side covering stops and opposite-side context covering stops;
- distinguishes selected-side and opposite-side roles with stable map feature properties;
- reflects coverage-only, structural-connection, and active-service context from the projection when available;
- is registered in the central map layer flyout as `Demand service coverage`;
- lets the layer flyout control visibility only.

The overlay is implemented as a pure GeoJSON point projection and MapLibre circle ring layer. It does not own coverage semantics and does not look up domain truth from React components.

## Consequences

Players can visually locate stops involved in selected demand node service coverage without changing stop, line, service, route, demand, or simulation state.

The selected-node context hint lines remain unchanged and continue to render as straight planning hints. Demand gap overlays and focused OD hints remain separate map projections.

## Non-Goals

This decision does not introduce:

- stop, line, service, timetable, route, network, demand, or simulation mutations;
- route computation, routed passenger paths, OSRM calls, or raw OSM/PBF/CSV/source-material runtime reads;
- passenger assignment, passenger-flow simulation, transfer logic, exact OD truth, or OD matrices;
- demand generation, demand capture, served-demand, demand gap ranking, or context candidate ranking changes;
- economy, revenue, cost, satisfaction, crowding, fleet, depot, staff, maintenance, or multimodal behavior;
- completed-line route highlights;
- standalone map overlay toggle buttons outside the central layer flyout;
- generated scenario artifact schema changes or new dependencies.
