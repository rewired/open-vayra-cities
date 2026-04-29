import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import {
  MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE
} from '../domain/constants/lineBuilding';

import { getDefaultRoutingAdapter } from '../domain/routing/defaultRoutingAdapter';
import type { Line } from '../domain/types/line';
import { type LineTopology, type LineServicePattern } from '../domain/types/line';
import type { LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import type { Stop, StopId } from '../domain/types/stop';
import { createStopId } from '../domain/types/stop';
import type { OsmStopCandidateGroup, OsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import type { DemandNode } from '../domain/types/demandNode';
import type { TimeBandId } from '../domain/types/timeBand';
import type { NetworkDemandCapturePreviewProjection } from '../domain/projection/demandCapturePreviewProjection';


import { createUniqueStopLabel } from '../domain/stop/stopLabeling';
import { prepareCompletedDraftLine } from './mapWorkspaceLineCompletion';
import type { LineBuildSelectionState, MapFocusIntent, WorkspaceToolMode } from '../session/sessionTypes';
import { INITIAL_DRAFT_LINE_STATE, type DraftLineState } from './mapWorkspaceDraftState';
import { useMapWorkspaceInteractionBindings } from './useMapWorkspaceInteractionBindings';


import {
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
import { syncAllMapWorkspaceSources } from './mapWorkspaceSourceSync';
import {
  createMapWorkspaceInstance,
  setupMapResizeBinding
} from './mapWorkspaceLifecycle';
import { applyBasemapSemanticReadabilityOverrides } from './mapBaseStyleOverrides';
import type { MapLibreMap } from './maplibreGlobal';
import {
  isStaleOsmStopCandidateHover,
  type ResolvedOsmStopCandidateHoverPayload,
  type OsmStopCandidateAnchorResolutionCache
} from './mapWorkspaceOsmCandidateHover';
import { applyMapWorkspaceFocusIntent } from './mapWorkspaceFocus';
import { buildMapWorkspaceDebugSnapshot, type MapWorkspaceDebugSnapshot } from './mapWorkspaceDebugSnapshot';
import { useMapWorkspaceSourceSync, type MapWorkspaceFeatureDiagnostics, type LayerFeatureDiagnostics } from './useMapWorkspaceSourceSync';
import { MapLayerFlyout } from './MapLayerFlyout';
import {
  INITIAL_MAP_LAYER_VISIBILITY,
  type MapLayerId,
  type MapLayerVisibilityById
} from '../ui/constants/mapLayerUiConstants';

/** Canonical single-stop selection contract shared by marker highlighting and shell inspector state. */
export type { StopSelectionState } from './mapWorkspaceInteractions';

interface MapWorkspaceSurfaceProps {
  readonly activeToolMode: WorkspaceToolMode;
  readonly selectedStopId: StopId | null;
  readonly placedStops: readonly Stop[];
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

  readonly onOsmCandidateSelectionChange: (nextSelectionId: OsmStopCandidateGroupId | null) => void;
  readonly osmStopCandidateGroups: readonly OsmStopCandidateGroup[];
  readonly onOsmCandidateAnchorResolved: (resolution: import('../domain/osm/osmStopCandidateAnchorTypes').OsmStopCandidateStreetAnchorResolution | null) => void;
  readonly demandNodes: readonly DemandNode[];
  readonly activeTimeBandId: TimeBandId;
  readonly demandCapturePreviewProjection: NetworkDemandCapturePreviewProjection;
}



const STOP_LABEL_PREFIX = 'Stop';
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
  onOsmCandidateSelectionChange,
  osmStopCandidateGroups,
  onOsmCandidateAnchorResolved,
  demandNodes,
  activeTimeBandId,
  demandCapturePreviewProjection
}: MapWorkspaceSurfaceProps): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [interactionState, setInteractionState] = useState<MapSurfaceInteractionState>({
    status: 'idle',
    pointer: null
  });
  const [placementAttemptResult, setPlacementAttemptResult] = useState<PlacementAttemptResult>('none');
  const [hoveredStop, setHoveredStop] = useState<{ stopId: StopId; x: number; y: number } | null>(null);
  const [hoveredOsmCandidate, setHoveredOsmCandidate] = useState<ResolvedOsmStopCandidateHoverPayload | null>(null);
  const [draftLineState, setDraftLineState] = useState<DraftLineState>(INITIAL_DRAFT_LINE_STATE);
  const [featureDiagnostics, setFeatureDiagnostics] = useState<MapWorkspaceFeatureDiagnostics>(
    INITIAL_MAP_WORKSPACE_FEATURE_DIAGNOSTICS
  );
  const [lastPlacedStopLabel, setLastPlacedStopLabel] = useState<string | null>(null);
  const [isDemandOverlayVisible, setIsDemandOverlayVisible] = useState<boolean>(false);
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibilityById>(INITIAL_MAP_LAYER_VISIBILITY);

  const handleToggleLayer = (layerId: MapLayerId): void => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

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

  const anchorResolutionCacheRef = useRef<OsmStopCandidateAnchorResolutionCache>(new Map());

  useEffect(() => {
    anchorResolutionCacheRef.current.clear();
  }, [osmStopCandidateGroups]);

  useEffect(() => {
    if (isStaleOsmStopCandidateHover(hoveredOsmCandidate, osmStopCandidateGroups)) {
      setHoveredOsmCandidate(null);
    }
  }, [osmStopCandidateGroups, hoveredOsmCandidate]);

  useEffect(() => {
    if (hoveredStop && !placedStops.some(s => s.id === hoveredStop.stopId)) {
      setHoveredStop(null);
    }
  }, [placedStops, hoveredStop]);



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

  const demandNodesRef = useRef<readonly DemandNode[]>(demandNodes);
  const activeTimeBandIdRef = useRef<TimeBandId>(activeTimeBandId);
  const isDemandOverlayVisibleRef = useRef<boolean>(isDemandOverlayVisible);
  const demandCapturePreviewProjectionRef = useRef<NetworkDemandCapturePreviewProjection>(demandCapturePreviewProjection);

  useEffect(() => {
    demandNodesRef.current = demandNodes;
  }, [demandNodes]);

  useEffect(() => {
    activeTimeBandIdRef.current = activeTimeBandId;
  }, [activeTimeBandId]);

  useEffect(() => {
    isDemandOverlayVisibleRef.current = isDemandOverlayVisible;
  }, [isDemandOverlayVisible]);

  useEffect(() => {
    demandCapturePreviewProjectionRef.current = demandCapturePreviewProjection;
  }, [demandCapturePreviewProjection]);

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
        demandNodeSync: {
          demandNodes: demandNodesRef.current,
          activeTimeBandId: activeTimeBandIdRef.current,
          visible: isDemandOverlayVisibleRef.current,
          demandCapturePreviewProjection: demandCapturePreviewProjectionRef.current
        }

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
    if (activeToolMode !== 'inspect') {
      setHoveredOsmCandidate(null);
    }

    if (activeToolMode === 'build-line') {
      setDraftLineState(INITIAL_DRAFT_LINE_STATE);
    }
  }, [activeToolMode]);

  useMapWorkspaceInteractionBindings({
    mapRef: mapInstanceRef,
    activeToolMode,
    activeToolModeRef,
    sessionLineCountRef,
    onStopSelectionChangeRef,
    stopsByIdRef,
    anchorResolutionCacheRef,
    osmStopCandidateGroups,
    setInteractionState,
    setPlacementAttemptResult,
    setHoveredStop,
    setHoveredOsmCandidate,
    setDraftLineState,
    onPlacedStopsChange,
    onStopSelectionChange,
    onSelectedLineIdChange,
    onOsmCandidateSelectionChange,
    onOsmCandidateAnchorResolved,
    createStop: buildDeterministicStop,
    onStopCreated: (stop) => setLastPlacedStopLabel(stop.label ?? null)
  });

  useMapWorkspaceSourceSync({
    mapRef: mapInstanceRef,
    activeToolMode,
    placedStops,
    selectedStopId,
    draftStopIds: draftLineState.stopIds,
    draftStopIdSet,
    sessionLines,
    selectedLineId,
    vehicleNetworkProjection,
    osmStopCandidateGroups,
    demandNodes,
    activeTimeBandId,
    isDemandOverlayVisible,
    demandCapturePreviewProjection,
    setFeatureDiagnostics

  });

  const placementUiFeedback = buildPlacementUiFeedback(activeToolMode, placementAttemptResult);
  const buildLineUiFeedback = buildLineModeUiFeedback(activeToolMode, draftLineState.stopIds);
  const buildLineBlockerSummary = buildLineUiFeedback.canCompleteDraft
    ? 'Ready to complete.'
    : `Blocked: ${buildLineUiFeedback.minimumStopRequirement}`;

  useEffect(() => {
    const nextSnapshot = buildMapWorkspaceDebugSnapshot({
      interactionState,
      selectedStopId,
      featureDiagnostics,
      activeToolMode,
      placementAttemptResult,
      draftStopIds: draftLineState.stopIds,
      draftMetadata: draftLineState.metadata,
      lastPlacedStopLabel,
      osmStopCandidateGroupCount: osmStopCandidateGroups.length,
      hoveredOsmCandidateAnchorResolution: hoveredOsmCandidate?.anchorResolution,
      osmStopCandidateStreetLayerCount: mapInstanceRef.current ? resolveStreetLayerIdsFromStyle(mapInstanceRef.current).length : undefined
    });
    onDebugSnapshotChange(nextSnapshot);
  }, [
    interactionState,
    selectedStopId,
    featureDiagnostics,
    activeToolMode,
    placementAttemptResult,
    draftLineState.stopIds,
    draftLineState.metadata,
    lastPlacedStopLabel,
    osmStopCandidateGroups.length,
    hoveredOsmCandidate?.anchorResolution,
    onDebugSnapshotChange
  ]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapFocusIntent) {
      return;
    }

    applyMapWorkspaceFocusIntent({
      map,
      intent: mapFocusIntent,
      stops: placedStopsRef.current,
      lines: sessionLinesRef.current
    });

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

    // 1. Snapshot draft, placed stops, and existing lines to ensure async safety
    const snapshottedStopIds = [...draftStopIds];
    const snapshottedPlacedStops = [...placedStops];
    const snapshottedExistingLines = [...sessionLines];

    setIsCompletingLine(true);

    try {
      // 2. Call extracted helper to prepare the canonical line
      const createdLine = await prepareCompletedDraftLine({
        draftStopIds: snapshottedStopIds,
        placedStops: snapshottedPlacedStops,
        existingLines: snapshottedExistingLines,
        topology,
        servicePattern,
        routingAdapter: getDefaultRoutingAdapter()
      });

      onSessionLinesChange((currentLines) => [...currentLines, createdLine]);
      onSelectedLineIdChange(createdLine.id);
      onSelectedLineDialogOpenIntentChange({
        lineId: createdLine.id,
        dialogId: 'frequency',
        requestId: Date.now()
      });

      // 3. Clear draft and close dialog only after success
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
      <div ref={mapContainerRef} className="map-workspace__map" aria-label="OpenVayra - Cities baseline map" />

      <MapLayerFlyout
        visibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
      />

      <div className="map-workspace__overlay map-workspace__overlay--demand-toggle" aria-label="Demand overlay controls">
        <label className="map-workspace__demand-toggle-label">
          <input
            type="checkbox"
            checked={isDemandOverlayVisible}
            onChange={(e) => setIsDemandOverlayVisible(e.target.checked)}
            className="map-workspace__demand-toggle-checkbox"
          />
          <span>Demand overlay</span>
        </label>
        <span className="map-workspace__demand-toggle-status">
          {demandNodes.length === 0
            ? 'No scenario demand data'
            : demandCapturePreviewProjection.selectedStopCapturedNodeCount > 0
            ? `${demandCapturePreviewProjection.capturedNodeCount} / ${demandCapturePreviewProjection.totalNodeCount} captured · selected stop: ${demandCapturePreviewProjection.selectedStopCapturedNodeCount}`
            : `${demandCapturePreviewProjection.capturedNodeCount} / ${demandCapturePreviewProjection.totalNodeCount} captured`}
        </span>
      </div>


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
