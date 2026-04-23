import { useEffect, useRef, useState, type ReactElement } from 'react';

import {
  LINE_BUILD_PLACEHOLDER_LABEL_PREFIX,
  MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE
} from '../domain/constants/lineBuilding';
import type { Line } from '../domain/types/line';
import { createLineId, createUnsetLineFrequencyByTimeBand } from '../domain/types/line';
import type { Stop, StopId } from '../domain/types/stop';
import { createStopId } from '../domain/types/stop';
import type { LineBuildSelectionState, WorkspaceToolMode } from '../App';
import { MAP_WORKSPACE_BOOTSTRAP_CONFIG } from './mapBootstrapConfig';
import {
  getSourceRefsForLayerIds,
  type MapLibreFeatureGeometry,
  type MapLibreInteractionEvent,
  type MapLibreMap,
  type MapLibreMarker
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
  readonly onInspectModeMapClick: () => void;
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

interface MapWorkspaceSurfaceProps {
  readonly activeToolMode: WorkspaceToolMode;
  readonly selectedStopId: StopId | null;
  readonly lineBuildSelection: LineBuildSelectionState;
  readonly sessionLines: readonly Line[];
  readonly selectedLineId: Line['id'] | null;
  readonly onPlacedStopCountChange: (nextCount: number) => void;
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

interface ProjectedLineSegment {
  readonly key: string;
  readonly points: string;
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
  instruction: 'Click existing stop markers in order to draft a line.',
  minimumStopRequirement: `Minimum stops to complete: ${MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE}.`
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

const isEligibleStopPlacementClick = (map: MapLibreMap, event: MapLibreInteractionEvent): boolean => {
  const streetLayerIds = resolveStreetLayerIdsFromStyle(map);

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

const handleStopPlacementClick = (
  { map, setInteractionState, setPlacementAttemptResult, onStopSelectionChange, onValidPlacement }: PlacementGameplayContracts,
  event: MapLibreInteractionEvent
): void => {
  if (!event.lngLat || !isEligibleStopPlacementClick(map, event)) {
    setPlacementAttemptResult('invalid-target');
    setInteractionState({
      status: 'placement-rejected',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });
    onStopSelectionChange(null);

    return;
  }

  const placedStop = onValidPlacement(event.lngLat.lng, event.lngLat.lat);
  onStopSelectionChange(toStopSelectionState(placedStop));
  setPlacementAttemptResult('placed');
  setInteractionState({
    status: 'click-captured',
    pointer: createPointerState(event.point.x, event.point.y, event.lngLat.lng, event.lngLat.lat)
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

    if (activeToolMode === 'inspect') {
      buildLineContracts.onInspectModeMapClick();
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

const createStopMarker = (
  stop: Stop,
  onMarkerClick: (stop: Stop) => void
): MapLibreMarker => {
  const markerElement = document.createElement('div');
  markerElement.className = 'map-workspace__stop-marker';
  markerElement.title = stop.label ?? stop.id;
  markerElement.addEventListener('click', (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onMarkerClick(stop);
  });

  return new window.maplibregl.Marker({ element: markerElement }).setLngLat([stop.position.lng, stop.position.lat]);
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

const toProjectedLineSegments = ({
  lines,
  stopsById,
  map
}: {
  readonly lines: readonly { readonly id: string; readonly stopIds: readonly StopId[] }[];
  readonly stopsById: ReadonlyMap<StopId, Stop>;
  readonly map: MapLibreMap;
}): readonly ProjectedLineSegment[] =>
  lines
    .map((line) => {
      const coordinatePairs = line.stopIds
        .map((stopId) => stopsById.get(stopId))
        .filter((stop): stop is Stop => stop !== undefined)
        .map((stop) => map.project([stop.position.lng, stop.position.lat]))
        .map((projectedPoint) => `${projectedPoint.x},${projectedPoint.y}`);

      if (coordinatePairs.length < 2) {
        return null;
      }

      return {
        key: line.id,
        points: coordinatePairs.join(' ')
      };
    })
    .filter((segment): segment is ProjectedLineSegment => segment !== null);

const syncStopMarkers = ({
  map,
  stops,
  markerByStopId,
  onStopMarkerClick,
  selectedStopId
}: {
  readonly map: MapLibreMap;
  readonly stops: readonly Stop[];
  readonly markerByStopId: Map<Stop['id'], MapLibreMarker>;
  readonly onStopMarkerClick: (stop: Stop) => void;
  readonly selectedStopId: StopId | null;
}): void => {
  const activeStopIds = new Set(stops.map((stop) => stop.id));

  stops.forEach((stop) => {
    if (markerByStopId.has(stop.id)) {
      return;
    }

    const marker = createStopMarker(stop, onStopMarkerClick).addTo(map);
    markerByStopId.set(stop.id, marker);
  });

  markerByStopId.forEach((marker, stopId) => {
    if (activeStopIds.has(stopId)) {
      return;
    }

    marker.remove();
    markerByStopId.delete(stopId);
  });

  markerByStopId.forEach((marker, stopId) => {
    const markerElement = marker.getElement();
    const isSelected = selectedStopId === stopId;
    markerElement.classList.toggle('map-workspace__stop-marker--selected', isSelected);
  });
};

/**
 * Renders the CityOps workspace as a real MapLibre map surface with local click telemetry and minimal stop-placement validation.
 */
export function MapWorkspaceSurface({
  activeToolMode,
  selectedStopId,
  sessionLines,
  selectedLineId,
  onPlacedStopCountChange,
  onStopSelectionChange,
  onLineBuildSelectionChange,
  onSessionLinesChange,
  onSelectedLineIdChange
}: MapWorkspaceSurfaceProps): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const stopMarkerRef = useRef<Map<Stop['id'], MapLibreMarker>>(new Map());
  const [interactionState, setInteractionState] = useState<MapSurfaceInteractionState>({
    status: 'idle',
    pointer: null
  });
  const [placementAttemptResult, setPlacementAttemptResult] = useState<PlacementAttemptResult>('none');
  const [placedStops, setPlacedStops] = useState<readonly Stop[]>([]);
  const [draftLineState, setDraftLineState] = useState<DraftLineState>(INITIAL_DRAFT_LINE_STATE);
  const [projectionRefreshTick, setProjectionRefreshTick] = useState(0);

  const clearSelectedCompletedLine = (): void => {
    onSelectedLineIdChange(null);
  };

  useEffect(() => {
    const containerElement = mapContainerRef.current;

    if (!containerElement || mapInstanceRef.current) {
      return;
    }

    const mapInstance = createMapWorkspaceInstance(containerElement);
    mapInstanceRef.current = mapInstance;
    const mapResizeBinding = setupMapResizeBinding(containerElement, mapInstanceRef);

    return () => {
      mapResizeBinding.dispose();
      stopMarkerRef.current.forEach((marker) => marker.remove());
      stopMarkerRef.current.clear();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    onLineBuildSelectionChange({ selectedStopIds: draftLineState.stopIds });
  }, [draftLineState.stopIds, onLineBuildSelectionChange]);

  useEffect(() => {
    onPlacedStopCountChange(placedStops.length);
  }, [onPlacedStopCountChange, placedStops.length]);

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
        onInspectModeMapClick: () => {
          onStopSelectionChange(resolveInspectModeMapClickSelection());
          clearSelectedCompletedLine();
        }
      },
      onValidPlacement: (lng, lat) => {
        let createdStop!: Stop;
        setPlacedStops((currentStops) => {
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
  }, [activeToolMode, onStopSelectionChange]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const onMapMove = (): void => {
      setProjectionRefreshTick((currentTick) => currentTick + 1);
    };

    mapInstance.on('move', onMapMove);

    return () => {
      mapInstance.off('move', onMapMove);
    };
  }, []);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    syncStopMarkers({
      map: mapInstance,
      stops: placedStops,
      markerByStopId: stopMarkerRef.current,
      selectedStopId,
      onStopMarkerClick: (stop) => {
        if (activeToolMode === 'build-line') {
          setDraftLineState((currentDraft) => {
            const nextMetadata =
              currentDraft.metadata ??
              ({
                draftOrdinal: sessionLines.length + 1,
                startedAtIsoUtc: new Date().toISOString()
              } as const);

            return {
              stopIds: [...currentDraft.stopIds, stop.id],
              metadata: nextMetadata
            };
          });
          return;
        }

        if (activeToolMode === 'inspect') {
          clearSelectedCompletedLine();
        }

        onStopSelectionChange(toStopSelectionState(stop));
      }
    });
  }, [activeToolMode, onStopSelectionChange, placedStops, selectedStopId, sessionLines.length]);

  const pointerSummary = interactionState.pointer
    ? `x:${interactionState.pointer.screenX.toFixed(1)} y:${interactionState.pointer.screenY.toFixed(1)}`
    : 'none';
  const geographicSummary =
    interactionState.pointer?.lng !== undefined && interactionState.pointer.lat !== undefined
      ? `lng:${interactionState.pointer.lng.toFixed(5)} lat:${interactionState.pointer.lat.toFixed(5)}`
      : 'lng/lat unavailable';
  const stopSelectionSummary = selectedStopId ? `Selected stop: ${selectedStopId}` : 'Selected stop: none';
  const placementUiFeedback = buildPlacementUiFeedback(activeToolMode, placementAttemptResult);
  const buildLineUiFeedback = buildLineModeUiFeedback(activeToolMode, draftLineState.stopIds);
  const draftMetadataSummary = draftLineState.metadata
    ? `Draft #${draftLineState.metadata.draftOrdinal} @ ${draftLineState.metadata.startedAtIsoUtc}`
    : 'Draft inactive';

  const handleDraftCancel = (): void => {
    setDraftLineState(INITIAL_DRAFT_LINE_STATE);
  };

  const handleDraftComplete = (): void => {
    if (draftLineState.stopIds.length < MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE) {
      return;
    }

    const nextLineOrdinal = sessionLines.length + 1;
    const nextLine: Line = {
      id: createLineId(`line-${nextLineOrdinal}`),
      label: `${LINE_BUILD_PLACEHOLDER_LABEL_PREFIX} ${nextLineOrdinal}`,
      stopIds: draftLineState.stopIds,
      frequencyByTimeBand: createUnsetLineFrequencyByTimeBand()
    };
    onSessionLinesChange((currentLines) => [...currentLines, nextLine]);
    onSelectedLineIdChange(nextLine.id);
    setDraftLineState(INITIAL_DRAFT_LINE_STATE);
  };

  const stopsById = new Map(placedStops.map((stop) => [stop.id, stop] as const));
  const projectedCompletedSegments =
    mapInstanceRef.current === null
      ? []
      : toProjectedLineSegments({
          lines: sessionLines,
          stopsById,
          map: mapInstanceRef.current
        });
  const projectedDraftSegments =
    mapInstanceRef.current === null
      ? []
      : toProjectedLineSegments({
          lines: [{ id: 'draft-line', stopIds: draftLineState.stopIds }],
          stopsById,
          map: mapInstanceRef.current
        });

  return (
    <section className="map-workspace" aria-label="Map workspace surface">
      <div ref={mapContainerRef} className="map-workspace__map" aria-label="CityOps baseline map" />
      <svg className="map-workspace__line-overlay" aria-hidden="true" key={projectionRefreshTick}>
        {projectedCompletedSegments.map((segment) => (
          <polyline
            key={segment.key}
            className={[
              'map-workspace__line-segment',
              'map-workspace__line-segment--completed',
              segment.key === selectedLineId ? 'map-workspace__line-segment--selected' : ''
            ]
              .filter((className) => className.length > 0)
              .join(' ')}
            points={segment.points}
            onClick={() => {
              if (activeToolMode === 'build-line') {
                return;
              }

              onStopSelectionChange(null);
              onSelectedLineIdChange(createLineId(segment.key));
            }}
          />
        ))}
        {projectedDraftSegments.map((segment) => (
          <polyline key={segment.key} className="map-workspace__line-segment map-workspace__line-segment--draft" points={segment.points} />
        ))}
      </svg>

      <div className="map-workspace__overlay map-workspace__overlay--hud" aria-label="Map workspace status">
        Mode: {activeToolMode} | Interaction status: {interactionState.status} | Pointer: {pointerSummary} | Geo: {geographicSummary}
        {` | Placed stops: ${placedStops.length} | ${stopSelectionSummary} | Line draft stops: ${draftLineState.stopIds.length} | Session lines: ${sessionLines.length} | ${draftMetadataSummary}`}
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
    </section>
  );
}
