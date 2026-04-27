# ADR 0125: OSM Stop Candidate Overlay and Manual Placement Freeze

## Status

Superseded by ADR 0126

## Context

CityOps is transitioning from free manual stop placement toward OSM stop adoption. The MVP requires players to see OSM-sourced stop candidates as a visual overlay while keeping existing manual placement code intact for later reactivation. Manual placement must be hidden from the player-facing UI but not deleted. OSM candidates must be visually distinct from canonical CityOS stops and must not enter network truth.

## Decision

1. **Manual stop placement freeze**: Hide the `place-stop` tool from the player-facing tool rail in `App.tsx`. Keep the `WorkspaceToolMode` union, placement state, handlers, and tests intact.

2. **OSM stop candidate domain types**: Introduce `OsmStopCandidateId`, `OsmStopCandidateKind`, `OsmStopCandidate` in `apps/web/src/domain/types/osmStopCandidate.ts`. These are separate from canonical `Stop` types to prevent accidental adoption into network truth.

3. **Deterministic Hamburg fixture**: Add `apps/web/src/domain/osm/hamburgOsmStopCandidates.ts` with 6 static OSM bus stop candidates. No runtime remote OSM API calls (no Overpass, no PBF parsing).

4. **Separate GeoJSON builder**: Create `apps/web/src/map-workspace/osmStopCandidateGeoJson.ts` to build `FeatureCollection<Point>` with `candidateId` (not `stopId`) to avoid confusion with CityOS stops.

5. **Separate MapLibre source/layers**: Add `MAP_SOURCE_ID_OSM_STOP_CANDIDATES` and associated layer constants to `mapRenderConstants.ts`. OSM candidates render below CityOS stops with subdued styling.

6. **Source sync integration**: Extend `mapWorkspaceSourceSync.ts` to register and sync OSM sources/layers separately from CityOS stop sources. OSM layers are excluded from stop/line click handling.

7. **No interactive adoption**: OSM candidates are non-interactive in this slice. Clicking them does not create/select CityOS stops or allow line building.

## Consequences

### Positive

- Players see real-world OSM stop context without affecting canonical network state.
- Manual placement code preserved for future reactivation.
- Clear separation between external OSM candidates and internal CityOS stops.
- No new runtime dependencies (no remote OSM APIs).
- Type-safe OSM candidate handling with branded IDs.

### Negative

- OSM candidates are static fixtures, not dynamic OSM data (deferred to later slices).
- Manual placement is temporarily unavailable to players.
- Additional map layers increase rendering complexity marginally.

## Compliance

- No `any` or `as any` shortcuts added.
- All new exports documented per AGENTS.md.
- Constants centralized in `mapRenderConstants.ts` and domain modules.
- No new transport modes introduced.
- No mobile/touch support added.
- No demand/economy changes.
