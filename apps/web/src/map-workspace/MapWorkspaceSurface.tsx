import { useEffect, useRef, useState, type ReactElement } from 'react';

import {
  LINE_BUILD_PLACEHOLDER_LABEL_PREFIX,
  MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE
} from '../domain/constants/lineBuilding';
import type { Line } from '../domain/types/line';
import { createLineId, createUnsetLineFrequencyByTimeBand } from '../domain/types/line';
import type { LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import { buildFallbackLineRouteSegments } from '../domain/routing/fallbackLineRouting';
import type { Stop, StopId } from '../domain/types/stop';
import { createStopId } from '../domain/types/stop';
import type { LineBuildSelectionState, WorkspaceToolMode } from '../App';
import { MAP_WORKSPACE_BOOTSTRAP_CONFIG } from './mapBootstrapConfig';
import {
  STREET_SNAP_DIRECT_HIT_QUERY_RADIUS_PIXELS,
  STREET_SNAP_FALLBACK_MAX_FEATURE_MATCH_STRENGTH,
  STREET_SNAP_FALLBACK_MAX_PIXEL_TOLERANCE,
  STREET_SNAP_FALLBACK_MIN_DISTANCE_ADVANTAGE_PIXELS,
  STREET_SNAP_FALLBACK_QUERY_OFFSETS,
  STREET_SNAP_MAX_PIXEL_TOLERANCE
} from './mapWorkspacePlacementConstants';
import {
  MAP_COMPLETED_LINE_LAYER_FILTER,
  MAP_COMPLETED_LINE_LAYER_PAINT,
  MAP_COMPLETED_LINE_SELECTED_LAYER_FILTER,
  MAP_COMPLETED_LINE_SELECTED_LAYER_PAINT,
  MAP_DRAFT_LINE_LAYER_PAINT,
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_COMPLETED_LINES_SELECTED,
  MAP_LAYER_ID_DRAFT_LINE,
  MAP_LAYER_ID_STOPS_CIRCLE,
  MAP_LAYER_ID_STOPS_LABEL,
  MAP_LAYER_ID_VEHICLES,
  MAP_SOURCE_ID_COMPLETED_LINES,
  MAP_SOURCE_ID_DRAFT_LINE,
  MAP_SOURCE_ID_STOPS,
  MAP_SOURCE_ID_VEHICLES,
  MAP_STOP_CIRCLE_LAYER_STYLE,
  MAP_STOP_LABEL_LAYER_LAYOUT,
  MAP_STOP_LABEL_LAYER_PAINT,
  MAP_VEHICLE_CIRCLE_LAYER_PAINT
} from './mapRenderConstants';
import { buildCompletedLineFeatureCollection, buildDraftLineFeatureCollection } from './lineGeoJson';
import { buildStopFeatureCollection } from './stopGeoJson';
import { buildVehicleFeatureCollection } from './vehicleGeoJson';
import {
  getSourceRefsForLayerIds,
  type MapLibreFeatureGeometry,
  type MapLibreGeoJsonSource,
  type MapLibreInteractionEvent,
  type MapLibreMap
} from './maplibreGlobal';

type MapSurfaceInteractionStatus = 'idle' | 'pointer-active' | 'click-captured' | 'placement-rejected';

type PlacementAttemptResult = 'none' | 'placed' | 'invalid-target';

/**
 * Canonical single-stop selection contract shared by marker highlighting and shell inspector state.
 */
export interface StopSelectionState {
  readonly selectedStopId: StopId;
}

interface MapSurfacePointerState {
  readonly screenX: number;
  readonly screenY: number;
  readonly lng?: number;
  readonly lat?: number;
}

interface MapSurfaceInteractionState {
  readonly status: MapSurfaceInteractionStatus;
  readonly pointer: MapSurfacePointerState | null;
}

interface NeutralMapTelemetryHandlers {
  readonly onPointerMove: (event: MapLibreInteractionEvent) => void;
  readonly onMapClick: (event: MapLibreInteractionEvent) => void;
}

interface NeutralMapTelemetryContracts {
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
}

interface PlacementGameplayContracts {
  readonly map: MapLibreMap;
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
  readonly setPlacementAttemptResult: (nextState: PlacementAttemptResult) => void;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly onValidPlacement: (lng: number, lat: number) => Stop;
}

interface BuildLineModeMapClickContracts {
  readonly onInspectModeNonFeatureMapClick: () => void;
}


interface MapWorkspaceSurfaceInteractionsContracts {
  readonly map: MapLibreMap;
  readonly activeToolMode: WorkspaceToolMode;
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
  readonly setPlacementAttemptResult: (nextState: PlacementAttemptResult) => void;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly onValidPlacement: (lng: number, lat: number) => Stop;
  readonly buildLineContracts: BuildLineModeMapClickContracts;
}

interface MapWorkspaceResizeBinding {
  readonly dispose: () => void;
}

interface StopFeatureInteractionBinding {
  readonly dispose: () => void;
}

interface CompletedLineFeatureInteractionBinding {
  readonly dispose: () => void;
}

interface MapWorkspaceSurfaceProps {
  readonly activeToolMode: WorkspaceToolMode;
  readonly selectedStopId: StopId | null;
  readonly placedStops: readonly Stop[];
  readonly lineBuildSelection: LineBuildSelectionState;
  readonly sessionLines: readonly Line[];
  readonly selectedLineId: Line['id'] | null;
  readonly vehicleNetworkProjection: LineVehicleNetworkProjection;
  readonly onPlacedStopsChange: (updater: (currentStops: readonly Stop[]) => readonly Stop[]) => void;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly onLineBuildSelectionChange: (nextSelection: LineBuildSelectionState) => void;
  readonly onSessionLinesChange: (updater: (currentLines: readonly Line[]) => readonly Line[]) => void;
  readonly onSelectedLineIdChange: (nextSelectedLineId: Line['id'] | null) => void;
}

interface DraftLineMetadata {
  readonly draftOrdinal: number;
  readonly startedAtIsoUtc: string;
}

interface DraftLineState {
  readonly stopIds: readonly StopId[];
  readonly metadata: DraftLineMetadata | null;
}

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
}

