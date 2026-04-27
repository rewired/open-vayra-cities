# Local OSRM Routing Baseline

CityOps uses a local Dockerized instance of the Open Source Routing Machine (OSRM) to provide realistic street routing between stops. This avoids relying on external rate-limited APIs and ensures deterministic behavior for the simulation MVP.

## Why Local Dockerized OSRM?
- **Deterministic**: Provides consistent results locally and in test environments.
- **Offline/No External Dependencies**: Does not require calling a public endpoint while building or playing.
- **Replaceable Adapter**: The engine interacts with the `RoutingAdapter` interface, allowing us to swap out OSRM if necessary in the future without touching simulation rules.
- **MVP Profiling**: We currently use the default `car.lua` profile as an approximation for bus routing.

## Prerequisites
- **Docker**: Must be installed and running on your development machine.
- **PowerShell**: Required to run the setup scripts (Windows 10/11 default).

## Setup Instructions

### 1. Scenario-based Setup Flow
The legacy `download-hamburg-osm.ps1` script is obsolete. Instead, use the unified scenario pipeline:

```powershell
pnpm scenario:setup:hamburg
```

This orchestrates area verification and creates a BBBike download helper. You must place the downloaded OSM data at:
```text
data/osm/hvv-mvp.osm.pbf
```
Then, re-run the orchestrator to trigger OSRM graph building and stop candidate generation.

### 2. Direct Debugging & Advanced OSRM Preparation
For manual overrides or debugging, you can execute the OSRM pipeline steps individually for a chosen area:

**Prepare OSRM Graph:**
```powershell
.\scripts\routing\prepare-osrm.ps1 -Area hvv-mvp
```
This mounts the data directory into a temporary `osrm/osrm-backend` Docker container, runs `osrm-extract`, `osrm-partition`, and `osrm-customize`, placing the generated graph artifacts into `data/routing/osrm/hvv-mvp/`.

**Start the OSRM Service:**
```powershell
.\scripts\routing\start-osrm.ps1 -Area hvv-mvp
```
This spins up the OSRM backend container, serving data specifically from the chosen area.

**Verify Route Resolution:**
```powershell
pnpm tsx scripts/routing/smoke-test-osrm.ts
```

## File Policy & Legacy Note
The old `hamburg-latest` naming scheme is fully deprecated in favor of explicit area scoping (e.g. `hvv-mvp`).

**Never commit `.pbf` or `.osrm` files.** Local OSM extracts and generated OSRM graphs are large and easily reproducible. They remain excluded via `.gitignore`.
