# ADR 0126: OSM Stop Candidate Source Corrective (Slice 100b)

## Status

Active

## Context

Slice 100 implemented OSM stop candidates using a hardcoded synthetic Hamburg TypeScript fixture with fake candidate data embedded directly in source code. This was identified as a problem that violates the architecture principle that external geographic data must not be hardcoded in application source.

Additionally, Slice 100 rendered OSM candidates with permanent symbol labels on the map, which implied stronger ownership than raw external candidates should have.

## Decision

1. **Remove synthetic Hamburg fixture**: Delete `apps/web/src/domain/osm/hamburgOsmStopCandidates.ts` and all imports/usages of `HAMBURG_OSM_STOP_CANDIDATES`.

2. **Add OSM candidate loader boundary**: Create `apps/web/src/domain/osm/osmStopCandidateSource.ts` that:
   - Fetches `/generated/osm-stop-candidates.geojson` at runtime
   - Validates GeoJSON structure before conversion
   - Returns empty array if artifact is missing (no synthetic fallbacks)
   - No `any` or `as any` types

3. **Add generated artifact path**: Add `.gitignore` entries so generated browser artifacts are ignored:
   ```
   apps/web/public/generated/*.geojson
   apps/web/public/generated/*.json
   ```
   Keep `.gitkeep` discoverable.

4. **Add local OSM extraction script**: Create `scripts/osm/build-stop-candidates.ps1` with parameterized input/output paths:
   - Accepts `-InputPbf` parameter (defaults to Hamburg PBF)
   - Outputs GeoJSON to `apps/web/public/generated/osm-stop-candidates.geojson`
   - Extracts nodes tagged `highway=bus_stop`, `public_transport=platform`, `public_transport=stop_position`
   - Produces deterministic GeoJSON with real OSM element ids

5. **Remove candidate label layer**: Remove symbol layer constants and rendering for OSM candidates:
   - Remove `MAP_LAYER_ID_OSM_STOP_CANDIDATES_LABEL`
   - Remove `MAP_OSM_STOP_CANDIDATE_LABEL_LAYER_LAYOUT`
   - Remove `MAP_OSM_STOP_CANDIDATE_LABEL_LAYER_PAINT`
   - Keep only `MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE`

6. **Add hover-only candidate labels**: Create `OsmStopCandidateHoverTooltip.tsx` that shows candidate name and kind on hover only.

7. **Preserve candidate separation**: OSM candidates remain separate from canonical `Stop`. They cannot be adopted in this slice.

## Consequences

### Positive

- Geographic data is now external and replaceable
- Generated artifacts are gitignored
- No hardcoded city-specific source
- Candidates visible only as markers, details discoverable on hover
- Clean separation between external candidates and internal stops

### Out of Scope

- No click-to-adopt behavior (deferred)
- No conversion to canonical stops (deferred)
- No remote OSM API at runtime

## Compliance

- No `any` or `as any` added
- Exports documented per AGENTS.md
- Constants centralized
- No new transport modes
- No mobile/touch behavior added