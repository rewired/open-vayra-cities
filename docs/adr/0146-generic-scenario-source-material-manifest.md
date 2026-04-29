# ADR 0146: Generic Scenario Source Material Manifest

## Status

Proposed

## Context

Scenario demand generation requires various external source materials (e.g., manual seeds, census data, OSM extracts). To maintain a clean separation of concerns, we establish that external datasets are scenario source material only, while generated scenario artifacts are the runtime truth.

## Decision

We introduce a generic `ScenarioSourceMaterialManifest` format. 

Key principles:
1. **Source Material vs. Runtime Truth**: Manifests describe source material inputs for the generator. The simulation reads only the generated artifacts.
2. **Scenario-Agnostic**: The manifest system is generic. While Hamburg is the first scenario to use it, the system does not contain Hamburg-specific logic.
3. **Future-Proofing**: The manifest supports documenting future sources (e.g., `census-grid`, `osm-extract`) as metadata, allowing them to be disabled without requiring the underlying adapters to exist yet.

## Consequences

- Clean boundaries for data pipelines.
- Unsupported enabled source kinds will cause the generator to fail.
- No raw Zensus, OSM, or commuter datasets are processed by the runtime engine.
