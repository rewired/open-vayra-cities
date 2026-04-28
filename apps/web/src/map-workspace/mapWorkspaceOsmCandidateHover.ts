import type { OsmStopCandidateStreetAnchorResolution } from '../domain/osm/osmStopCandidateAnchorTypes';
import type { OsmStopCandidateGroup, OsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import type { MapLibreMap } from './maplibreGlobal';
import { resolveStreetLayerIdsFromStyle } from './mapWorkspaceStreetSnap';
import { resolveOsmStopCandidateGroupStreetAnchor } from './osmStopCandidateStreetAnchorResolution';

/** Hover payload emitted by rendered OSM stop-candidate map features. */
export interface OsmStopCandidateHoverPayload {
  readonly candidateGroupId: OsmStopCandidateGroupId;
  readonly label: string;
  readonly memberCount: number;
  readonly memberKinds: string;
  readonly berthCountHint: number;
  readonly x: number;
  readonly y: number;
}

/** OSM stop-candidate hover payload enriched with optional street-anchor resolution. */
export interface ResolvedOsmStopCandidateHoverPayload extends OsmStopCandidateHoverPayload {
  readonly anchorResolution?: OsmStopCandidateStreetAnchorResolution | undefined;
}

/** Cache used to avoid recomputing OSM candidate street anchors while hovering/selecting. */
export type OsmStopCandidateAnchorResolutionCache = Map<
  OsmStopCandidateGroupId,
  OsmStopCandidateStreetAnchorResolution
>;

/** Returns true when the current OSM hover no longer belongs to the available candidate groups. */
export function isStaleOsmStopCandidateHover(
  hover: ResolvedOsmStopCandidateHoverPayload | null,
  groups: readonly OsmStopCandidateGroup[]
): boolean {
  if (!hover) {
    return false;
  }
  return !groups.some((g) => g.id === hover.candidateGroupId);
}

/** Resolves a candidate group's street anchor, using and updating the provided cache. */
export function resolveCachedOsmStopCandidateStreetAnchor(input: {
  readonly map: MapLibreMap;
  readonly group: OsmStopCandidateGroup;
  readonly cache: OsmStopCandidateAnchorResolutionCache;
}): OsmStopCandidateStreetAnchorResolution {
  const cached = input.cache.get(input.group.id);
  if (cached) {
    return cached;
  }

  const streetLayerIds = resolveStreetLayerIdsFromStyle(input.map);
  const resolution = resolveOsmStopCandidateGroupStreetAnchor(input.map, input.group, streetLayerIds);
  input.cache.set(input.group.id, resolution);

  return resolution;
}

/** Resolves a hover payload into a tooltip-ready hover payload with cached anchor data when possible. */
export function resolveOsmStopCandidateHover(input: {
  readonly map: MapLibreMap;
  readonly hover: OsmStopCandidateHoverPayload | null;
  readonly groups: readonly OsmStopCandidateGroup[];
  readonly cache: OsmStopCandidateAnchorResolutionCache;
}): ResolvedOsmStopCandidateHoverPayload | null {
  if (!input.hover) {
    return null;
  }

  const group = input.groups.find((g) => g.id === input.hover!.candidateGroupId);
  if (!group) {
    return input.hover;
  }

  const anchorResolution = resolveCachedOsmStopCandidateStreetAnchor({
    map: input.map,
    group,
    cache: input.cache
  });

  return {
    ...input.hover,
    anchorResolution
  };
}
