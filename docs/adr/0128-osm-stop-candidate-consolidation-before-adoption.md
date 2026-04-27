# ADR 0128: OSM Stop Candidate Consolidation before Adoption

## Status

Accepted

## Context

The OSM candidate generation pipeline produces raw geographic objects corresponding to real-world transit features (e.g., `highway=bus_stop`, `public_transport=platform`, `public_transport=stop_position`). In real-world OpenStreetMap data, a single logical bus stop facility is often modeled using multiple such objects.

Directly rendering every raw OSM object in the CityOps map overlay results in:
1.  **Visual Clutter**: Multiple overlapping or nearby markers for the same stop.
2.  **Unsafe Adoption**: Clicks to "adopt" a candidate would be ambiguous if multiple physical objects represent the same logical stop.
3.  **Modeling Mismatch**: CityOps uses a single `Stop` entity for a facility, while OSM fragments it.

## Decision

We introduce a deterministic, browser-side consolidation step that groups raw OSM stop candidates into logical **OsmStopCandidateGroups** before they are rendered in the map workspace.

### Grouping Rules

The grouping algorithm is conservative and role-aware:
1.  **Facility Baseline**: Groups are initialized from "passenger-visible" candidates (`bus-stop`, `platform`).
2.  **Distance Thresholds**:
    *   `OSM_STOP_CANDIDATE_GROUPING_RADIUS_METERS = 35m`: Standard threshold for compatible labels.
    *   `OSM_STOP_CANDIDATE_EXACT_DUPLICATE_RADIUS_METERS = 5m`: Threshold for exact modeling duplicates.
    *   `OSM_STOP_CANDIDATE_MAX_GROUP_SPAN_METERS = 60m`: Maximum geographic extent allowed for a single group to prevent over-merging along street segments.
3.  **Label Compatibility**: Candidates are grouped only if their normalized labels match or one side has only a generic fallback label (e.g., `OSM stop <id>`).
4.  **Vehicle Anchor Assignment**: `stop_position` candidates are assigned to the nearest compatible passenger-visible group within the threshold, or remain standalone if unassigned.

### Position Selection

Each group maintains two distinct positions:
*   **Display Position**: Preferred kind order: `bus-stop` > `platform` > `stop-position`. Used for map marker placement.
*   **Routing Anchor Position**: Preferred kind order: `stop-position` > `bus-stop` > `platform`. Intended for future use as the vehicle stop point for routing.

### Data Flow

Grouping happens as a pure domain transformation in the UI layer:
`raw candidates (GeoJSON artifact) -> consolidateOsmStopCandidates() -> OsmStopCandidateGroups -> Map Rendering`

## Consequences

*   **Better UX**: Map overlay is cleaner and represents logical stop facilities.
*   **Adoption Readiness**: Future adoption behavior will target groups, resulting in a single clean CityOps `Stop`.
*   **Non-Canonical**: Groups remain external suggestions and are not saved to the network state until adopted.
*   **Diagnostic Transparency**: Debug tools track both raw and grouped counts to monitor consolidation efficiency.
