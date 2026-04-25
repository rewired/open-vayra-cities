import {
  STREET_SNAP_DIRECT_HIT_QUERY_RADIUS_PIXELS,
  STREET_SNAP_FALLBACK_MAX_FEATURE_MATCH_STRENGTH,
  STREET_SNAP_FALLBACK_MAX_PIXEL_TOLERANCE,
  STREET_SNAP_FALLBACK_MIN_DISTANCE_ADVANTAGE_PIXELS,
  STREET_SNAP_FALLBACK_QUERY_OFFSETS,
  STREET_SNAP_MAX_PIXEL_TOLERANCE,
  STREET_LABEL_LOOKUP_QUERY_RADII_PIXELS,
  STREET_LABEL_LAYER_HINTS
} from './mapWorkspacePlacementConstants';
import {
  getSourceRefsForLayerIds,
  type MapLibreFeatureGeometry,
  type MapLibreInteractionEvent,
  type MapLibreMap,
  type MapLibreRenderedFeature
} from './maplibreGlobal';
import { extractStreetLabelCandidate } from './streetFeatureLabel';

interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

interface GeographicPoint {
  readonly lng: number;
  readonly lat: number;
}

interface SnapCandidate {
  readonly snappedPosition: GeographicPoint;
  readonly pixelDistance: number;
  readonly ranking: SnapCandidateRankingMetadata;
  readonly streetLabelCandidate: string | null;
}

type SnapCandidateProvenance = 'direct-hit' | 'fallback';

interface SnapCandidateRankingMetadata {
  readonly provenance: SnapCandidateProvenance;
  readonly featureLayerMatchStrength: number;
}

const STREET_LAYER_HINTS = ['road', 'street', 'highway', 'bridge', 'tunnel', 'transport', 'path'] as const;
const STREET_SOURCE_HINTS = ['road', 'street', 'transport', 'highway'] as const;

const includesHint = (value: string | undefined, hints: readonly string[]): boolean => {
  if (!value) {
    return false;
  }

  const lowered = value.toLowerCase();
  return hints.some((hint) => lowered.includes(hint));
};

const isLineGeometry = (geometry: MapLibreFeatureGeometry | undefined): boolean =>
  geometry?.type === 'LineString' || geometry?.type === 'MultiLineString';

const isCoordinatePair = (value: unknown): value is readonly [number, number] =>
  Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number';

const isLineStringCoordinates = (value: unknown): value is readonly (readonly [number, number])[] =>
  Array.isArray(value) && value.every((coordinatePair) => isCoordinatePair(coordinatePair));

const isMultiLineStringCoordinates = (value: unknown): value is readonly (readonly (readonly [number, number])[])[] =>
  Array.isArray(value) && value.every((lineCoordinates) => isLineStringCoordinates(lineCoordinates));

const toLineCoordinateCollections = (geometry: MapLibreFeatureGeometry | undefined): readonly (readonly (readonly [number, number])[])[] => {
  if (!geometry) {
    return [];
  }

  if (geometry.type === 'LineString' && isLineStringCoordinates(geometry.coordinates)) {
    return [geometry.coordinates];
  }

  if (geometry.type === 'MultiLineString' && isMultiLineStringCoordinates(geometry.coordinates)) {
    return geometry.coordinates;
  }

  return [];
};

const toFeatureSourceKey = (source: string | undefined, sourceLayer: string | undefined): string | null => {
  if (!source) {
    return null;
  }

  return `${source}:${sourceLayer ?? ''}`;
};

const hasStreetLineGeometryInSourceFallback = (
  map: MapLibreMap,
  event: MapLibreInteractionEvent,
  streetLayerIds: readonly string[]
): boolean => {
  const styleDefinition = map.getStyle();
  const sourceRefs = getSourceRefsForLayerIds(styleDefinition, streetLayerIds);

  if (sourceRefs.length === 0) {
    return false;
  }

  const clickedSourceKeys = new Set(
    map
      .queryRenderedFeatures(event.point)
      .map((feature) => toFeatureSourceKey(feature.source, feature.sourceLayer ?? feature['source-layer']))
      .filter((sourceKey): sourceKey is string => sourceKey !== null)
  );

  if (clickedSourceKeys.size === 0) {
    return false;
  }

  return sourceRefs.some((sourceRef) => {
    const sourceRefKey = toFeatureSourceKey(sourceRef.source, sourceRef.sourceLayer);

    if (!sourceRefKey || !clickedSourceKeys.has(sourceRefKey)) {
      return false;
    }

    const sourceFeatures = map.querySourceFeatures(
      sourceRef.source,
      sourceRef.sourceLayer ? { sourceLayer: sourceRef.sourceLayer } : undefined
    );
    return sourceFeatures.some((feature) => isLineGeometry(feature.geometry));
  });
};