type SnapCandidateProvenance = 'direct-hit' | 'fallback';

interface SnapCandidateRankingMetadata {
  readonly provenance: SnapCandidateProvenance;
  readonly featureLayerMatchStrength: number;
}

const STREET_LAYER_HINTS = ['road', 'street', 'highway', 'bridge', 'tunnel', 'transport', 'path'] as const;
const STREET_SOURCE_HINTS = ['road', 'street', 'transport', 'highway'] as const;
const STOP_LABEL_PREFIX = 'Stop';
const PLACEMENT_MODE_INDICATOR_LABEL = 'Placement mode active';
const BUILD_LINE_MODE_INDICATOR_LABEL = 'Build-line mode active';
const PLACEMENT_FEEDBACK_MESSAGES = {
  modeInstruction: 'Click a street segment to place a stop.',
  streetRuleHint: 'Placement rule: stops can only be placed on street line segments.',
  attemptReady: 'Last attempt: waiting for placement input.',
  attemptPlaced: 'Last attempt: stop placed.',
  attemptInvalidTarget: 'Last attempt: blocked (street segment required).'
} as const;
const BUILD_LINE_FEEDBACK_MESSAGES = {
  instruction: 'Click existing stop markers in order to draft a schematic stop-order line (not street-routed yet).',
  minimumStopRequirement: `Minimum stops to complete: ${MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE}.`
} as const;
const LINE_OVERLAY_COPY = {
  completed: 'Completed lines: schematic stop-order connections (not street-routed yet).',
  draft: 'Draft line: schematic stop-order preview (not street-routed yet).'
} as const;
const INITIAL_DRAFT_LINE_STATE: DraftLineState = { stopIds: [], metadata: null };

const toStopSelectionState = (stop: Stop): StopSelectionState => ({ selectedStopId: stop.id });

const createPointerState = (screenX: number, screenY: number, lng?: number, lat?: number): MapSurfacePointerState => {
  const baseState: MapSurfacePointerState = { screenX, screenY };

  if (lng !== undefined && lat !== undefined) {
    return { ...baseState, lng, lat };
  }

  return baseState;
};

const includesHint = (value: string | undefined, hints: readonly string[]): boolean => {
  if (!value) {
    return false;
  }

  const lowered = value.toLowerCase();
  return hints.some((hint) => lowered.includes(hint));
};

