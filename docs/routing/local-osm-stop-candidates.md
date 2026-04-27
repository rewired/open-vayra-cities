# Local OSM Stop Candidate Generation

This document describes how to generate external stop candidates from OpenStreetMap (OSM) data for use in CityOps.

## Purpose

OSM stop candidates provide a set of suggested locations for stops based on real-world transit data. They are **external suggestions** and are not automatically adopted as CityOps stops. They serve as a guide for manual stop placement or future automated planning features.

## Prerequisites

- **Docker**: Required for running the Osmium tooling container.
- **Node.js**: Required for normalizing the extracted data.
- **PowerShell**: Used for workflow scripts.
- **Local OSM Data**: An `.osm.pbf` file of your area of interest (e.g., from [Geofabrik](https://download.geofabrik.de/)).

## Setup

Before running the generation workflow, you must build the dedicated Osmium tooling image:

```powershell
./scripts/osm/setup-osmium-tooling.ps1
```

This script will:
1. Create required local directories:
   - `data/osm/`
   - `data/generated/osm/`
   - `apps/web/public/generated/`
2. Build the Docker image `cityops-osmium-tooling:local`.

## Generation Workflow

1. **Prepare OSM data**: Place your `.osm.pbf` file in the `data/osm/` directory.
2. **Run generation**:

   ```powershell
   ./scripts/osm/start-stop-candidate-generation.ps1
   ```

   If exactly one PBF file exists in `data/osm/`, the script will resolve it automatically. Otherwise, specify it explicitly:

   ```powershell
   ./scripts/osm/start-stop-candidate-generation.ps1 -InputPbf ./data/osm/hamburg-latest.osm.pbf
   ```

### Output Artifact

The workflow produces a GeoJSON file at:
`apps/web/public/generated/osm-stop-candidates.geojson`

This file is consumed by the web app to render candidate markers on the map.

## App Behavior

- If the artifact is missing, the app will start normally but zero candidates will be rendered.
- If the artifact is present, the overlay renders **consolidated candidate groups** rather than every raw OSM object. Obvious duplicates (e.g., a `bus_stop` node and a `stop_position` node at the same location) are merged deterministically based on proximity and label compatibility.

### Consolidation Rules

The app groups raw candidates into logical stop facilities using the following rules:
- **Grouping Radius**: Compatible labels are grouped within **35m**.
- **Exact Duplicates**: Highly proximal objects within **5m** are grouped even if modeling styles differ.
- **Max Group Span**: A single group cannot exceed **60m** in total geographic span, preventing over-merging along long street segments.
- **Role Awareness**: Passenger-visible objects (`bus-stop`, `platform`) are grouped first, then vehicle stop positions are assigned to the best nearby group.

Each group maintains separate positions for display (favoring passenger-visible platforms) and future routing (favoring stop positions).

- Candidates remain non-canonical; selecting one does not create a CityOps stop in this slice.

## Attribution and Licensing

- OSM data is © OpenStreetMap contributors.
- Generated local artifacts inherit OSM licensing considerations (ODbL).
- Do not commit generated `.geojson` files to the repository unless explicitly curated and approved.

## Troubleshooting

- **Docker not running**: Ensure the Docker Desktop (or equivalent) is active.
- **Multiple PBF files**: Use the `-InputPbf` parameter to resolve ambiguity.
- **No PBF file found**: Ensure the file has a `.pbf` or `.osm.pbf` extension and is located in `data/osm/`.
- **Tooling image missing**: Run the setup script again.
- **Invalid JSON line warnings**: If you see `Skipped invalid JSON lines/records`, it usually means some records in the intermediate file were malformed. The normalizer automatically handles GeoJSONSeq with Record Separator (`\u001e`) prefixes and plain NDJSON. If you see many skips, check if your OSM data extract is valid.
- **Zero candidates emitted**: If the normalizer reports many records processed but zero candidates emitted with `features without numeric OSM node ID` skips, it means the Osmium export step did not include object IDs. Ensure `osmium export` is run with `--add-unique-id=type_id` (this is the default in `build-stop-candidates.ps1`). CityOps requires stable OSM node IDs to produce stable `osm:node:<id>` candidate IDs.