const resolveNearestPointOnSegment = (
  point: ScreenPoint,
  segmentStart: ScreenPoint,
  segmentEnd: ScreenPoint
): { readonly ratio: number; readonly distance: number } => {
  const deltaX = segmentEnd.x - segmentStart.x;
  const deltaY = segmentEnd.y - segmentStart.y;
  const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (segmentLengthSquared === 0) {
    const distanceToDegenerateSegment = Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
    return { ratio: 0, distance: distanceToDegenerateSegment };
  }

  const projectedRatio =
    ((point.x - segmentStart.x) * deltaX + (point.y - segmentStart.y) * deltaY) / segmentLengthSquared;
  const clampedRatio = Math.min(1, Math.max(0, projectedRatio));
  const nearestX = segmentStart.x + clampedRatio * deltaX;
  const nearestY = segmentStart.y + clampedRatio * deltaY;
  const distance = Math.hypot(point.x - nearestX, point.y - nearestY);

  return { ratio: clampedRatio, distance };
};

const toProvenanceRank = (provenance: SnapCandidateProvenance): number => (provenance === 'direct-hit' ? 0 : 1);

const compareSnapCandidates = (left: SnapCandidate, right: SnapCandidate): number => {
  const provenanceDelta = toProvenanceRank(left.ranking.provenance) - toProvenanceRank(right.ranking.provenance);
  if (provenanceDelta !== 0) {
    return provenanceDelta;
  }

  const featureMatchStrengthDelta = left.ranking.featureLayerMatchStrength - right.ranking.featureLayerMatchStrength;
  if (featureMatchStrengthDelta !== 0) {
    return featureMatchStrengthDelta;
  }

  const pixelDistanceDelta = left.pixelDistance - right.pixelDistance;
  if (pixelDistanceDelta !== 0) {
    return pixelDistanceDelta;
  }

  const lngDelta = left.snappedPosition.lng - right.snappedPosition.lng;
  if (lngDelta !== 0) {
    return lngDelta;
  }

  return left.snappedPosition.lat - right.snappedPosition.lat;
};

const resolvePreferredSnapCandidate = (currentBest: SnapCandidate | null, nextCandidate: SnapCandidate): SnapCandidate => {
  if (!currentBest) {
    return nextCandidate;
  }

  return compareSnapCandidates(nextCandidate, currentBest) < 0 ? nextCandidate : currentBest;
};

const resolveFeatureLayerMatchStrength = (
  feature: {
    readonly layer?: { readonly id?: string };
    readonly source?: string;
    readonly sourceLayer?: string;
    readonly 'source-layer'?: string;
  },
  streetLayerIds: readonly string[]
): number => {
  const isStreetLayerIdMatch = typeof feature.layer?.id === 'string' && streetLayerIds.includes(feature.layer.id);
  const hasStreetLayerHint = includesHint(feature.layer?.id, STREET_LAYER_HINTS);
  const hasStreetSourceHint =
    includesHint(feature.source, STREET_SOURCE_HINTS) ||
    includesHint(feature.sourceLayer ?? feature['source-layer'], STREET_SOURCE_HINTS);

  if (isStreetLayerIdMatch && (hasStreetLayerHint || hasStreetSourceHint)) {
    return 0;
  }

  if (isStreetLayerIdMatch || hasStreetLayerHint || hasStreetSourceHint) {
    return 1;
  }

  return 2;
};

const resolveSnapCandidateForLineCoordinates = (
  map: MapLibreMap,
  clickPoint: ScreenPoint,
  coordinates: readonly (readonly [number, number])[],
  ranking: SnapCandidateRankingMetadata,
  streetLabelCandidate: string | null
): SnapCandidate | null => {
  if (coordinates.length < 2) {
    return null;
  }

  let nearestCandidate: SnapCandidate | null = null;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const segmentStartCoordinate = coordinates[index];
    const segmentEndCoordinate = coordinates[index + 1];

    if (!segmentStartCoordinate || !segmentEndCoordinate) {
      continue;
    }

    const segmentStartPoint = map.project(segmentStartCoordinate);
    const segmentEndPoint = map.project(segmentEndCoordinate);
    const nearestOnSegment = resolveNearestPointOnSegment(clickPoint, segmentStartPoint, segmentEndPoint);

    if (nearestOnSegment.distance > STREET_SNAP_MAX_PIXEL_TOLERANCE) {
      continue;
    }

    const snappedPosition: GeographicPoint = {
      lng: segmentStartCoordinate[0] + (segmentEndCoordinate[0] - segmentStartCoordinate[0]) * nearestOnSegment.ratio,
      lat: segmentStartCoordinate[1] + (segmentEndCoordinate[1] - segmentStartCoordinate[1]) * nearestOnSegment.ratio
    };
    const nextCandidate: SnapCandidate = {
      snappedPosition,
      pixelDistance: nearestOnSegment.distance,
      ranking,
      streetLabelCandidate
    };

    nearestCandidate = resolvePreferredSnapCandidate(nearestCandidate, nextCandidate);
  }

  return nearestCandidate;
};