const resolveStreetLayerIdsFromStyle = (map: MapLibreMap): readonly string[] => {
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
      .map((feature) =>
        toFeatureSourceKey(feature.source, feature.sourceLayer ?? feature['source-layer'])
      )
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

const isEligibleStopPlacementClickForLayers = (
  map: MapLibreMap,
  event: MapLibreInteractionEvent,
  streetLayerIds: readonly string[]
): boolean => {
  if (streetLayerIds.length === 0) {
    return false;
  }

  // Stop placement is valid only when a rendered street line exists exactly at the clicked screen point.
  const renderedFeatures = map.queryRenderedFeatures(event.point, { layers: streetLayerIds });
  if (renderedFeatures.some((feature) => isLineGeometry(feature.geometry))) {
    return true;
  }

  // Fallback: when rendered-layer hit granularity is insufficient, confirm street source presence
  // at the clicked point and require real line geometry from the matched street source-layer.
  return hasStreetLineGeometryInSourceFallback(map, event, streetLayerIds);
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

const resolvePreferredSnapCandidate = (
  currentBest: SnapCandidate | null,
  nextCandidate: SnapCandidate
): SnapCandidate => {
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
  ranking: SnapCandidateRankingMetadata
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
    const nextCandidate: SnapCandidate = { snappedPosition, pixelDistance: nearestOnSegment.distance, ranking };

    nearestCandidate = resolvePreferredSnapCandidate(nearestCandidate, nextCandidate);
  }

  return nearestCandidate;
};

const resolveBestSnapCandidateFromFeatures = (
  map: MapLibreMap,
  clickPoint: ScreenPoint,
  features: readonly {
    readonly geometry?: MapLibreFeatureGeometry;
    readonly layer?: { readonly id?: string };
    readonly source?: string;
    readonly sourceLayer?: string;
    readonly 'source-layer'?: string;
  }[],
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
    const lineCollections = toLineCoordinateCollections(feature.geometry);
    for (const lineCoordinates of lineCollections) {
      const candidate = resolveSnapCandidateForLineCoordinates(map, clickPoint, lineCoordinates, ranking);

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

const resolveSnappedStreetPosition = (
  map: MapLibreMap,
  event: MapLibreInteractionEvent,
  streetLayerIds: readonly string[]
): Readonly<{ lng: number; lat: number }> | null => {
  if (streetLayerIds.length === 0) {
    return null;
  }

  const directHitCandidate = resolveDirectHitSnapCandidate(map, event, streetLayerIds);
  if (directHitCandidate) {
    return directHitCandidate.snappedPosition;
  }

  const fallbackCandidate = resolveFallbackSnapCandidate(map, event, streetLayerIds);
  return fallbackCandidate?.snappedPosition ?? null;
};

const createNeutralMapTelemetryHandlers = ({ setInteractionState }: NeutralMapTelemetryContracts): NeutralMapTelemetryHandlers => ({
  onPointerMove: (event) => {
    setInteractionState({
      status: 'pointer-active',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });
  },
  onMapClick: (event) => {
    setInteractionState({
      status: 'idle',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });
  }
});

/**
 * Applies inspect-mode map click behavior: clicking non-stop map surface clears the current stop selection.
 */
const resolveInspectModeMapClickSelection = (): StopSelectionState | null => null;

const decodeStopIdFromFeatureProperties = (properties: Record<string, unknown> | undefined): StopId | null => {
  const stopIdValue = properties?.stopId;

  if (typeof stopIdValue !== 'string') {
    return null;
  }

  return createStopId(stopIdValue);
};

const decodeLineIdFromFeatureProperties = (properties: Record<string, unknown> | undefined): Line['id'] | null => {
  const lineIdValue = properties?.lineId;

  if (typeof lineIdValue !== 'string') {
    return null;
  }

  return createLineId(lineIdValue);
};

const hasInteractiveSelectionFeatureAtPoint = (map: MapLibreMap, event: MapLibreInteractionEvent): boolean => {
  const interactiveSelectionLayers: readonly string[] = [
    MAP_LAYER_ID_STOPS_CIRCLE,
    MAP_LAYER_ID_COMPLETED_LINES,
    MAP_LAYER_ID_COMPLETED_LINES_SELECTED
  ];
  const renderedFeatures = map.queryRenderedFeatures(event.point, { layers: interactiveSelectionLayers });

  return renderedFeatures.length > 0;
};

const handleStopPlacementClick = (
  { map, setInteractionState, setPlacementAttemptResult, onStopSelectionChange, onValidPlacement }: PlacementGameplayContracts,
  event: MapLibreInteractionEvent
): void => {
  const streetLayerIds = resolveStreetLayerIdsFromStyle(map);
  const snappedPosition = resolveSnappedStreetPosition(map, event, streetLayerIds);

  if (!event.lngLat || !isEligibleStopPlacementClickForLayers(map, event, streetLayerIds) || !snappedPosition) {
    setPlacementAttemptResult('invalid-target');
    setInteractionState({
      status: 'placement-rejected',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });
    onStopSelectionChange(null);

    return;
  }

  const placedStop = onValidPlacement(snappedPosition.lng, snappedPosition.lat);
  onStopSelectionChange(toStopSelectionState(placedStop));
  setPlacementAttemptResult('placed');
  setInteractionState({
    status: 'click-captured',
    pointer: createPointerState(event.point.x, event.point.y, snappedPosition.lng, snappedPosition.lat)
  });
};

const setupMapWorkspaceInteractions = ({
  map,
  activeToolMode,
  setInteractionState,
  setPlacementAttemptResult,
  onStopSelectionChange,
  onValidPlacement,
  buildLineContracts
}: MapWorkspaceSurfaceInteractionsContracts): { readonly dispose: () => void } => {
  const neutralTelemetryHandlers = createNeutralMapTelemetryHandlers({ setInteractionState });

  const onMapClick = (event: MapLibreInteractionEvent): void => {
    neutralTelemetryHandlers.onMapClick(event);

    if (activeToolMode === 'place-stop') {
      handleStopPlacementClick({ map, setInteractionState, setPlacementAttemptResult, onStopSelectionChange, onValidPlacement }, event);
      return;
    }

    setPlacementAttemptResult('none');

    if (activeToolMode === 'inspect' && !hasInteractiveSelectionFeatureAtPoint(map, event)) {
      buildLineContracts.onInspectModeNonFeatureMapClick();
    }
  };

  map.on('mousemove', neutralTelemetryHandlers.onPointerMove);
  map.on('click', onMapClick);

  return {
    dispose: () => {
      map.off('mousemove', neutralTelemetryHandlers.onPointerMove);
      map.off('click', onMapClick);
    }
  };
};

const setupMapResizeBinding = (containerElement: HTMLDivElement, mapRef: { readonly current: MapLibreMap | null }): MapWorkspaceResizeBinding => {
  const handleMapResize = (): void => {
    mapRef.current?.resize();
  };
  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          handleMapResize();
        })
      : null;

  if (resizeObserver) {
    resizeObserver.observe(containerElement);
  } else {
    window.addEventListener('resize', handleMapResize);
  }

  return {
    dispose: () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleMapResize);
      }
    }
  };
};

