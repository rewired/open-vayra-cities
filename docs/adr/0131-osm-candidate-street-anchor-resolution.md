# ADR 0131: OSM Candidate Street Anchor Resolution

## Status

Accepted

## Context

OSM stop candidates (loaded from `/generated/osm-stop-candidates.geojson` and grouped into stop facilities) often represent physical objects like platforms, signs, or shelters. These are excellent for display position (`displayPosition`), but they are often physically away from the drivable street.

For future adoption of these candidates into the CityOps network, the simulation needs a routing anchor (`routingAnchorPosition` or `streetAnchorPosition`) that is snapped to a valid street line. Without this separation, adopting an off-street candidate would result in vehicles trying to route to positions they cannot reach or stopping in invalid locations.

## Decision

We will implement a reusable street-anchor resolution model for grouped OSM candidate groups with the following characteristics:

1.  **Display vs. Routing Separation**: Grouped candidates explicitly distinguish between where they are displayed and where they are anchored for routing.
2.  **Map-Based Resolution**: Anchor resolution is performed at runtime using rendered street line geometry from the MapLibre surface. This ensures that only visible, drivable streets in the current style are used for snapping.
3.  **Staged Snapping**: Resolution reuse the existing staged "direct-hit" and "fallback" snapping logic used for manual stop placement, adapted for geographic points.
4.  **Quality Classification**: Resolved anchors are classified into quality tiers based on distance:
    *   **Ready** (<= 35m): Suitable for automatic adoption.
    *   **Review** (<= 60m): Questionable, may require manual check.
    *   **Blocked** (> 60m or unresolved): Cannot be adopted without further input.
5.  **Hover Diagnostics**: Anchor resolution is triggered on-demand when a candidate group is hovered, surfacing its status in the tooltip without pre-calculating status for the entire dataset.
6.  **Non-Canonical Status**: Resolved anchors remain transient runtime data for UI/readiness feedback and are not saved as network truth in this slice.

## Consequences

*   **Improved Adoption Readiness**: We now know which OSM candidates can be safely turned into CityOps stops.
*   **Decoupled UI/Domain**: The display marker stays where it belongs (e.g., on a platform), while the vehicle stopping point is correctly placed on the street.
*   **Performance**: On-hover resolution avoids heavy batch processing of hundreds of candidates.
*   **Consistency**: Manual placement and OSM adoption use the same underlying snapping algorithms and thresholds.
*   **Graceful Degradation**: If street layers are missing or the map is not ready, the UI reports "unavailable" rather than failing.
