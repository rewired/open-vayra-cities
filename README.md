# CityOps

CityOps is a desktop-only, browser-based transit network simulation game focused on a bus-first MVP scope.

## Prerequisites

- **Node.js**: version 22+
- **pnpm**: version 10+
- **Docker Desktop**: or a compatible Docker runtime (required for local assets)
- **PowerShell**: required for executing local asset scripts (Windows default)

## Installation

```powershell
pnpm install
```

## Scenario Setup Quick Start

To set up the baseline Hamburg scenario, run the scenario orchestrator:

```powershell
pnpm scenario:setup:hamburg
```

### How it works:
1. **Initial Run**: The orchestrator creates/verifies the required area and scenario configuration JSON files, and generates a BBBike download helper HTML file.
2. **Missing PBF**: If the OpenStreetMap data extract (`.osm.pbf`) is missing, the process stops.
3. **Manual Download**: You must open the generated helper HTML (found in `data/generated/download-helpers/`), download the BBBike extract, and save/rename it to:
   ```text
   data/osm/hvv-mvp.osm.pbf
   ```
4. **Final Run**: Re-run the command (`pnpm scenario:setup:hamburg`). With the PBF file in place, the pipeline will prepare local OSRM assets, extract stop candidates, and compile the scenario registry.

## Running the Application

To start the local development server for the web app:

```powershell
pnpm dev:web
```

## Advanced / Debug Commands

For advanced workflows or debugging, the following commands are available:

- **Rebuild Scenario Registry**:
  ```powershell
  pnpm scenarios:build
  ```
- **Prepare Assets for Specific Area**:
  ```powershell
  pnpm local-assets:prepare -- --area hvv-mvp
  ```
- **Start Routing Service Directly**:
  ```powershell
  .\scripts\routing\start-osrm.ps1 -Area hvv-mvp
  ```
- **Verify OSRM Routing**:
  ```powershell
  pnpm tsx scripts/routing/smoke-test-osrm.ts
  ```

## Local & Generated File Policy

| Path | Meaning | Commit? |
| :--- | :--- | :--- |
| `data/areas/*.area.json` | Curated area/asset contract | **Yes** |
| `data/scenarios/*.scenario.json` | Curated scenario truth | **Yes** |
| `data/osm/*.osm.pbf` | Downloaded OSM extracts | No |
| `data/routing/osrm/**` | Generated OSRM graphs | No |
| `apps/web/public/generated/**` | Generated browser-readable runtime assets | No (except `.gitkeep` placeholders) |
| `data/generated/download-helpers/*.html` | Generated BBBike download helpers | No |

## Documentation Map

- **Canonical Project Docs**: Located at the root (`PRODUCT_DEFINITION.md`, `FOUNDATION.md`, `VISION_SCOPE.md`, etc.)
- **Architecture Decision Records (ADRs)**: Located under `docs/adr/`
- **Advanced Technical Details**: Located under `docs/routing/` for deeper local routing and OSM stop-candidate integration specifics.
