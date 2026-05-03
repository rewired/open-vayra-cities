# ADR 0180: Scenario Demand Provenance and Model Caveat

## Status

Accepted

## Context

In OpenVayra - Cities, the Demand tab provides critical planning context for player network expansion. However, the current visualization lacks transparency regarding the nature and origin of the demand data. 

Without explicit provenance and caveats, players might mistake the generated scenario demand for real observed passenger flows or a high-fidelity origin-destination (OD) matrix. Furthermore, the role of stops as capture/service entities rather than generation entities needs reinforcement for clear gameplay mental models.

## Decision

We will implement a pure **Scenario Demand Provenance Projection** and a corresponding Inspector UI section to expose data origins and model limitations.

1.  **Metadata Projection**: The projection will derive player-facing labels from the `ScenarioDemandArtifact` source metadata, including:
    *   Generator name and version.
    *   Contributing source materials (census grids, OSM extracts, etc.).
    *   Licensing and attribution hints.
2.  **Explicit Model Caveat**: The UI will explicitly state that demand is generated for gameplay planning context and is not observed passenger demand or a true OD matrix.
3.  **Stop Boundary Clarification**: The UI will reinforce that stops capture and serve demand, but do not generate it.
4.  **Runtime Integrity**: The implementation will strictly consume the loaded generated artifact metadata. It will not read raw source-material files (CSV, PBF, etc.) at runtime to avoid introducing external dependencies or overhead.
5.  **Low-Noise UI**: The provenance information will be rendered in a compact, initially collapsed disclosure titled "Demand model" within the Inspector Demand tab.

## Consequences

*   **Trust and Transparency**: Players understand where the data comes from and what it represents, reducing unrealistic expectations of simulation fidelity.
*   **Architectural Cleanliness**: Provenance remains a pure projection of artifact metadata, preserving existing simulation and demand generation boundaries.
*   **Player Education**: Explicit notes on stop behavior help players build accurate mental models of the game's demand-capture mechanics.
*   **Green-State Compliance**: The implementation avoids broad type casts and maintains strict TypeScript safety for artifact consumption.