const resolveBestSnapCandidateFromFeatures = (
  map: MapLibreMap,
  clickPoint: ScreenPoint,
  features: readonly MapLibreRenderedFeature[],
  streetLayerIds: readonly string[],
  provenance: SnapCandidateProvenance
): SnapCandidate | null => {
  let bestCandidate: SnapCandidate | null = null;

  for (const feature of features) {
    if (!isLineGeometry(feature.geometry)) {
      continue;
    }

    const ranking: SnapCandidateRankingMetadata = {
      provenance,
      featureLayerMatchStrength: resolveFeatureLayerMatchStrength(feature, streetLayerIds)
    };
    const streetLabelCandidate = extractStreetLabelCandidate(feature.properties);
    const lineCollections = toLineCoordinateCollections(feature.geometry);

    for (const lineCoordinates of lineCollections) {
      const candidate = resolveSnapCandidateForLineCoordinates(
        map,
        clickPoint,
        lineCoordinates,
        ranking,
        streetLabelCandidate
      );

      if (!candidate) {
        continue;
      }

      bestCandidate = resolvePreferredSnapCandidate(bestCandidate, candidate);
    }
  }

  return bestCandidate;
};

const resolveDirectHitSnapCandidate = (
  map: MapLibreMap,
  event: MapLibreInteractionEvent,
  streetLayerIds: readonly string[]
): SnapCandidate | null => {
  const directHitQueryRadiusPixels = STREET_SNAP_DIRECT_HIT_QUERY_RADIUS_PIXELS;
  const directHitQueryPointOrBox =
    directHitQueryRadiusPixels === 0
      ? event.point
      : ([
          { x: event.point.x - directHitQueryRadiusPixels, y: event.point.y - directHitQueryRadiusPixels },
          { x: event.point.x + directHitQueryRadiusPixels, y: event.point.y + directHitQueryRadiusPixels }
        ] as const);

  const directHitFeatures = map.queryRenderedFeatures(directHitQueryPointOrBox, { layers: streetLayerIds });
  return resolveBestSnapCandidateFromFeatures(map, event.point, directHitFeatures, streetLayerIds, 'direct-hit');
};

const resolveFallbackSnapCandidate = (
  map: MapLibreMap,
  event: MapLibreInteractionEvent,
  streetLayerIds: readonly string[]
): SnapCandidate | null => {
  const fallbackCandidates: SnapCandidate[] = [];

  for (const offset of STREET_SNAP_FALLBACK_QUERY_OFFSETS) {
    const queryPoint: ScreenPoint = { x: event.point.x + offset.deltaX, y: event.point.y + offset.deltaY };
    const fallbackFeatures = map.queryRenderedFeatures(queryPoint, { layers: streetLayerIds });
    const candidate = resolveBestSnapCandidateFromFeatures(map, event.point, fallbackFeatures, streetLayerIds, 'fallback');

    if (!candidate) {
      continue;
    }

    fallbackCandidates.push(candidate);
  }

  if (fallbackCandidates.length === 0) {
    return null;
  }

  const rankedFallbackCandidates = [...fallbackCandidates].sort(compareSnapCandidates);
  const [bestCandidate, secondBestCandidate] = rankedFallbackCandidates;

  if (!bestCandidate) {
    return null;
  }

  if (
    bestCandidate.pixelDistance > STREET_SNAP_FALLBACK_MAX_PIXEL_TOLERANCE ||
    bestCandidate.ranking.featureLayerMatchStrength > STREET_SNAP_FALLBACK_MAX_FEATURE_MATCH_STRENGTH
  ) {
    return null;
  }

  if (!secondBestCandidate) {
    return bestCandidate;
  }

  const distanceAdvantage = secondBestCandidate.pixelDistance - bestCandidate.pixelDistance;
  if (distanceAdvantage < STREET_SNAP_FALLBACK_MIN_DISTANCE_ADVANTAGE_PIXELS) {
    return null;
  }

  return bestCandidate;
};

/**
 * Searches for a usable street name from any currently rendered features using a bounded staged/ranked lookup.
 * This is used as a fallback when the snapped street line feature has no descriptive name.
 * 
 * Logic:
 * 1. Iterates through staged radii (centralized in constants).
 * 2. Queries rendered features in the current radius.
 * 3. Identifies candidates via extractStreetLabelCandidate.
 * 4. Ranks candidates by:
 *    - Layer/source match strength (road/street labels preferred)
 *    - Stable lexical tie-breaker
 */
