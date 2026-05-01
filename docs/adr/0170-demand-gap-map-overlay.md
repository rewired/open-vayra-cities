# ADR 0170: Demand Gap Map Overlay

## Status

Proposed

## Context

OpenVayra - Cities provides textual demand gap rankings in the Inspector. However, understanding the spatial distribution of these gaps (uncaptured residential nodes, captured but unserved residential nodes, and captured but unreachable workplace nodes) is difficult without a map visualization.

We need a spatial overlay that reflects the current demand gap projection state without introducing new simulation or demand generation logic.

## Decision

We will implement a MapLibre-based overlay for demand gaps with the following characteristics:

1.  **Projection-Only**: The overlay consumes the existing `DemandGapRankingProjection`. It does not calculate demand itself.
2.  **Heatmap Rendering**: A `heatmap` layer is used to visualize aggregate "pressure" from demand gaps. This provides a low-noise overview of problem areas.
3.  **Point Detail**: A `circle` layer is added to show individual gap points. These points fade in at high zoom levels (>= 14) to provide precision when needed while avoiding clutter at lower zooms.
4.  **GeoJSON Contract**: A dedicated builder flattens the three projection categories into a single deterministic GeoJSON collection. Features include `activeWeight` for heatmap weighting and `kind` for categorical styling.
5.  **Visibility Control**: The overlay is registered in the central Map Overlays flyout and is hidden by default to keep the primary view focused on network building.
6.  **Performance**: The overlay is scale-safe by consuming the already-capped projection output (limited to top items per category).

## Consequences

- Players can now visually identify underserved areas on the map.
- The map source synchronization logic is extended to handle the new projection input.
- MapLibre types are extended locally to support the `heatmap` layer type.
- Interaction non-goal: Points are initially non-interactive to ensure they do not interfere with stop placement or line selection. Focus interaction remains in the Inspector list.
