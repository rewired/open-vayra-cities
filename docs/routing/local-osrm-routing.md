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

### 1. Download Local OSM Data
We use the Hamburg region data from Geofabrik.
From the repository root, run:
```powershell
.\scripts\routing\download-hamburg-osm.ps1
```
This script will download `hamburg-latest.osm.pbf` and its MD5 checksum into the `data/osm/` directory and verify the file integrity.

### 2. Prepare OSRM Graph
Once the source data is downloaded, you need to extract and partition the graph for OSRM using the MLD pipeline.
Run:
```powershell
.\scripts\routing\prepare-osrm.ps1
```
This script mounts the data directory into a temporary `osrm/osrm-backend` Docker container, runs `osrm-extract`, `osrm-partition`, and `osrm-customize`, placing the generated graph artifacts into `data/routing/osrm/`.

### 3. Start the OSRM Service
To start the background routing service, run:
```powershell
.\scripts\routing\start-osrm.ps1
```
This uses `docker-compose` to spin up the OSRM backend container, making it available at `http://localhost:5000`.

### 4. Run Smoke Test
To verify that the routing service is working and correctly hooked up, run:
```powershell
pnpm tsx scripts/routing/smoke-test-osrm.ts
```
If successful, it will output a resolved distance, duration, and geometry for a fixed route.

## Important Note on Generated Data
**Do not commit `.pbf` or `.osrm` files.**
Local OSM extracts and generated OSRM artifacts are large and easily reproducible. They are explicitly ignored in `.gitignore`. The `data/osm/` and `data/routing/osrm/` directories contain `.gitkeep` files to maintain structure, but the data itself remains local to your machine.

## Attribution and License
The data used for routing is © OpenStreetMap contributors. Extracts are provided by Geofabrik. By using this routing data locally, be aware of the ODbL license applied to OSM data.
