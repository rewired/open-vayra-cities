# ADR 0113: Deterministic MVP Demand Scenario Baseline

## Context

The CityOps MVP requires a spatial demand layer to evaluate the effectiveness of the player's transit network. While future versions may import real-world population data (e.g., from OpenStreetMap or demographic datasets), the current focus is on a stable, implementation-friendly foundation.

## Decision

We will implement a small, deterministic, in-memory demand scenario for the Hamburg area.

*   **Format**: A collection of hand-authored `DemandNode` objects.
*   **Location**: `apps/web/src/domain/demand/mvpDemandScenario.ts`.
*   **Content**: 
    *   ~10 residential origin nodes.
    *   ~8 workplace destination nodes.
    *   Hamburg-area coordinates (spatial clusters).
*   **Wiring**: The app will consume this scenario as the default session demand baseline.

## Rationale

*   **Decoupling**: It allows testing of catchment and served-demand projections without blocking on data import pipelines.
*   **Determinism**: A fixed scenario ensures that projection results are predictable and reproducible during development and testing.
*   **Simplicity**: Avoids the complexity of city growth simulation or procedural generation in the MVP.
*   **Product Truth**: Reinforces the rule that demand comes from spatial nodes, not stops.

## Scope & Boundaries

*   **Residential Origins**: Represent where passengers live.
*   **Workplace Destinations**: Represent where passengers work.
*   **No OSM Import**: This slice does not include OSM landuse or building imports.
*   **No Growth**: The scenario is static; no city growth or demographic shifts.
*   **No Map Overlay**: Demand nodes are not yet rendered on the map in this slice.
*   **Time-Bands**: Demand weights vary by canonical time bands (e.g., morning rush).

## Consequences

*   **Positive**: The game has "truth" to project against immediately.
*   **Positive**: Easy to swap with different scenarios or importers later.
*   **Neutral**: Manual authoring of coordinates is required for the baseline.
