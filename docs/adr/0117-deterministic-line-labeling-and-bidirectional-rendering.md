# ADR 0117: Deterministic Line Labeling and Bidirectional Rendering

## Context

As the transit network simulation evolves, the current "Line 1", "Line 2" placeholder labels have become insufficient for player orientation. Players expect lines to be named after their terminals (e.g., "Stop A → Stop B") or show their circular nature (e.g., "Stop A Loop").

Furthermore, bidirectional lines currently only render their forward path, even though the reverse routing is computed and stored. This hides the actual street path used for the return journey, which may differ significantly due to one-way streets.

Finally, the 16px fixed-radius lookup for street labels was too brittle, often failing to find a name even when one was clearly visible nearby.

## Decision

1.  **Deterministic Line Labeling**: 
    - Implement `generateLineLabel` to derive names from the first and last stops.
    - Linear One-Way: `Stop A → Stop B`
    - Linear Bidirectional: `Stop A ↔ Stop B`
    - Loop: `Stop A Loop`
    - Implement `generateUniqueLineLabel` to handle duplicate terminal pairs by adding numeric suffixes (`Stop A → Stop B 1`).

2.  **Bidirectional Rendering**:
    - Emit two separate GeoJSON features for bidirectional lines in `buildCompletedLineFeatureCollection`.
    - Introduce a `travelDirection` property (`forward` | `reverse`) on line features.
    - Apply a direction-aware `line-offset` (MapLibre paint property) to visually separate overlapping paths.

3.  **Staged and Ranked Label Lookup**:
    - Replace the fixed 16px probe with staged probes at 12px, 24px, and 40px.
    - Rank candidates based on layer/source hints (`road`, `street`, `highway`) to prefer street names over unrelated points of interest or boundary labels.

4.  **Round-Trip Preservation**:
    - Update `useNetworkSessionState.ts` to respect cached `routeSegments` and `reverseRouteSegments` on import, avoiding mandatory re-routing unless geometry is missing.
    - This ensures that exported lines look exactly the same when re-imported, preserving specific street paths chosen by the routing engine at the time of creation.

## Consequences

- Line names are now predictable and topology-aware.
- Bidirectional line paths are fully visible, including one-way street deviations.
- Stop naming is more robust and less sensitive to exact click placement relative to map label anchors.
- JSON exports now serve as high-fidelity session snapshots for single lines.
