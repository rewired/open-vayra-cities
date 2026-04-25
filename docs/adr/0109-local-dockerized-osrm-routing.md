# ADR 0109: Local Dockerized OSRM as Initial Routing Adapter

## Status
Accepted

## Context
The CityOps MVP requires a believable street-routed path fallback for bus lines rather than naive straight lines. We need a deterministic, local routing implementation that does not depend on an external, rate-limited public API (e.g., the OSRM demo server), ensuring the simulator can function autonomously without internet dependency during standard gameplay/testing.

## Decision
We will use a local, Dockerized instance of the Open Source Routing Machine (OSRM) as the first street-routed segment adapter.
- The implementation strictly acts as a `RoutingAdapter` mapping domain requests to HTTP requests to a local service.
- We will rely on the official `osrm/osrm-backend` Docker image using the `mld` pipeline.
- For the MVP baseline, we will use the default `car.lua` profile. This explicitly prioritizes getting legible street-snapping implemented over fine-tuning bus restrictions right away.

## Boundaries
- **Adapter Only**: OSRM is strictly an adapter to generate geometry, distance, and duration. It is not the source of truth for the game's line economy or demand models. Dwell time must be calculated externally.
- **Reproducible Local Data**: Downloaded OSM extracts (`.pbf`) and generated `.osrm` graphs are treated as replaceable developer data. They will not be committed to the repository.
- **Typed Input/Output**: The OSRM adapter rigorously validates untyped HTTP JSON against the `RoutingAdapter` contract, returning structured failures on bad responses rather than passing `any` downstream.

## Non-Goals
- **No full traffic micro-simulation**: OSRM provides static pathing; it does not simulate congestion or intersection waiting times dynamically.
- **No live public API dependency**: We do not call public OSRM servers.
- **No custom bus profile yet**: Bus weightings, turn radii, and restricted roads will be tuned later; the default car profile suffices for initial implementation.
- **No simulation/economy integration yet**: This slice focuses solely on adapter infrastructure, not changing current line logic.
- **No UI line rendering changes yet**: Display remains unchanged until the adapter is fully wired.
- **No persistence**: The routing graph is pre-generated data, not mutable game state.

## Consequences
- Developers will need Docker installed locally to work with routing features.
- We must provide PowerShell scripts to automate downloading the OSM extract and preparing the graph, reducing friction for developers on Windows.
- The game's domain logic is successfully decoupled from OSRM via the `RoutingAdapter` interface, allowing us to swap it out (e.g., for Valhalla or a custom router) if needed in the future.