const createMapWorkspaceInstance = (containerElement: HTMLDivElement): MapLibreMap => {
  const mapInstance = new window.maplibregl.Map({
    container: containerElement,
    style: MAP_WORKSPACE_BOOTSTRAP_CONFIG.styleUrl,
    center: MAP_WORKSPACE_BOOTSTRAP_CONFIG.center,
    zoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.zoom,
    minZoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.minZoom,
    maxZoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.maxZoom,
    attributionControl: true
  });

  mapInstance.addControl(new window.maplibregl.NavigationControl({ visualizePitch: false }), 'top-left');
  return mapInstance;
};

const ensureLineRenderSourcesAndLayers = (map: MapLibreMap): void => {
  if (!map.getSource(MAP_SOURCE_ID_COMPLETED_LINES)) {
    map.addSource(MAP_SOURCE_ID_COMPLETED_LINES, {
      type: 'geojson',
      data: buildCompletedLineFeatureCollection({
        lines: [],
        stopsById: new Map(),
        selectedLineId: null
      })
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_DRAFT_LINE)) {
    map.addSource(MAP_SOURCE_ID_DRAFT_LINE, {
      type: 'geojson',
      data: buildDraftLineFeatureCollection({
        draftStopIds: [],
        stopsById: new Map()
      })
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_COMPLETED_LINES)) {
    map.addLayer({
      id: MAP_LAYER_ID_COMPLETED_LINES,
      type: 'line',
      source: MAP_SOURCE_ID_COMPLETED_LINES,
      filter: MAP_COMPLETED_LINE_LAYER_FILTER,
      paint: MAP_COMPLETED_LINE_LAYER_PAINT
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_COMPLETED_LINES_SELECTED)) {
    map.addLayer({
      id: MAP_LAYER_ID_COMPLETED_LINES_SELECTED,
      type: 'line',
      source: MAP_SOURCE_ID_COMPLETED_LINES,
      filter: MAP_COMPLETED_LINE_SELECTED_LAYER_FILTER,
      paint: MAP_COMPLETED_LINE_SELECTED_LAYER_PAINT
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_DRAFT_LINE)) {
    map.addLayer({
      id: MAP_LAYER_ID_DRAFT_LINE,
      type: 'line',
      source: MAP_SOURCE_ID_DRAFT_LINE,
      paint: MAP_DRAFT_LINE_LAYER_PAINT
    });
  }
};

const ensureStopRenderSourceAndLayers = (map: MapLibreMap): void => {
  if (!map.getSource(MAP_SOURCE_ID_STOPS)) {
    map.addSource(MAP_SOURCE_ID_STOPS, {
      type: 'geojson',
      data: buildStopFeatureCollection({
        stops: [],
        selectedStopId: null,
        draftStopIds: new Set(),
        buildLineInteractive: false
      })
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_STOPS_CIRCLE)) {
    map.addLayer({
      id: MAP_LAYER_ID_STOPS_CIRCLE,
      type: 'circle',
      source: MAP_SOURCE_ID_STOPS,
      paint: MAP_STOP_CIRCLE_LAYER_STYLE
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_STOPS_LABEL)) {
    map.addLayer({
      id: MAP_LAYER_ID_STOPS_LABEL,
      type: 'symbol',
      source: MAP_SOURCE_ID_STOPS,
      layout: MAP_STOP_LABEL_LAYER_LAYOUT,
      paint: MAP_STOP_LABEL_LAYER_PAINT
    });
  }
};

const ensureVehicleRenderSourceAndLayer = (map: MapLibreMap): void => {
  if (!map.getSource(MAP_SOURCE_ID_VEHICLES)) {
    map.addSource(MAP_SOURCE_ID_VEHICLES, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_VEHICLES)) {
    map.addLayer({
      id: MAP_LAYER_ID_VEHICLES,
      type: 'circle',
      source: MAP_SOURCE_ID_VEHICLES,
      paint: MAP_VEHICLE_CIRCLE_LAYER_PAINT
    });
  }
};

const runWhenMapStyleReady = (map: MapLibreMap, callback: () => void): (() => void) | void => {
  if (map.isStyleLoaded()) {
    callback();
    return;
  }

  const onStyleData = (): void => {
    if (!map.isStyleLoaded()) {
      return;
    }

    map.off('styledata', onStyleData);
    callback();
  };

  map.on('styledata', onStyleData);

  return () => {
    map.off('styledata', onStyleData);
  };
};

const syncStopSourceData = ({
  map,
  stops,
  selectedStopId,
  draftStopIds,
  isBuildLineModeActive
}: {
  readonly map: MapLibreMap;
  readonly stops: readonly Stop[];
  readonly selectedStopId: StopId | null;
  readonly draftStopIds: ReadonlySet<StopId>;
  readonly isBuildLineModeActive: boolean;
}): void => {
  const stopSource = map.getSource(MAP_SOURCE_ID_STOPS) as MapLibreGeoJsonSource | undefined;

  if (!stopSource) {
    return;
  }

  stopSource.setData(
    buildStopFeatureCollection({
      stops,
      selectedStopId,
      draftStopIds,
      buildLineInteractive: isBuildLineModeActive
    })
  );
};

const syncLineSourceData = ({
  map,
  sessionLines,
  selectedLineId,
  draftStopIds,
  stopsById
}: {
  readonly map: MapLibreMap;
  readonly sessionLines: readonly Line[];
  readonly selectedLineId: Line['id'] | null;
  readonly draftStopIds: readonly StopId[];
  readonly stopsById: ReadonlyMap<StopId, Stop>;
}): void => {
  const completedLineSource = map.getSource(MAP_SOURCE_ID_COMPLETED_LINES) as MapLibreGeoJsonSource | undefined;
  const draftLineSource = map.getSource(MAP_SOURCE_ID_DRAFT_LINE) as MapLibreGeoJsonSource | undefined;

  completedLineSource?.setData(
    buildCompletedLineFeatureCollection({
      lines: sessionLines,
      stopsById,
      selectedLineId
    })
  );

  draftLineSource?.setData(
    buildDraftLineFeatureCollection({
      draftStopIds,
      stopsById
    })
  );
};

const syncVehicleSourceData = ({
  map,
  vehicleNetworkProjection
}: {
  readonly map: MapLibreMap;
  readonly vehicleNetworkProjection: LineVehicleNetworkProjection;
}): void => {
  const vehicleSource = map.getSource(MAP_SOURCE_ID_VEHICLES) as MapLibreGeoJsonSource | undefined;

  vehicleSource?.setData(
    buildVehicleFeatureCollection({
      vehicleNetworkProjection
    })
  );
};

interface StopFeatureInteractionContext {
  readonly activeToolMode: WorkspaceToolMode;
  readonly sessionLineCount: number;
  readonly stopsById: ReadonlyMap<StopId, Stop>;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly clearSelectedCompletedLine: () => void;
  readonly appendStopToDraftLine: (stopId: StopId, sessionLineCount: number) => void;
}

const handleStopFeatureInteraction = (stopId: StopId, context: StopFeatureInteractionContext): void => {
  const stop = context.stopsById.get(stopId);

  if (!stop) {
    return;
  }

  if (context.activeToolMode === 'build-line') {
    context.appendStopToDraftLine(stop.id, context.sessionLineCount);
    return;
  }

  if (context.activeToolMode === 'inspect') {
    context.clearSelectedCompletedLine();
  }

  context.onStopSelectionChange(toStopSelectionState(stop));
};

const bindStopFeatureInteractions = (
  map: MapLibreMap,
  onStopFeatureClick: (event: MapLibreInteractionEvent) => void
): StopFeatureInteractionBinding => {
  map.on('click', MAP_LAYER_ID_STOPS_CIRCLE, onStopFeatureClick);

  return {
    dispose: () => {
      map.off('click', MAP_LAYER_ID_STOPS_CIRCLE, onStopFeatureClick);
    }
  };
};

const bindCompletedLineFeatureInteractions = (
  map: MapLibreMap,
  onCompletedLineClick: (event: MapLibreInteractionEvent) => void
): CompletedLineFeatureInteractionBinding => {
  map.on('click', MAP_LAYER_ID_COMPLETED_LINES, onCompletedLineClick);
  map.on('click', MAP_LAYER_ID_COMPLETED_LINES_SELECTED, onCompletedLineClick);

  return {
    dispose: () => {
      map.off('click', MAP_LAYER_ID_COMPLETED_LINES, onCompletedLineClick);
      map.off('click', MAP_LAYER_ID_COMPLETED_LINES_SELECTED, onCompletedLineClick);
    }
  };
};

const buildDeterministicStop = (nextOrdinal: number, lng: number, lat: number): Stop => ({
  id: createStopId(`stop-${nextOrdinal}`),
  position: { lng, lat },
  label: `${STOP_LABEL_PREFIX} ${nextOrdinal}`
});

interface PlacementUiFeedbackContract {
  readonly showPlacementModeIndicator: boolean;
  readonly modeInstruction: string | null;
  readonly showStreetRuleHint: boolean;
  readonly streetRuleHint: string | null;
  readonly lastAttemptMessage: string | null;
}

interface BuildLineUiFeedbackContract {
  readonly showBuildLineModeIndicator: boolean;
  readonly modeInstruction: string | null;
  readonly minimumStopRequirement: string | null;
  readonly draftStopCount: number;
  readonly canCompleteDraft: boolean;
}

const buildPlacementUiFeedback = (
  activeToolMode: WorkspaceToolMode,
  placementAttemptResult: PlacementAttemptResult
): PlacementUiFeedbackContract => {
  const isPlacementModeActive = activeToolMode === 'place-stop';

  if (!isPlacementModeActive) {
    return {
      showPlacementModeIndicator: false,
      modeInstruction: null,
      showStreetRuleHint: false,
      streetRuleHint: null,
      lastAttemptMessage: null
    };
  }

  const lastAttemptMessage =
    placementAttemptResult === 'placed'
      ? PLACEMENT_FEEDBACK_MESSAGES.attemptPlaced
      : placementAttemptResult === 'invalid-target'
        ? PLACEMENT_FEEDBACK_MESSAGES.attemptInvalidTarget
        : PLACEMENT_FEEDBACK_MESSAGES.attemptReady;

  return {
    showPlacementModeIndicator: true,
    modeInstruction: PLACEMENT_FEEDBACK_MESSAGES.modeInstruction,
    showStreetRuleHint: true,
    streetRuleHint: PLACEMENT_FEEDBACK_MESSAGES.streetRuleHint,
    lastAttemptMessage
  };
};

const buildLineModeUiFeedback = (activeToolMode: WorkspaceToolMode, draftStopIds: readonly StopId[]): BuildLineUiFeedbackContract => {
  if (activeToolMode !== 'build-line') {
    return {
      showBuildLineModeIndicator: false,
      modeInstruction: null,
      minimumStopRequirement: null,
      draftStopCount: 0,
      canCompleteDraft: false
    };
  }

  return {
    showBuildLineModeIndicator: true,
    modeInstruction: BUILD_LINE_FEEDBACK_MESSAGES.instruction,
    minimumStopRequirement: BUILD_LINE_FEEDBACK_MESSAGES.minimumStopRequirement,
    draftStopCount: draftStopIds.length,
    canCompleteDraft: draftStopIds.length >= MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE
  };
};

/**
 * Renders the CityOps workspace as a real MapLibre map surface with local click telemetry and minimal stop-placement validation.
 */
export function MapWorkspaceSurface({
  activeToolMode,
  selectedStopId,
  placedStops,
  sessionLines,
  selectedLineId,
  vehicleNetworkProjection,
  onPlacedStopsChange,
  onStopSelectionChange,
  onLineBuildSelectionChange,
  onSessionLinesChange,
  onSelectedLineIdChange
}: MapWorkspaceSurfaceProps): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [interactionState, setInteractionState] = useState<MapSurfaceInteractionState>({
    status: 'idle',
    pointer: null
  });
  const [placementAttemptResult, setPlacementAttemptResult] = useState<PlacementAttemptResult>('none');
  const [draftLineState, setDraftLineState] = useState<DraftLineState>(INITIAL_DRAFT_LINE_STATE);
  const activeToolModeRef = useRef<WorkspaceToolMode>(activeToolMode);
  const sessionLineCountRef = useRef(sessionLines.length);
  const onStopSelectionChangeRef = useRef(onStopSelectionChange);
  const selectedStopIdRef = useRef<StopId | null>(selectedStopId);
  const placedStopsRef = useRef<readonly Stop[]>(placedStops);
  const draftStopIdSet: ReadonlySet<StopId> = new Set(draftLineState.stopIds);
  const draftStopIdSetRef = useRef<ReadonlySet<StopId>>(draftStopIdSet);
  const stopsByIdRef = useRef<ReadonlyMap<StopId, Stop>>(new Map());

  const clearSelectedCompletedLine = (): void => {
    onSelectedLineIdChange(null);
  };

  useEffect(() => {
    activeToolModeRef.current = activeToolMode;
  }, [activeToolMode]);

  useEffect(() => {
    sessionLineCountRef.current = sessionLines.length;
  }, [sessionLines.length]);

  useEffect(() => {
    onStopSelectionChangeRef.current = onStopSelectionChange;
  }, [onStopSelectionChange]);

  useEffect(() => {
    selectedStopIdRef.current = selectedStopId;
  }, [selectedStopId]);

  useEffect(() => {
    placedStopsRef.current = placedStops;
    stopsByIdRef.current = new Map(placedStops.map((stop) => [stop.id, stop] as const));
  }, [placedStops]);

  useEffect(() => {
    draftStopIdSetRef.current = draftStopIdSet;
  }, [draftStopIdSet]);

  useEffect(() => {
    const containerElement = mapContainerRef.current;

    if (!containerElement || mapInstanceRef.current) {
      return;
    }

    const mapInstance = createMapWorkspaceInstance(containerElement);
    mapInstanceRef.current = mapInstance;
    const onMapLoad = (): void => {
      ensureLineRenderSourcesAndLayers(mapInstance);
      ensureStopRenderSourceAndLayers(mapInstance);
      ensureVehicleRenderSourceAndLayer(mapInstance);
      syncStopSourceData({
        map: mapInstance,
        stops: placedStopsRef.current,
        selectedStopId: selectedStopIdRef.current,
        draftStopIds: draftStopIdSetRef.current,
        isBuildLineModeActive: activeToolModeRef.current === 'build-line'
      });
      syncVehicleSourceData({
        map: mapInstance,
        vehicleNetworkProjection
      });
    };
    mapInstance.on('load', onMapLoad);
    const mapResizeBinding = setupMapResizeBinding(containerElement, mapInstanceRef);

    return () => {
      mapInstance.off('load', onMapLoad);
      mapResizeBinding.dispose();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    onLineBuildSelectionChange({ selectedStopIds: draftLineState.stopIds });
  }, [draftLineState.stopIds, onLineBuildSelectionChange]);

  useEffect(() => {
    if (activeToolMode === 'build-line') {
      return;
    }

    setDraftLineState(INITIAL_DRAFT_LINE_STATE);
  }, [activeToolMode]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const interactions = setupMapWorkspaceInteractions({
      map: mapInstance,
      activeToolMode,
      setInteractionState,
      setPlacementAttemptResult,
      onStopSelectionChange,
      buildLineContracts: {
        onInspectModeNonFeatureMapClick: () => {
          onStopSelectionChange(resolveInspectModeMapClickSelection());
          clearSelectedCompletedLine();
        }
      },
      onValidPlacement: (lng, lat) => {
        let createdStop!: Stop;
        onPlacedStopsChange((currentStops) => {
          const nextOrdinal = currentStops.length + 1;
          const nextStop = buildDeterministicStop(nextOrdinal, lng, lat);
          createdStop = nextStop;
          return [...currentStops, nextStop];
        });

        return createdStop;
      }
    });

    return () => {
      interactions.dispose();
    };
  }, [activeToolMode, onPlacedStopsChange, onStopSelectionChange]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      ensureStopRenderSourceAndLayers(mapInstance);
      syncStopSourceData({
        map: mapInstance,
        stops: placedStops,
        selectedStopId,
        draftStopIds: draftStopIdSet,
        isBuildLineModeActive: activeToolMode === 'build-line'
      });
    });
  }, [activeToolMode, draftStopIdSet, placedStops, selectedStopId]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      ensureLineRenderSourcesAndLayers(mapInstance);
      syncLineSourceData({
        map: mapInstance,
        sessionLines,
        selectedLineId,
        draftStopIds: draftLineState.stopIds,
        stopsById: new Map(placedStops.map((stop) => [stop.id, stop] as const))
      });
    });
  }, [draftLineState.stopIds, placedStops, selectedLineId, sessionLines]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      ensureVehicleRenderSourceAndLayer(mapInstance);
      syncVehicleSourceData({
        map: mapInstance,
        vehicleNetworkProjection
      });
    });
  }, [vehicleNetworkProjection]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const stopInteractionBinding = bindStopFeatureInteractions(mapInstance, (event) => {
      const clickedFeature = event.features?.[0];
      const stopId = decodeStopIdFromFeatureProperties(clickedFeature?.properties);

      if (!stopId) {
        return;
      }

      handleStopFeatureInteraction(stopId, {
        activeToolMode: activeToolModeRef.current,
        sessionLineCount: sessionLineCountRef.current,
        stopsById: stopsByIdRef.current,
        onStopSelectionChange: onStopSelectionChangeRef.current,
        clearSelectedCompletedLine,
        appendStopToDraftLine: (nextStopId, sessionLineCount) => {
          setDraftLineState((currentDraft) => {
            const nextMetadata =
              currentDraft.metadata ??
              ({
                draftOrdinal: sessionLineCount + 1,
                startedAtIsoUtc: new Date().toISOString()
              } as const);

            return {
              stopIds: [...currentDraft.stopIds, nextStopId],
              metadata: nextMetadata
            };
          });
        }
      });
    });

    return () => {
      stopInteractionBinding.dispose();
    };
  }, []);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const completedLineInteractionBinding = bindCompletedLineFeatureInteractions(mapInstance, (event) => {
      if (activeToolModeRef.current === 'build-line') {
        return;
      }

      const clickedFeature = event.features?.[0];
      const clickedLineId = decodeLineIdFromFeatureProperties(clickedFeature?.properties);

      if (!clickedLineId) {
        return;
      }

      onStopSelectionChangeRef.current(null);
      onSelectedLineIdChange(clickedLineId);
    });

    return () => {
      completedLineInteractionBinding.dispose();
    };
  }, [onSelectedLineIdChange]);

  const pointerSummary = interactionState.pointer
    ? `x:${interactionState.pointer.screenX.toFixed(1)} y:${interactionState.pointer.screenY.toFixed(1)}`
    : 'none';
  const geographicSummary =
    interactionState.pointer?.lng !== undefined && interactionState.pointer.lat !== undefined
      ? `lng:${interactionState.pointer.lng.toFixed(5)} lat:${interactionState.pointer.lat.toFixed(5)}`
      : 'lng/lat unavailable';
  const stopSelectionSummary = selectedStopId ? `Selected stop: ${selectedStopId}` : 'Selected stop: none';
  const vehicleFeatureCount = buildVehicleFeatureCollection({ vehicleNetworkProjection }).features.length;
  const placementUiFeedback = buildPlacementUiFeedback(activeToolMode, placementAttemptResult);
  const buildLineUiFeedback = buildLineModeUiFeedback(activeToolMode, draftLineState.stopIds);
  const draftMetadataSummary = draftLineState.metadata
    ? `Draft #${draftLineState.metadata.draftOrdinal} @ ${draftLineState.metadata.startedAtIsoUtc}`
    : 'Draft inactive';

  const handleDraftCancel = (): void => {
    setDraftLineState(INITIAL_DRAFT_LINE_STATE);
  };

  const handleDraftComplete = (): void => {
    const draftStopIds = draftLineState.stopIds;

    if (draftStopIds.length < MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE) {
      return;
    }

    let createdLineId: Line['id'] | null = null;
    const nextLine: Line = {
      id: createLineId(`line-${sessionLines.length + 1}`),
      label: `${LINE_BUILD_PLACEHOLDER_LABEL_PREFIX} ${sessionLines.length + 1}`,
      stopIds: draftStopIds,
      routeSegments: [],
      frequencyByTimeBand: createUnsetLineFrequencyByTimeBand()
    };

    onSessionLinesChange((currentLines) => {
      const createdLineOrdinal = currentLines.length + 1;
      const nextCreatedLineId = createLineId(`line-${createdLineOrdinal}`);
      const createdLine: Line = {
        ...nextLine,
        id: nextCreatedLineId,
        label: `${LINE_BUILD_PLACEHOLDER_LABEL_PREFIX} ${createdLineOrdinal}`,
        routeSegments: buildFallbackLineRouteSegments({
          lineId: nextCreatedLineId,
          orderedStopIds: draftStopIds,
          placedStops
        })
      };
      createdLineId = createdLine.id;
      return [...currentLines, createdLine];
    });

    if (createdLineId !== null) {
      onSelectedLineIdChange(createdLineId);
    }

    setDraftLineState(INITIAL_DRAFT_LINE_STATE);
  };

  return (
    <section className="map-workspace" aria-label="Map workspace surface">
      <div ref={mapContainerRef} className="map-workspace__map" aria-label="CityOps baseline map" />

      <div className="map-workspace__overlay map-workspace__overlay--hud" aria-label="Map workspace status">
        Mode: {activeToolMode} | Interaction status: {interactionState.status} | Pointer: {pointerSummary} | Geo: {geographicSummary}
        {` | Placed stops: ${placedStops.length} | Vehicle features: ${vehicleFeatureCount} | ${stopSelectionSummary} | Line draft stops: ${draftLineState.stopIds.length} | Session lines: ${sessionLines.length} | ${draftMetadataSummary}`}
      </div>

      {placementUiFeedback.showPlacementModeIndicator ? (
        <div className="map-workspace__overlay map-workspace__overlay--mode" aria-live="polite" aria-label="Placement mode status">
          <strong>{PLACEMENT_MODE_INDICATOR_LABEL}</strong>
          <span> · {placementUiFeedback.modeInstruction}</span>
          {placementUiFeedback.showStreetRuleHint ? <span> · {placementUiFeedback.streetRuleHint}</span> : null}
          <span> · {placementUiFeedback.lastAttemptMessage}</span>
        </div>
      ) : null}

      {buildLineUiFeedback.showBuildLineModeIndicator ? (
        <div
          className="map-workspace__overlay map-workspace__overlay--mode map-workspace__overlay--interactive-controls"
          aria-live="polite"
          aria-label="Build line mode status"
        >
          <strong>{BUILD_LINE_MODE_INDICATOR_LABEL}</strong>
          <span> · {buildLineUiFeedback.modeInstruction}</span>
          <span> · {buildLineUiFeedback.minimumStopRequirement}</span>
          <span> · {LINE_OVERLAY_COPY.draft}</span>
          <span>{` · Draft stops: ${buildLineUiFeedback.draftStopCount}`}</span>
          <div className="map-workspace__overlay-button-row">
            <button type="button" onClick={handleDraftCancel}>
              Cancel draft
            </button>
            <button type="button" onClick={handleDraftComplete} disabled={!buildLineUiFeedback.canCompleteDraft}>
              Complete line
            </button>
          </div>
        </div>
      ) : null}

      {sessionLines.length > 0 ? (
        <div className="map-workspace__overlay map-workspace__overlay--line-note" aria-label="Line overlay interpretation">
          <strong>Line overlay note</strong>
          <span> · {LINE_OVERLAY_COPY.completed}</span>
        </div>
      ) : null}
    </section>
  );
}
