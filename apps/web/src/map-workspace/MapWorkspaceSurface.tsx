import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import {
  LINE_BUILD_PLACEHOLDER_LABEL_PREFIX,
  MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE
} from '../domain/constants/lineBuilding';
import {
  MAP_FOCUS_PADDING,
  MAP_FOCUS_ZOOM_STOP
} from './mapBootstrapConfig';
import { completeLineRouting } from '../domain/routing/completeLineRouting';
import { getDefaultRoutingAdapter } from '../domain/routing/defaultRoutingAdapter';
import type { Line } from '../domain/types/line';
import { createLineId, createNoServiceLineServiceByTimeBand, type LineTopology, type LineServicePattern } from '../domain/types/line';
import type { LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import type { Stop, StopId } from '../domain/types/stop';
import { createStopId } from '../domain/types/stop';
import { loadOsmStopCandidates } from '../domain/osm/osmStopCandidateSource';
import { consolidateOsmStopCandidates } from '../domain/osm/osmStopCandidateConsolidation';
import type { OsmStopCandidate, OsmStopCandidateGroup, OsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import { createUniqueStopLabel } from '../domain/stop/stopLabeling';
import { generateLineLabel, generateUniqueLineLabel } from '../domain/line/lineLabeling';
import type { LineBuildSelectionState, MapFocusIntent, WorkspaceToolMode } from '../session/sessionTypes';
import type { ActiveDataOperation } from '../ui/data-operation/types';
import {
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_DRAFT_LINE,
  MAP_LAYER_ID_VEHICLES
} from './mapRenderConstants';
import {
  bindCompletedLineFeatureInteractions,
  bindStopFeatureInteractions,
  bindOsmCandidateFeatureInteractions,
  decodeLineIdFromFeatureProperties,
  decodeStopIdFromFeatureProperties,
  decodeOsmCandidateGroupIdFromFeatureProperties,
  handleStopFeatureInteraction,
  resolveInspectModeMapClickSelection,
  setupMapWorkspaceInteractions,
  type MapSurfaceInteractionState,
  type PlacementAttemptResult,
  type StopSelectionState
} from './mapWorkspaceInteractions';
import { resolveStreetLayerIdsFromStyle } from './mapWorkspaceStreetSnap';
import { StopHoverTooltip } from './StopHoverTooltip';
import { OsmStopCandidateHoverTooltip } from './OsmStopCandidateHoverTooltip';
import { LineCompletionDialog } from './LineCompletionDialog';
import {
  buildLineModeUiFeedback,
  buildPlacementUiFeedback,
  BUILD_LINE_MODE_INDICATOR_LABEL,
  LINE_OVERLAY_COPY,
  PLACEMENT_MODE_INDICATOR_LABEL
} from './mapWorkspaceUiFeedback';
import { syncAllMapWorkspaceSources, syncExistingMapWorkspaceSourceData } from './mapWorkspaceSourceSync';
import {
  countRenderedFeaturesForLayers,
  createMapWorkspaceInstance,
  runWhenMapStyleReady,
  setupMapResizeBinding
} from './mapWorkspaceLifecycle';
import { applyBasemapSemanticReadabilityOverrides } from './mapBaseStyleOverrides';
import type { MapLibreMap } from './maplibreGlobal';
import { resolveOsmStopCandidateGroupStreetAnchor } from './osmStopCandidateStreetAnchorResolution';

/** Canonical single-stop selection contract shared by marker highlighting and shell inspector state. */
export type { StopSelectionState } from './mapWorkspaceInteractions';

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
  readonly onSelectedLineDialogOpenIntentChange: (intent: import('../session/sessionTypes').SelectedLineDialogOpenIntent | null) => void;
  readonly mapFocusIntent: MapFocusIntent | null;
  readonly onMapFocusIntentConsumed: (intent: MapFocusIntent | null) => void;
  readonly onDebugSnapshotChange: (nextSnapshot: MapWorkspaceDebugSnapshot) => void;
  readonly onOsmCandidateHoverChange?: (
    nextHover: {
      candidateGroupId: string;
      label: string;
      memberCount: number;
      memberKinds: string;
      berthCountHint: number;
      x: number;
      y: number;
      anchorResolution?: import('../domain/osm/osmStopCandidateAnchorTypes').OsmStopCandidateStreetAnchorResolution | undefined;
    } | null
  ) => void;
  readonly onActiveDataOperationChange: (operation: ActiveDataOperation | null) => void;
  readonly selectedOsmCandidateGroupId: OsmStopCandidateGroupId | null;
  readonly adoptedOsmCandidateGroupIds: ReadonlySet<OsmStopCandidateGroupId>;
  readonly onOsmCandidateSelectionChange: (nextSelectionId: OsmStopCandidateGroupId | null) => void;
  readonly osmStopCandidates: readonly OsmStopCandidate[];
  readonly onOsmCandidateAnchorResolved: (resolution: import('../domain/osm/osmStopCandidateAnchorTypes').OsmStopCandidateStreetAnchorResolution | null) => void;
}

/** Canonical map diagnostics payload surfaced to shell-owned debug modal state. */
export interface MapWorkspaceDebugSnapshot {
  readonly interactionStatus: MapSurfaceInteractionState['status'];
  readonly pointerSummary: string;
  readonly geographicSummary: string;
  readonly lineDiagnosticsSummary: string;
  readonly vehicleDiagnosticsSummary: string;
  readonly stopSelectionSummary: string;
  readonly placementInstruction: string;
  readonly placementStreetRuleHint: string;
  readonly buildLineInstruction: string;
  readonly buildLineMinimumRequirement: string;
  readonly completedOverlayNote: string;
  readonly draftOverlayNote: string;
  readonly draftMetadataSummary: string;
  readonly lastPlacedStopLabel: string | null;
  readonly osmStopCandidateRawCount?: number | undefined;
  readonly osmStopCandidateGroupCount?: number | undefined;
  readonly osmStopCandidateAnchorLastStatus?: string | undefined;
  readonly osmStopCandidateAnchorLastDistanceMeters?: number | undefined;
  readonly osmStopCandidateStreetLayerCount?: number | undefined;
}

interface DraftLineMetadata {
  readonly draftOrdinal: number;
  readonly startedAtIsoUtc: string;
}

interface DraftLineState {
  readonly stopIds: readonly StopId[];
  readonly metadata: DraftLineMetadata | null;
}

interface LayerFeatureDiagnostics {
  readonly builderFeatureCount: number;
  readonly sourceFeatureCount: number;
  readonly renderedFeatureCount: number;
}

interface MapWorkspaceFeatureDiagnostics {
  readonly lines: LayerFeatureDiagnostics;
  readonly vehicles: LayerFeatureDiagnostics;
}

const STOP_LABEL_PREFIX = 'Stop';
const INITIAL_DRAFT_LINE_STATE: DraftLineState = { stopIds: [], metadata: null };
const INITIAL_LAYER_FEATURE_DIAGNOSTICS: LayerFeatureDiagnostics = {
  builderFeatureCount: 0,
  sourceFeatureCount: 0,
  renderedFeatureCount: 0
};
const INITIAL_MAP_WORKSPACE_FEATURE_DIAGNOSTICS: MapWorkspaceFeatureDiagnostics = {
  lines: INITIAL_LAYER_FEATURE_DIAGNOSTICS,
  vehicles: INITIAL_LAYER_FEATURE_DIAGNOSTICS
};

const buildDeterministicStop = (
  nextOrdinal: number,
  lng: number,
  lat: number,
  labelCandidate: string | null,
  existingStops: readonly Stop[]
): Stop => ({
  id: createStopId(`stop-${nextOrdinal}`),
  position: { lng, lat },
  label: createUniqueStopLabel({
    baseLabel: labelCandidate,
    fallbackOrdinal: nextOrdinal,
    existingStops
  })
});

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
  onSelectedLineIdChange,
  onSelectedLineDialogOpenIntentChange,
  mapFocusIntent,
  onMapFocusIntentConsumed,
  onDebugSnapshotChange,
  onActiveDataOperationChange,
  selectedOsmCandidateGroupId,
  adoptedOsmCandidateGroupIds,
  onOsmCandidateSelectionChange,
  osmStopCandidates,
  onOsmCandidateAnchorResolved
}: MapWorkspaceSurfaceProps): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [interactionState, setInteractionState] = useState<MapSurfaceInteractionState>({
    status: 'idle',
    pointer: null
  });
  const [placementAttemptResult, setPlacementAttemptResult] = useState<PlacementAttemptResult>('none');
  const [hoveredStop, setHoveredStop] = useState<{ stopId: StopId; x: number; y: number } | null>(null);
  const [hoveredOsmCandidate, setHoveredOsmCandidate] = useState<{
    candidateGroupId: string;
    label: string;
    memberCount: number;
    memberKinds: string;
    berthCountHint: number;
    x: number;
    y: number;
    anchorResolution?: import('../domain/osm/osmStopCandidateAnchorTypes').OsmStopCandidateStreetAnchorResolution | undefined;
  } | null>(null);
  const [draftLineState, setDraftLineState] = useState<DraftLineState>(INITIAL_DRAFT_LINE_STATE);
  const [featureDiagnostics, setFeatureDiagnostics] = useState<MapWorkspaceFeatureDiagnostics>(
    INITIAL_MAP_WORKSPACE_FEATURE_DIAGNOSTICS
  );
  const [lastPlacedStopLabel, setLastPlacedStopLabel] = useState<string | null>(null);
  const [isCompletingLine, setIsCompletingLine] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const activeToolModeRef = useRef<WorkspaceToolMode>(activeToolMode);
  const sessionLineCountRef = useRef(sessionLines.length);
  const onStopSelectionChangeRef = useRef(onStopSelectionChange);
  const selectedStopIdRef = useRef<StopId | null>(selectedStopId);
  const placedStopsRef = useRef<readonly Stop[]>(placedStops);
  const sessionLinesRef = useRef<readonly Line[]>(sessionLines);
  const selectedLineIdRef = useRef<Line['id'] | null>(selectedLineId);
  const vehicleNetworkProjectionRef = useRef<LineVehicleNetworkProjection>(vehicleNetworkProjection);
  const draftStopIdSet: ReadonlySet<StopId> = new Set(draftLineState.stopIds);
  const draftStopIdsRef = useRef<readonly StopId[]>(draftLineState.stopIds);
  const draftStopIdSetRef = useRef<ReadonlySet<StopId>>(draftStopIdSet);
  const stopsByIdRef = useRef<ReadonlyMap<StopId, Stop>>(new Map());

  const osmStopCandidateGroups = useMemo(
    () => consolidateOsmStopCandidates(osmStopCandidates).filter(g => !adoptedOsmCandidateGroupIds.has(g.id)),
    [osmStopCandidates, adoptedOsmCandidateGroupIds]
  );

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
    sessionLinesRef.current = sessionLines;
  }, [sessionLines]);

  useEffect(() => {
    selectedLineIdRef.current = selectedLineId;
  }, [selectedLineId]);

  useEffect(() => {
    vehicleNetworkProjectionRef.current = vehicleNetworkProjection;
  }, [vehicleNetworkProjection]);

  useEffect(() => {
    draftStopIdsRef.current = draftLineState.stopIds;
  }, [draftLineState.stopIds]);

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
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      const sourceSyncDiagnostics = syncAllMapWorkspaceSources({
        map: mapInstance,
        stopSync: {
          stops: placedStopsRef.current,
          selectedStopId: selectedStopIdRef.current,
          draftStopIds: draftStopIdSetRef.current,
          isBuildLineModeActive: activeToolModeRef.current === 'build-line',
          selectedLine: sessionLinesRef.current.find(l => l.id === selectedLineIdRef.current) ?? null
        },
        lineSync: {
          sessionLines: sessionLinesRef.current,
          selectedLineId: selectedLineIdRef.current,
          draftStopIds: draftStopIdsRef.current,
          stopsById: stopsByIdRef.current
        },
        vehicleSync: {
          vehicleNetworkProjection: vehicleNetworkProjectionRef.current
        },
        osmStopCandidateSync: osmStopCandidateGroups
      });

      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        lines: {
          ...currentDiagnostics.lines,
          builderFeatureCount: sourceSyncDiagnostics.lineBuilderFeatureCount ?? currentDiagnostics.lines.builderFeatureCount,
          sourceFeatureCount: sourceSyncDiagnostics.lineSourceFeatureCount
        },
        vehicles: {
          ...currentDiagnostics.vehicles,
          builderFeatureCount:
            sourceSyncDiagnostics.vehicleBuilderFeatureCount ?? currentDiagnostics.vehicles.builderFeatureCount,
          sourceFeatureCount: sourceSyncDiagnostics.vehicleSourceFeatureCount
        }
      }));
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
      onStopHoverChange: setHoveredStop,
      buildLineContracts: {
        onInspectModeNonFeatureMapClick: () => {
          onStopSelectionChange(resolveInspectModeMapClickSelection());
          clearSelectedCompletedLine();
        }
      },
      onOsmCandidateHoverChange: (nextHover) => {
        if (!nextHover) {
          setHoveredOsmCandidate(null);
          return;
        }

        const group = osmStopCandidateGroups.find((g) => g.id === nextHover.candidateGroupId);
        if (!group) {
          setHoveredOsmCandidate(nextHover);
          return;
        }

        const streetLayerIds = resolveStreetLayerIdsFromStyle(mapInstance);
        const anchorResolution = resolveOsmStopCandidateGroupStreetAnchor(mapInstance, group, streetLayerIds);
        setHoveredOsmCandidate({
          ...nextHover,
          anchorResolution
        });
      },
      onValidPlacement: (lng, lat, labelCandidate) => {
        let createdStop!: Stop;
        onPlacedStopsChange((currentStops) => {
          const nextOrdinal = currentStops.length + 1;
          const nextStop = buildDeterministicStop(nextOrdinal, lng, lat, labelCandidate, currentStops);
          createdStop = nextStop;
          setLastPlacedStopLabel(nextStop.label ?? null);
          return [...currentStops, nextStop];
        });

        return createdStop;
      }
    });

    const osmCandidateInteractionBinding = bindOsmCandidateFeatureInteractions(mapInstance, (event) => {
      if (activeToolModeRef.current !== 'inspect') {
        return;
      }

      const clickedFeature = event.features?.[0];
      const groupId = decodeOsmCandidateGroupIdFromFeatureProperties(clickedFeature?.properties);

      if (!groupId) {
        return;
      }

      onOsmCandidateSelectionChange(groupId);

      const group = osmStopCandidateGroups.find((g) => g.id === groupId);
      if (group) {
        const streetLayerIds = resolveStreetLayerIdsFromStyle(mapInstance);
        const anchorResolution = resolveOsmStopCandidateGroupStreetAnchor(mapInstance, group, streetLayerIds);
        onOsmCandidateAnchorResolved(anchorResolution);
      } else {
        onOsmCandidateAnchorResolved(null);
      }
    });

    return () => {
      interactions.dispose();
      osmCandidateInteractionBinding.dispose();
    };
  }, [activeToolMode, onPlacedStopsChange, onStopSelectionChange, onOsmCandidateSelectionChange]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const sourceSyncDiagnostics = syncExistingMapWorkspaceSourceData({
      map: mapInstance,
      stopSync: {
        stops: placedStops,
        selectedStopId,
        draftStopIds: draftStopIdSet,
        isBuildLineModeActive: activeToolMode === 'build-line',
        selectedLine: sessionLines.find(l => l.id === selectedLineId) ?? null
      },
      osmStopCandidateSync: osmStopCandidateGroups
    });

    if (sourceSyncDiagnostics) {
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      syncAllMapWorkspaceSources({
        map: mapInstance,
        stopSync: {
          stops: placedStops,
          selectedStopId,
          draftStopIds: draftStopIdSet,
          isBuildLineModeActive: activeToolMode === 'build-line',
          selectedLine: sessionLines.find(l => l.id === selectedLineId) ?? null
        },
        osmStopCandidateSync: osmStopCandidateGroups
      });
    });
  }, [activeToolMode, draftStopIdSet, placedStops, selectedStopId, osmStopCandidateGroups]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const sourceSyncDiagnostics = syncExistingMapWorkspaceSourceData({
      map: mapInstance,
      lineSync: {
        sessionLines,
        selectedLineId,
        draftStopIds: draftLineState.stopIds,
        stopsById: new Map(placedStops.map((stop) => [stop.id, stop] as const))
      },
      osmStopCandidateSync: osmStopCandidateGroups
    });

    if (sourceSyncDiagnostics) {
      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        lines: {
          ...currentDiagnostics.lines,
          builderFeatureCount: sourceSyncDiagnostics.lineBuilderFeatureCount ?? currentDiagnostics.lines.builderFeatureCount,
          sourceFeatureCount: sourceSyncDiagnostics.lineSourceFeatureCount
        }
      }));
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      const styleReadySyncDiagnostics = syncAllMapWorkspaceSources({
        map: mapInstance,
        lineSync: {
          sessionLines,
          selectedLineId,
          draftStopIds: draftLineState.stopIds,
          stopsById: new Map(placedStops.map((stop) => [stop.id, stop] as const))
        },
        osmStopCandidateSync: osmStopCandidateGroups
      });

      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        lines: {
          ...currentDiagnostics.lines,
          builderFeatureCount:
            styleReadySyncDiagnostics.lineBuilderFeatureCount ?? currentDiagnostics.lines.builderFeatureCount,
          sourceFeatureCount: styleReadySyncDiagnostics.lineSourceFeatureCount
        }
      }));
    });
  }, [draftLineState.stopIds, placedStops, selectedLineId, sessionLines, osmStopCandidateGroups]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const sourceSyncDiagnostics = syncExistingMapWorkspaceSourceData({
      map: mapInstance,
      vehicleSync: {
        vehicleNetworkProjection
      },
      osmStopCandidateSync: osmStopCandidateGroups
    });

    if (sourceSyncDiagnostics) {
      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        vehicles: {
          ...currentDiagnostics.vehicles,
          builderFeatureCount: sourceSyncDiagnostics.vehicleBuilderFeatureCount ?? currentDiagnostics.vehicles.builderFeatureCount,
          sourceFeatureCount: sourceSyncDiagnostics.vehicleSourceFeatureCount
        }
      }));
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      const styleReadySyncDiagnostics = syncAllMapWorkspaceSources({
        map: mapInstance,
        vehicleSync: {
          vehicleNetworkProjection
        },
        osmStopCandidateSync: osmStopCandidateGroups
      });

      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        vehicles: {
          ...currentDiagnostics.vehicles,
          builderFeatureCount:
            styleReadySyncDiagnostics.vehicleBuilderFeatureCount ?? currentDiagnostics.vehicles.builderFeatureCount,
          sourceFeatureCount: styleReadySyncDiagnostics.vehicleSourceFeatureCount
        }
      }));
    });
  }, [vehicleNetworkProjection, osmStopCandidateGroups]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const refreshRenderedFeatureDiagnostics = (): void => {
      const lineRenderedFeatureCount = countRenderedFeaturesForLayers(mapInstance, [
        MAP_LAYER_ID_COMPLETED_LINES,
        MAP_LAYER_ID_DRAFT_LINE
      ]);
      const vehicleRenderedFeatureCount = countRenderedFeaturesForLayers(mapInstance, [MAP_LAYER_ID_VEHICLES]);

      setFeatureDiagnostics((currentDiagnostics) => {
        if (
          currentDiagnostics.lines.renderedFeatureCount === lineRenderedFeatureCount &&
          currentDiagnostics.vehicles.renderedFeatureCount === vehicleRenderedFeatureCount
        ) {
          return currentDiagnostics;
        }

        return {
          ...currentDiagnostics,
          lines: {
            ...currentDiagnostics.lines,
            renderedFeatureCount: lineRenderedFeatureCount
          },
          vehicles: {
            ...currentDiagnostics.vehicles,
            renderedFeatureCount: vehicleRenderedFeatureCount
          }
        };
      });
    };

    refreshRenderedFeatureDiagnostics();
    mapInstance.on('render', refreshRenderedFeatureDiagnostics);
    mapInstance.on('idle', refreshRenderedFeatureDiagnostics);

    return () => {
      mapInstance.off('render', refreshRenderedFeatureDiagnostics);
      mapInstance.off('idle', refreshRenderedFeatureDiagnostics);
    };
  }, []);

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
  const lineDiagnosticsSummary = `Line features: builder ${featureDiagnostics.lines.builderFeatureCount} / source ${featureDiagnostics.lines.sourceFeatureCount} / rendered ${featureDiagnostics.lines.renderedFeatureCount}`;
  const vehicleDiagnosticsSummary = `Vehicle features: builder ${featureDiagnostics.vehicles.builderFeatureCount} / source ${featureDiagnostics.vehicles.sourceFeatureCount} / rendered ${featureDiagnostics.vehicles.renderedFeatureCount}`;
  const placementUiFeedback = buildPlacementUiFeedback(activeToolMode, placementAttemptResult);
  const buildLineUiFeedback = buildLineModeUiFeedback(activeToolMode, draftLineState.stopIds);
  const draftMetadataSummary = draftLineState.metadata
    ? `Draft #${draftLineState.metadata.draftOrdinal} @ ${draftLineState.metadata.startedAtIsoUtc}`
    : 'Draft inactive';
  const buildLineBlockerSummary = buildLineUiFeedback.canCompleteDraft
    ? 'Ready to complete.'
    : `Blocked: ${buildLineUiFeedback.minimumStopRequirement}`;

  useEffect(() => {
    onDebugSnapshotChange({
      interactionStatus: interactionState.status,
      pointerSummary,
      geographicSummary,
      lineDiagnosticsSummary,
      vehicleDiagnosticsSummary,
      stopSelectionSummary,
      placementInstruction: placementUiFeedback.modeInstruction ?? 'n/a',
      placementStreetRuleHint: placementUiFeedback.streetRuleHint ?? 'n/a',
      buildLineInstruction: buildLineUiFeedback.modeInstruction ?? 'n/a',
      buildLineMinimumRequirement: buildLineUiFeedback.minimumStopRequirement ?? 'n/a',
      completedOverlayNote: LINE_OVERLAY_COPY.completed,
      draftOverlayNote: LINE_OVERLAY_COPY.draft,
      draftMetadataSummary,
      lastPlacedStopLabel,
      osmStopCandidateRawCount: osmStopCandidates.length,
      osmStopCandidateGroupCount: osmStopCandidateGroups.length,
      osmStopCandidateAnchorLastStatus: hoveredOsmCandidate?.anchorResolution?.status,
      osmStopCandidateAnchorLastDistanceMeters: hoveredOsmCandidate?.anchorResolution?.distanceMeters ?? undefined,
      osmStopCandidateStreetLayerCount: mapInstanceRef.current ? resolveStreetLayerIdsFromStyle(mapInstanceRef.current).length : undefined
    });
  }, [
    buildLineUiFeedback.minimumStopRequirement,
    buildLineUiFeedback.modeInstruction,
    draftMetadataSummary,
    geographicSummary,
    interactionState.status,
    lastPlacedStopLabel,
    lineDiagnosticsSummary,
    onDebugSnapshotChange,
    placementUiFeedback.modeInstruction,
    placementUiFeedback.streetRuleHint,
    pointerSummary,
    stopSelectionSummary,
    vehicleDiagnosticsSummary,
    osmStopCandidates.length,
    osmStopCandidateGroups.length,
    hoveredOsmCandidate?.anchorResolution
  ]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapFocusIntent) {
      return;
    }

    const { target } = mapFocusIntent;

    if (target.type === 'stop') {
      const stop = placedStopsRef.current.find((s) => s.id === target.id);
      if (stop) {
        map.easeTo({
          center: [stop.position.lng, stop.position.lat],
          zoom: MAP_FOCUS_ZOOM_STOP
        });
      }
    } else if (target.type === 'line') {
      const line = sessionLinesRef.current.find((l) => l.id === target.id);
      if (line) {
        const coordinates: [number, number][] = [];

        // Collect all geometry coordinates if available
        line.routeSegments.forEach((segment) => {
          segment.orderedGeometry.forEach((coord) => {
            coordinates.push([coord[0], coord[1]]);
          });
        });

        // Fallback to stop positions if geometry is empty
        if (coordinates.length === 0) {
          line.stopIds.forEach((stopId) => {
            const stop = stopsByIdRef.current.get(stopId);
            if (stop) {
              coordinates.push([stop.position.lng, stop.position.lat]);
            }
          });
        }

        if (coordinates.length > 0) {
          const lats = coordinates.map((c) => c[1]);
          const lngs = coordinates.map((c) => c[0]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat]
            ],
            { padding: MAP_FOCUS_PADDING }
          );
        }
      }
    }

    onMapFocusIntentConsumed(null);
  }, [mapFocusIntent, onMapFocusIntentConsumed]);

  const handleDraftCancel = (): void => {
    setDraftLineState(INITIAL_DRAFT_LINE_STATE);
  };

  const handleDraftCompleteClick = (): void => {
    const draftStopIds = draftLineState.stopIds;

    if (draftStopIds.length < MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE) {
      return;
    }

    setIsCompletionDialogOpen(true);
  };

  const handleConfirmCompletion = async (options: { topology: LineTopology; servicePattern: LineServicePattern }): Promise<void> => {
    const draftStopIds = draftLineState.stopIds;

    if (draftStopIds.length < MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE || isCompletingLine) {
      return;
    }

    const { topology, servicePattern } = options;

    // 1. Snapshot draft, ordinal, and placed stops to ensure async safety
    const snapshottedStopIds = [...draftStopIds];
    const snapshottedOrdinal = sessionLines.length + 1;
    const snapshottedPlacedStops = [...placedStops];
    const nextCreatedLineId = createLineId(`line-${snapshottedOrdinal}`);

    setIsCompletingLine(true);

    try {
      // 2. Resolve route segments (async, street-routed if available)
      const routingResult = await completeLineRouting({
        lineId: nextCreatedLineId,
        orderedStopIds: snapshottedStopIds,
        placedStops: snapshottedPlacedStops,
        topology,
        servicePattern,
        routingAdapter: getDefaultRoutingAdapter()
      });

      // 3. Generate deterministic line label from stop labels
      const lineStops = snapshottedStopIds
        .map(id => snapshottedPlacedStops.find(s => s.id === id))
        .filter((s): s is Stop => !!s);
      
      const baseLabel = generateLineLabel(lineStops, topology, servicePattern) 
        ?? `${LINE_BUILD_PLACEHOLDER_LABEL_PREFIX} ${snapshottedOrdinal}`;
      
      const finalLabel = generateUniqueLineLabel({
        baseLabel,
        existingLines: sessionLines
      });

      // 4. Commit the new line to session state
      const createdLine: Line = {
        id: nextCreatedLineId,
        label: finalLabel,
        stopIds: snapshottedStopIds,
        topology,
        servicePattern,
        routeSegments: routingResult.routeSegments,
        reverseRouteSegments: routingResult.reverseRouteSegments,
        frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
      };

      onSessionLinesChange((currentLines) => [...currentLines, createdLine]);
      onSelectedLineIdChange(createdLine.id);
      onSelectedLineDialogOpenIntentChange({
        lineId: createdLine.id,
        dialogId: 'frequency',
        requestId: Date.now()
      });

      // 4. Clear draft and close dialog only after success
      setDraftLineState(INITIAL_DRAFT_LINE_STATE);
      setIsCompletionDialogOpen(false);
    } catch (error) {
      console.error('Failed to confirm line completion:', error);
    } finally {
      setIsCompletingLine(false);
    }
  };

  return (
    <section className="map-workspace" aria-label="Map workspace surface">
      <div ref={mapContainerRef} className="map-workspace__map" aria-label="CityOps baseline map" />

      {placementUiFeedback.showPlacementModeIndicator ? (
        <div className="map-workspace__overlay map-workspace__overlay--mode" aria-live="polite" aria-label="Placement mode status">
          <strong>{PLACEMENT_MODE_INDICATOR_LABEL}</strong>
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
          <span>{` · Draft stops: ${buildLineUiFeedback.draftStopCount}`}</span>
          <span> · {buildLineBlockerSummary}</span>
          <div className="map-workspace__overlay-button-row">
            <button type="button" onClick={handleDraftCancel}>
              Cancel draft
            </button>
            <button type="button" onClick={handleDraftCompleteClick} disabled={!buildLineUiFeedback.canCompleteDraft || isCompletingLine}>
              {isCompletingLine ? 'Creating...' : 'Complete line'}
            </button>
          </div>
        </div>
      ) : null}

      {hoveredStop && stopsByIdRef.current.get(hoveredStop.stopId) && (
        <StopHoverTooltip
          stop={stopsByIdRef.current.get(hoveredStop.stopId)!}
          x={hoveredStop.x}
          y={hoveredStop.y}
          sessionLines={sessionLines}
          selectedLineId={selectedLineId}
        />
      )}

      {hoveredOsmCandidate && (
        <OsmStopCandidateHoverTooltip
          candidateGroupId={hoveredOsmCandidate.candidateGroupId}
          label={hoveredOsmCandidate.label}
          memberCount={hoveredOsmCandidate.memberCount}
          memberKinds={hoveredOsmCandidate.memberKinds}
          berthCountHint={hoveredOsmCandidate.berthCountHint}
          x={hoveredOsmCandidate.x}
          y={hoveredOsmCandidate.y}
          anchorResolution={hoveredOsmCandidate.anchorResolution}
        />
      )}

      {isCompletionDialogOpen && (
        <LineCompletionDialog
          open={isCompletionDialogOpen}
          onCancel={() => setIsCompletionDialogOpen(false)}
          onConfirm={handleConfirmCompletion}
          isProcessing={isCompletingLine}
        />
      )}

    </section>
  );
}