export const resolveNearbyStreetLabelCandidate = (
  map: MapLibreMap,
  snappedPoint: GeographicPoint
): string | null => {
  const queryPoint = map.project([snappedPoint.lng, snappedPoint.lat]);
  
  for (const radius of STREET_LABEL_LOOKUP_QUERY_RADII_PIXELS) {
    const queryBox = [
      { x: queryPoint.x - radius, y: queryPoint.y - radius },
      { x: queryPoint.x + radius, y: queryPoint.y + radius }
    ] as const;

    const features = map.queryRenderedFeatures(queryBox);
    const candidates: Array<{ label: string; matchStrength: number }> = [];

    for (const feature of features) {
      const label = extractStreetLabelCandidate(feature.properties);
      if (!label) {
        continue;
      }

      // Rank by layer/source hint strength
      const hasLabelHint = includesHint(feature.layer?.id, STREET_LABEL_LAYER_HINTS);
      const hasSourceHint = 
        includesHint(feature.source, STREET_LABEL_LAYER_HINTS) ||
        includesHint(feature.sourceLayer ?? feature['source-layer'], STREET_LABEL_LAYER_HINTS);

      const matchStrength = (hasLabelHint ? 0 : 1) + (hasSourceHint ? 0 : 1);
      candidates.push({ label, matchStrength });
    }

    if (candidates.length > 0) {
      // Sort by match strength (ascending, 0 is best) then alphabetically
      candidates.sort((a, b) => {
        if (a.matchStrength !== b.matchStrength) {
          return a.matchStrength - b.matchStrength;
        }
        return a.label.localeCompare(b.label);
      });

      return candidates[0].label;
    }
  }

  return null;
};

/** Resolves style layer ids that likely represent street LineString sources in the active map style. */
export const resolveStreetLayerIdsFromStyle = (map: MapLibreMap): readonly string[] => {
  const styleDefinition = map.getStyle();

  if (!styleDefinition?.layers) {
    return [];
  }

  return styleDefinition.layers
    .filter((layer) => {
      const isLineLikeLayer = layer.type === 'line';
      const hasStreetLayerHint = includesHint(layer.id, STREET_LAYER_HINTS);
      const hasStreetSourceHint =
        includesHint(layer.source, STREET_SOURCE_HINTS) ||
        includesHint(layer.sourceLayer ?? layer['source-layer'], STREET_SOURCE_HINTS);

      return isLineLikeLayer && (hasStreetLayerHint || hasStreetSourceHint);
    })
    .map((layer) => layer.id);
};

/** Validates whether a click can place a stop by requiring street line geometry at the clicked map point. */
export const isEligibleStopPlacementClickForLayers = (
  map: MapLibreMap,
  event: MapLibreInteractionEvent,
  streetLayerIds: readonly string[]
): boolean => {
  if (streetLayerIds.length === 0) {
    return false;
  }

  const renderedFeatures = map.queryRenderedFeatures(event.point, { layers: streetLayerIds });
  if (renderedFeatures.some((feature) => isLineGeometry(feature.geometry))) {
    return true;
  }

  return hasStreetLineGeometryInSourceFallback(map, event, streetLayerIds);
};

/** Resolves the final snapped street lng/lat for stop placement using direct-hit-first candidate ranking. */
export const resolveSnappedStreetPosition = (
  map: MapLibreMap,
  event: MapLibreInteractionEvent,
  streetLayerIds: readonly string[]
): Readonly<{ lng: number; lat: number; streetLabelCandidate: string | null }> | null => {
  if (streetLayerIds.length === 0) {
    return null;
  }

  const directHitCandidate = resolveDirectHitSnapCandidate(map, event, streetLayerIds);
  if (directHitCandidate) {
    const lng = directHitCandidate.snappedPosition.lng;
    const lat = directHitCandidate.snappedPosition.lat;
    const streetLabelCandidate =
      directHitCandidate.streetLabelCandidate ?? resolveNearbyStreetLabelCandidate(map, { lng, lat });

    return {
      lng,
      lat,
      streetLabelCandidate
    };
  }

  const fallbackCandidate = resolveFallbackSnapCandidate(map, event, streetLayerIds);
  if (!fallbackCandidate) {
    return null;
  }

  const fallbackLng = fallbackCandidate.snappedPosition.lng;
  const fallbackLat = fallbackCandidate.snappedPosition.lat;
  const fallbackStreetLabelCandidate =
    fallbackCandidate.streetLabelCandidate ?? resolveNearbyStreetLabelCandidate(map, { lng: fallbackLng, lat: fallbackLat });

  return {
    lng: fallbackLng,
    lat: fallbackLat,
    streetLabelCandidate: fallbackStreetLabelCandidate
  };
};
