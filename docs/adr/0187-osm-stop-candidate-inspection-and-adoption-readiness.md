# ADR 0187: OSM Stop Candidate Inspection and Adoption Readiness

## Status

Accepted

## Date

2026-05-04

## Context

OSM stop candidates are loaded from generated scenario-adjacent artifacts and rendered as planning source material. They help players understand plausible real-world stop locations, but they are not canonical OpenVayra stops.

Recent demand-node inspection and selected-node service coverage work correctly evaluates only canonical player/session stops. The player now needs an inspection surface for OSM candidates that explains candidate identity, position, street-anchor readiness, and adoption readiness without silently treating candidates as network truth.

## Decision

Add a pure OSM stop candidate inspection projection and an Inspector surface for selected OSM stop candidates.

Selecting an OSM candidate on the map is inspection-only. It records a shell-owned selected OSM candidate group id, resolves transient street-anchor readiness when available, and renders player-facing readiness copy in the Inspector.

The Inspector may show whether a candidate is ready for adoption. It must clearly state that:

- OSM stop candidates are source-derived planning/adoption candidates, not canonical stops.
- The selected candidate is not yet a game stop.
- Candidates do not serve demand and cannot be used in lines until explicitly adopted as canonical OpenVayra stops.
- Adoption readiness is based on resolved street-anchor and duplicate-stop checks, not on service, demand, or simulation truth.

Map rendering remains projection-only and the existing OSM candidate layer stays controlled by the central map layer flyout.

## Consequences

Players can inspect OSM candidates and understand whether a future adoption action is ready or blocked.

OSM candidate selection does not create stops, alter lines, append draft-line stops, or affect demand/service coverage. Canonical stop creation remains an explicit adoption command using the existing typed adoption helper and shell command seam.

## Non-Goals

This decision does not introduce:

- automatic stop creation from map candidate selection;
- automatic line creation or draft-line edits;
- OSM candidates counting as placed stops, line stops, service coverage, or demand-serving stops;
- demand generation, demand capture, selected demand-node service coverage, or demand gap ranking changes;
- route computation, passenger assignment, passenger-flow simulation, exact OD truth, or transfer behavior;
- economy, revenue, cost, satisfaction, fleet, depot, staff, maintenance, crowding, or multimodal behavior;
- raw OSM, PBF, OSRM, CSV, or source-material runtime reads;
- generated scenario artifact schema changes;
- standalone map overlay toggles outside the central layer flyout.
