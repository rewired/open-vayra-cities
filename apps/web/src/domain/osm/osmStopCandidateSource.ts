import type { OsmStopCandidate, OsmStopCandidateId, OsmStopCandidateKind } from '../types/osmStopCandidate';
import { createOsmStopCandidateId } from '../types/osmStopCandidate';
import type { StopPosition } from '../types/stop';

const OSM_CANDIDATE_ARTIFACT_PATH = '/generated/osm-stop-candidates.geojson';

interface OsmStopCandidateGeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    candidateId: string;
    label: string;
    kind: string;
    source: string;
    osmElementType?: string;
    osmElementId?: string;
  };
}

interface OsmStopCandidateGeoJsonCollection {
  type: 'FeatureCollection';
  features: OsmStopCandidateGeoJsonFeature[];
}

/**
 * Loads OSM stop candidates from the locally generated artifact.
 * Returns an empty array if the artifact is missing.
 * Does not create synthetic fallback stops.
 */
export const loadOsmStopCandidates = async (): Promise<readonly OsmStopCandidate[]> => {
  let response: Response;

  try {
    response = await fetch(OSM_CANDIDATE_ARTIFACT_PATH);
  } catch {
    console.warn('[osm-stop-candidate-source] No artifact found, loading zero candidates');
    return [];
  }

  if (!response.ok) {
    console.warn(`[osm-stop-candidate-source] Artifact fetch failed (${response.status}), loading zero candidates`);
    return [];
  }

  let json: unknown;

  try {
    json = await response.json();
  } catch {
    console.warn('[osm-stop-candidate-source] Artifact JSON parse failed, loading zero candidates');
    return [];
  }

  if (!isValidOsmStopCandidateGeoJson(json)) {
    console.warn('[osm-stop-candidate-source] Artifact validation failed, loading zero candidates');
    return [];
  }

  const candidates: OsmStopCandidate[] = json.features.map((feature) => {
    const position: StopPosition = {
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1]
    };

    const kind: OsmStopCandidateKind = normalizeOsmStopCandidateKind(feature.properties.kind);

    const hasOsmElementType = feature.properties.osmElementType != null && feature.properties.osmElementType !== '';

    return {
      id: createOsmStopCandidateId(feature.properties.candidateId),
      position,
      label: feature.properties.label,
      kind,
      source: 'osm' as const,
      ...(hasOsmElementType ? { osmElementType: feature.properties.osmElementType as 'node' | 'way' | 'relation' } : {}),
      ...(feature.properties.osmElementId != null && feature.properties.osmElementId !== '' ? { osmElementId: feature.properties.osmElementId } : {})
    };
  });

  return candidates;
};

const isValidOsmStopCandidateGeoJson = (value: unknown): value is OsmStopCandidateGeoJsonCollection => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (obj.type !== 'FeatureCollection') {
    return false;
  }

  if (!Array.isArray(obj.features)) {
    return false;
  }

  for (const feature of obj.features) {
    if (!isValidOsmStopCandidateFeature(feature)) {
      return false;
    }
  }

  return true;
};

const isValidOsmStopCandidateFeature = (value: unknown): value is OsmStopCandidateGeoJsonFeature => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const feature = value as Record<string, unknown>;

  if (feature.type !== 'Feature') {
    return false;
  }

  if (!isValidPointGeometry(feature.geometry)) {
    return false;
  }

  if (!isValidOsmStopCandidateProperties(feature.properties)) {
    return false;
  }

  return true;
};

const isValidPointGeometry = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const geometry = value as Record<string, unknown>;

  if (geometry.type !== 'Point') {
    return false;
  }

  if (!Array.isArray(geometry.coordinates)) {
    return false;
  }

  if (geometry.coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = geometry.coordinates;

  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return false;
  }

  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

const isValidOsmStopCandidateProperties = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const props = value as Record<string, unknown>;

  if (typeof props.candidateId !== 'string' || props.candidateId.length === 0) {
    return false;
  }

  if (typeof props.label !== 'string' || props.label.length === 0) {
    return false;
  }

  if (typeof props.kind !== 'string' || props.kind.length === 0) {
    return false;
  }

  if (props.source !== 'osm') {
    return false;
  }

  return true;
};

const normalizeOsmStopCandidateKind = (kind: string): OsmStopCandidateKind => {
  switch (kind) {
    case 'bus-stop':
      return 'bus-stop';
    case 'public-transport-platform':
      return 'public-transport-platform';
    case 'public-transport-stop-position':
      return 'public-transport-stop-position';
    default:
      return 'bus-stop';
  }
};