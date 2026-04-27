# Local OSM Stop Candidate Generation

This document describes how to generate external stop candidates from OpenStreetMap (OSM) data for use in CityOps.

## Purpose

OSM stop candidates provide a set of suggested locations for stops based on real-world transit data. They are **external suggestions** and are not automatically adopted as CityOps stops. They serve as a guide for manual stop placement or future automated planning features.

## Prerequisites

- **Docker**: Required for running the Osmium tooling container.
- **Node.js**: Required for normalizing the extracted data.
- **PowerShell**: Used for workflow scripts.
- **Local OSM Data**: An `.osm.pbf` file placed at `data/osm/hvv-mvp.osm.pbf`.

## Workflow & Orchestration

Generating assets via scenarios is the standard flow:

```powershell
pnpm scenario:setup:hamburg
```

Or explicitly via the asset pipeline:

```powershell
pnpm local-assets:prepare -- --area hvv-mvp
```

### Advanced / Direct Generation
If you are executing isolated tasks for troubleshooting, you can build candidates directly against a specific area profile:

```powershell
.\scripts\osm\start-stop-candidate-generation.ps1 -Area hvv-mvp
```

### Output Artifact Boundaries
- **Active Output Target**: `apps/web/public/generated/hvv-mvp/osm-stop-candidates.geojson`
- **Legacy Global Fallback**: `apps/web/public/generated/osm-stop-candidates.geojson` (manual overrides only)

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

### Street Anchor Resolution

Each consolidated group maintains separate positions for display and routing:
- **Display Position**: Favoring passenger-visible platforms or signs.
- **Routing Anchor**: Favoring OSM stop-position nodes.

When a candidate group is hovered, the app resolves its **Street Anchor Status** by snapping the routing anchor to the nearest rendered street line. This determines "adoption readiness":
- **Ready**: Nearby street found (<= 35m).
- **Review**: Street found but questionable distance (<= 60m).
- **Blocked**: No nearby street found or distance too great.

Visible markers may appear off-street if their display position is away from the curb, but future adoption will use the resolved street-snapped anchor to ensure valid routing truth.

### Adoption Workflow

Adoption is the process of converting an external OSM candidate group into a canonical CityOps stop.

1. **Selection**: Click on a candidate group circle in **Inspect** mode.
2. **Review**: The inspector panel shows the resolved street anchor and distance.
3. **Adopt**: Click **Adopt stop** if the candidate is "ready" (has a valid street anchor).

Once adopted:
- The stop becomes a standard CityOps stop.
- The original OSM candidate is hidden from the overlay in the current session.
- The stop's position is set to the **resolved street anchor**, ensuring it is safe for routing.
- The stop name is inherited from the candidate group label.

## Attribution and Licensing

- OSM data is © OpenStreetMap contributors.
- Generated local artifacts inherit OSM licensing considerations (ODbL).
- Do not commit generated `.geojson` files to the repository unless explicitly curated and approved.
