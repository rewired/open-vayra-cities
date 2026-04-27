# CityOps

CityOps is a desktop-only, browser-based transit network simulation game with a bus-first MVP scope.

## Quick start

### Prerequisites

- Node.js 22+
- pnpm 10+

### Install dependencies

```bash
pnpm install
```

### Run the web app

```bash
pnpm --filter @city-ops/web dev
```

### Local Routing (Docker)

To enable realistic street-routing between stops, you must set up the local OSRM routing service. **Docker is required.**

1. Download the OSM data:
   `.\scripts\routing\download-hamburg-osm.ps1`
2. Prepare the OSRM graph:
   `.\scripts\routing\prepare-osrm.ps1`
3. Start the routing service:
   `.\scripts\routing\start-osrm.ps1`
4. Run the smoke test to verify:
   `pnpm tsx scripts/routing/smoke-test-osrm.ts`

*Note: The map data used for routing is © OpenStreetMap contributors, provided by Geofabrik. Generated data will not be committed to the repository.*

For more details, read [docs/routing/local-osrm-routing.md](docs/routing/local-osrm-routing.md).

### Local OSM Stop Candidates (Docker)

To generate suggested stop locations from OSM data, use the Osmium tooling workflow. **Docker is required.**

1. Setup the tooling:
   `.\scripts\osm\setup-osmium-tooling.ps1`
2. Run the generation:
   `.\scripts\osm\start-stop-candidate-generation.ps1`

For more details, read [docs/routing/local-osm-stop-candidates.md](docs/routing/local-osm-stop-candidates.md).

## Documentation map

Canonical project documentation lives at the repository root:

- `PRODUCT_DEFINITION.md`
- `FOUNDATION.md`
- `VISION_SCOPE.md`
- `DD.md`
- `TDD.md`
- `SEC.md`
- `DESIGN.md`

Architecture Decision Records (ADRs) are located in:

- `docs/adr/`

Use those canonical documents as the primary source of project scope and implementation constraints.
