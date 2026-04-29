# ADR 0152: Scenario Demand Artifact Runtime Loader Baseline

- Status: Accepted
- Date: 2026-04-29
- Slice: 152

## Context

Runtime scenario selection now points to generated scenario demand artifacts via `ScenarioDefinition.demandAssets.scenarioDemand`.
The web shell must consume generated scenario-owned artifacts rather than source-material manifests or legacy seed files.

## Decision

1. Add a dedicated browser loader (`loadScenarioDemandArtifact`) that:
   - normalizes scenario-configured generated paths into browser public fetch paths,
   - fetches and validates payloads with `parseScenarioDemandArtifact`,
   - returns explicit `{ status: 'loaded' | 'failed' }` union results,
   - rejects scenario-id mismatches,
   - returns actionable failure messaging for missing generated artifacts (HTTP 404).
2. Keep demand artifact state shell-owned in `App.tsx`, reset it on scenario changes, and coordinate demand+OSM initialization through the existing blocking data operation flow.
3. Add minimal debug-only observability (status, counts, error message) in the debug modal overview without introducing demand gameplay, simulation, heatmaps, capture, or scoring behavior.

## Consequences

- Runtime truth is explicitly sourced from generated scenario artifacts.
- Failure states are visible and actionable for contributors running local pipelines.
- Demand artifact loading remains isolated from projection and simulation behavior in this slice.
