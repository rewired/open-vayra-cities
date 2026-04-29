import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';

import { buildSelectedLineExportPayload } from './domain/types/selectedLineExport';
import { useNetworkPlanningProjections } from './domain/projection/useNetworkPlanningProjections';
import { InspectorPanel } from './inspector/InspectorPanel';
import type { InspectorPanelState } from './inspector/types';
import { MapWorkspaceSurface } from './map-workspace/MapWorkspaceSurface';
import type { MapWorkspaceDebugSnapshot } from './map-workspace/mapWorkspaceDebugSnapshot';
import { SessionActions } from './session/SessionActions';
import { useNetworkSessionState } from './session/useNetworkSessionState';
import { SimulationControlBar } from './simulation/SimulationControlBar';
import { useSimulationClockController } from './simulation/useSimulationClockController';
import { MaterialIcon } from './ui/icons/MaterialIcon';
import { ToastHost } from './ui/toast/ToastHost';
import { loadOsmStopCandidates } from './domain/osm/osmStopCandidateSource';
import { consolidateOsmStopCandidates } from './domain/osm/osmStopCandidateConsolidation';
import type { OsmStopCandidate, OsmStopCandidateGroup, OsmStopCandidateGroupId } from './domain/types/osmStopCandidate';
import type { OsmStopCandidateStreetAnchorResolution } from './domain/osm/osmStopCandidateAnchorTypes';
import {
  DebugModal,
  type DebugModalOverviewDiagnostics,
  type DebugModalRoutingDiagnostics,
  type DebugModalServiceDiagnostics
} from './ui/DebugModal';
import { summarizeDemandNodes } from './domain/demand/demandNodeHelpers';
import { loadScenarioDemandNodes } from './domain/demand/loadScenarioDemandNodes';
import type { DemandNode } from './domain/types/demandNode';
import { WORKSPACE_MODE_ICONS } from './ui/icons/materialIcons';
import type { MapFocusIntent } from './session/sessionTypes';
import { BlockingDataOperationModal } from './ui/data-operation/BlockingDataOperationModal';
import type { ActiveDataOperation } from './ui/data-operation/types';

import { AppShell } from './AppShell';
import { loadScenarioRegistry } from './domain/scenario/loadScenarioRegistry';
import type { ScenarioRegistryEntry, ScenarioRegistry } from './domain/scenario/scenarioRegistry';
import { ScenarioSelectionScreen } from './scenario/ScenarioSelectionScreen';
import './App.css';


const buildSelectedLineExportFilename = (lineId: string): string => `openvayra-cities-line-${lineId}.json`;

const downloadJsonFile = (filename: string, payload: unknown): void => {
  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(jsonBlob);
  const temporaryAnchor = document.createElement('a');
  temporaryAnchor.href = objectUrl;
  temporaryAnchor.download = filename;
  document.body.appendChild(temporaryAnchor);
  temporaryAnchor.click();
  temporaryAnchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const resolveInspectorPanelState = (
  selectedLine: ReturnType<typeof useNetworkSessionState>['selectedLine'],
  selectedStop: ReturnType<typeof useNetworkSessionState>['selectedStop'],
  selectedOsmCandidateGroupId: ReturnType<typeof useNetworkSessionState>['selectedOsmCandidateGroupId'],
  sessionStops: readonly import('./domain/types/stop').Stop[]
): InspectorPanelState => {
  if (selectedLine) {
    return {
      mode: 'line-selected',
      selectedLine
    };
  }

  if (selectedStop) {
    const stop = sessionStops.find((s) => s.id === selectedStop.selectedStopId);

    if (stop) {
      return {
        mode: 'stop-selected',
        selection: selectedStop,
        stop
      };
    }
  }
  
  if (selectedOsmCandidateGroupId) {
    return {
      mode: 'osm-candidate-selected',
      candidateGroupId: selectedOsmCandidateGroupId
    };
  }

  return {
    mode: 'empty'
  };
};

const INITIAL_MAP_WORKSPACE_DEBUG_SNAPSHOT: MapWorkspaceDebugSnapshot = {
  interactionStatus: 'idle',
  pointerSummary: 'none',
  geographicSummary: 'lng/lat unavailable',
  lineDiagnosticsSummary: 'Line features: builder 0 / source 0 / rendered 0',
  vehicleDiagnosticsSummary: 'Vehicle features: builder 0 / source 0 / rendered 0',
  stopSelectionSummary: 'Selected stop: none',
  placementInstruction: 'n/a',
  placementStreetRuleHint: 'n/a',
  buildLineInstruction: 'n/a',
  buildLineMinimumRequirement: 'n/a',
  completedOverlayNote: 'n/a',
  draftOverlayNote: 'n/a',
  draftMetadataSummary: 'Draft inactive',
  lastPlacedStopLabel: null,
  osmStopCandidateRawCount: 0,
  osmStopCandidateGroupCount: 0
};

/** Renders the desktop-only CityOps application shell layout and composes extracted session/projection/inspector boundaries. */
export default function App(): ReactElement {
  const sessionController = useNetworkSessionState();
  const clockController = useSimulationClockController();
  const [isMapDebugModalOpen, setMapDebugModalOpen] = useState<boolean>(false);
  const [mapWorkspaceDebugSnapshot, setMapWorkspaceDebugSnapshot] = useState<MapWorkspaceDebugSnapshot>(
    INITIAL_MAP_WORKSPACE_DEBUG_SNAPSHOT
  );
  const [mapFocusIntent, setMapFocusIntent] = useState<MapFocusIntent | null>(null);
  const [activeDataOperation, setActiveDataOperation] = useState<ActiveDataOperation | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioRegistryEntry | null>(null);
  const [registryState, setRegistryState] = useState<{
    status: 'loading' | 'loaded' | 'failed';
    registry: ScenarioRegistry | null;
    error: string | null;
  }>({ status: 'loading', registry: null, error: null });

  const fetchRegistry = useCallback(async () => {
    setRegistryState({ status: 'loading', registry: null, error: null });
    const result = await loadScenarioRegistry();
    if (result.status === 'loaded') {
      setRegistryState({ status: 'loaded', registry: result.registry, error: null });
    } else {
      setRegistryState({ status: 'failed', registry: null, error: result.message });
    }
  }, []);

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);
  
  const [osmStopCandidates, setOsmStopCandidates] = useState<readonly OsmStopCandidate[]>([]);
  const [selectedOsmCandidateAnchor, setSelectedOsmCandidateAnchor] = useState<OsmStopCandidateStreetAnchorResolution | null>(null);
  const [scenarioDemandNodes, setScenarioDemandNodes] = useState<readonly DemandNode[]>([]);




  const osmStopCandidateGroups = useMemo(
    () => consolidateOsmStopCandidates(osmStopCandidates),
    [osmStopCandidates]
  );
  
  useEffect(() => {
    if (!selectedScenario) return;

    let cancelled = false;

    const loadCandidates = async (): Promise<void> => {
      setActiveDataOperation({
        title: 'Workspace Initialization',
        phase: 'Loading OSM stop candidates...',
        progress: { kind: 'indeterminate' }
      });

      try {
        const candidates = await loadOsmStopCandidates();
        if (cancelled) return;

        setActiveDataOperation({
          title: 'Workspace Initialization',
          phase: 'Grouping stop-facility candidates...',
          progress: { kind: 'indeterminate' }
        });

        // Ensure the "Grouping" phase is painted before potentially heavy sync work
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (cancelled) return;

        setOsmStopCandidates(candidates);
      } catch (error) {
        console.error('[App] OSM candidate load failed:', error);
      } finally {
        if (!cancelled) {
          setActiveDataOperation(null);
        }
      }
    };

    loadCandidates();

    return () => {
      cancelled = true;
    };
  }, [selectedScenario]);

  useEffect(() => {

    if (!selectedScenario) {
      setScenarioDemandNodes([]);
      return;
    }

    let cancelled = false;

    const loadDemand = async (): Promise<void> => {
      try {
        const result = await loadScenarioDemandNodes(selectedScenario.scenarioId);
        if (cancelled) return;

        if (result.status === 'loaded') {
          setScenarioDemandNodes(result.nodes);
        } else {
          console.warn(`[App] Demand nodes load status: ${result.status}. Message: ${result.message || 'none'}`);
          setScenarioDemandNodes([]);
        }
      } catch (error) {
        console.error('[App] Demand node load failed:', error);
        if (!cancelled) {
          setScenarioDemandNodes([]);
        }
      }
    };

    loadDemand();

    return () => {
      cancelled = true;
    };
  }, [selectedScenario]);

  const projections = useNetworkPlanningProjections(
    sessionController.sessionLines,
    sessionController.sessionStops,
    sessionController.selectedLine,
    sessionController.selectedStopId,
    clockController.activeSimulationTimeBandId,
    clockController.currentSimulationMinuteOfDay,
    clockController.currentSimulationSecondOfDay,
    scenarioDemandNodes
  );

  const inspectorPanelState = resolveInspectorPanelState(
    sessionController.selectedLine,
    sessionController.selectedStop,
    sessionController.selectedOsmCandidateGroupId,
    sessionController.sessionStops
  );
  const selectedCompletedLineForExport =
    inspectorPanelState.mode === 'line-selected'
      ? sessionController.sessionLines.find((line) => line.id === inspectorPanelState.selectedLine.id) ?? null
      : null;
const toolModeControlOptions: ReadonlyArray<{
  readonly mode: 'inspect' | 'build-line';
  readonly shortLabel: string;
  readonly accessibleLabel: string;
}> = [
  { mode: 'inspect', shortLabel: 'Inspect', accessibleLabel: 'Inspect workspace' },
  { mode: 'build-line', shortLabel: 'LINE', accessibleLabel: 'Build line tool' }
];
  const handleMapDebugSnapshotChange = useCallback((nextSnapshot: MapWorkspaceDebugSnapshot): void => {
    setMapWorkspaceDebugSnapshot(nextSnapshot);
  }, []);

  const overviewDiagnostics: DebugModalOverviewDiagnostics = {
    activeToolMode: sessionController.activeToolMode,
    selectedStopId: sessionController.selectedStopId,
    selectedLineId: sessionController.selectedLineId,
    selectedOsmCandidateGroupId: sessionController.selectedOsmCandidateGroupId,
    totalStopCount: sessionController.sessionStops.length,
    completedLineCount: sessionController.sessionLines.length,
    totalProjectedVehicleCount: projections.vehicleNetworkProjection.summary.totalProjectedVehicleCount,
    draftOrderedStopIds: sessionController.lineBuildSelection.selectedStopIds,
    completedLineIds: sessionController.sessionLines.map((line) => line.id),
    demandNodeSummary: summarizeDemandNodes(scenarioDemandNodes)
  };
  const routingDiagnostics: DebugModalRoutingDiagnostics = {
    selectedLineOrderedStopIds: sessionController.selectedLine?.stopIds ?? [],
    selectedLineSegmentCount: projections.selectedLineRouteBaseline?.segments.length ?? null,
    selectedLineHasFallbackSegments: projections.selectedLineRouteBaseline?.status === 'fallback-routed' || projections.selectedLineRouteBaseline?.status === 'partial',
    selectedLineFallbackSegmentCount:
      projections.selectedLineRouteBaseline?.segments.filter((segment) => segment.status === 'fallback-routed').length ??
      0,
    selectedLineRouteFallbackNote: (projections.selectedLineRouteBaseline?.status === 'fallback-routed' || projections.selectedLineRouteBaseline?.status === 'partial')
      ? 'Fallback routed segments detected. Values are baseline fallback outputs and are not accuracy claims.'
      : 'No fallback routed segments detected.',
    completedOverlayNote: mapWorkspaceDebugSnapshot.completedOverlayNote,
    draftOverlayNote: mapWorkspaceDebugSnapshot.draftOverlayNote,
    selectedLineSegments:
      projections.selectedLineRouteBaseline?.segments.map((segment) => ({
        index: segment.segmentIndex,
        fromStopId: segment.fromStopId,
        toStopId: segment.toStopId,
        distanceMeters: segment.distanceMeters,
        travelTimeSeconds: segment.travelTimeSeconds,
        status: segment.status,
        warnings: segment.warnings.map((w) => w.type)
      })) ?? []
  };
  const serviceDiagnostics: DebugModalServiceDiagnostics = {
    selectedLineReadinessStatus: projections.selectedLineServiceProjection?.readiness.status ?? null,
    selectedLineConfiguredTimeBandCount:
      projections.selectedLineServiceProjection?.readiness.summary.configuredTimeBandCount ?? null,
    selectedLineRouteSegmentCount: projections.selectedLineServiceProjection?.readiness.summary.routeSegmentCount ?? null,
    selectedLineReadinessIssueCount: projections.selectedLineServiceProjection?.readiness.issues.length ?? 0,
    selectedLineReadinessIssueSummaries:
      projections.selectedLineServiceProjection?.readiness.issues.map((issue) => `${issue.severity}: ${issue.message}`) ??
      [],
    networkBlockedLineCount: projections.networkServicePlanProjection.summary.blockedLineCount,
    networkDegradedLineCount: projections.networkServicePlanProjection.summary.degradedLineCount
  };

  const handleStopInventorySelection = useCallback(
    (stopId: import('./domain/types/stop').StopId) => {
      sessionController.setSelectedLineId(null);
      sessionController.setSelectedStop({ selectedStopId: stopId });
      setMapFocusIntent({ target: { type: 'stop', id: stopId }, requestId: Date.now() });
    },
    [sessionController]
  );

  const handleLineInventorySelection = useCallback(
    (lineId: import('./domain/types/line').LineId) => {
      sessionController.setSelectedStop(null);
      sessionController.setSelectedLineId(lineId);
      setMapFocusIntent({ target: { type: 'line', id: lineId }, requestId: Date.now() });
    },
    [sessionController]
  );

  const handleLineSequenceStopFocus = useCallback(
    (stopId: import('./domain/types/stop').StopId) => {
      setMapFocusIntent({ target: { type: 'stop', id: stopId }, requestId: Date.now() });
    },
    []
  );

  if (registryState.status === 'loading') {
    return (
      <div className="scenario-loading-state" aria-label="Scenario loading state">
        <div className="scenario-loading-state__spinner" aria-hidden="true" />
        <p>Syncing operational scenario registry payload...</p>
      </div>
    );
  }

  if (registryState.status === 'failed') {
    return (
      <div className="scenario-error-state" aria-label="Scenario registry error state">
        <MaterialIcon name="error" className="scenario-error-state__icon" />
        <h1 className="scenario-error-state__title">Registry Synchronization Failure</h1>
        <p className="scenario-error-state__message">
          The dashboard was unable to load available playable zones. Ensure static pipelines remain active.
        </p>
        <p className="scenario-error-state__message">
          {registryState.error}
        </p>
        <div className="scenario-error-state__command-box">
          <span>Run generating process:</span>
          <code className="scenario-error-state__command">pnpm scenarios:build</code>
        </div>
        <button
          type="button"
          className="scenario-error-state__retry-button"
          onClick={fetchRegistry}
        >
          <MaterialIcon name="restart_alt" />

          <span>Retry Synchronization</span>
        </button>
      </div>
    );
  }

  if (!selectedScenario && registryState.registry) {
    return (
      <ScenarioSelectionScreen
        scenarios={registryState.registry.scenarios}
        onSelectScenario={(scenario) => {
          setSelectedScenario(scenario);
        }}
        onReloadRegistry={fetchRegistry}
      />
    );
  }

  return (
    <AppShell
      isBlocked={activeDataOperation !== null}
      toastHost={<ToastHost />}
      blockingModal={<BlockingDataOperationModal activeOperation={activeDataOperation} />}
    >
      <SimulationControlBar
        clockController={clockController}
        scenarioTitle={selectedScenario?.title}

        debugAction={
          <button
            type="button"
            className="simulation-control-bar__debug-button"
            aria-pressed={isMapDebugModalOpen}
            aria-label="Open map debug modal"
            onClick={() => {
              setMapDebugModalOpen(true);
            }}
          >
            <MaterialIcon name="search" />
            <span>Debug</span>
          </button>
        }
        sessionActions={
          <SessionActions
            hasSelectedLineForExport={selectedCompletedLineForExport !== null}
            onLoadStart={() => {}} // onLoadStart was used for clearSelectedLineImportFeedback, which is now handled by auto-dismiss
            onFileSelection={sessionController.handleLineJsonFileSelection}
            onExportSelectedLine={() => {
              if (!selectedCompletedLineForExport) {
                return;
              }

              const exportPayload = buildSelectedLineExportPayload({
                selectedLine: selectedCompletedLineForExport,
                placedStops: sessionController.sessionStops,
                createdAtIsoUtc: new Date().toISOString(),
                sourceMetadata: {
                  source: 'openvayra-cities-web'
                }
              });

              downloadJsonFile(
                buildSelectedLineExportFilename(selectedCompletedLineForExport.id),
                exportPayload
              );
            }}
          />
        }
      />

      <aside className="left-panel" aria-label="Tools and navigation panel">
        <nav className="tool-mode-rail" role="group" aria-label="Workspace mode selection">
          {toolModeControlOptions.map((toolModeControlOption) => (
            <button
              key={toolModeControlOption.mode}
              type="button"
              className="tool-mode-rail__button"
              aria-pressed={sessionController.activeToolMode === toolModeControlOption.mode}
              aria-label={toolModeControlOption.accessibleLabel}
              title={toolModeControlOption.accessibleLabel}
              onClick={() => {
                sessionController.handleToolModeSelection(toolModeControlOption.mode);
              }}
            >
              <MaterialIcon name={WORKSPACE_MODE_ICONS[toolModeControlOption.mode]} />
              <span className="tool-mode-rail__label" aria-hidden="true">
                {toolModeControlOption.shortLabel}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace" aria-label="Main workspace">
        <MapWorkspaceSurface
          activeToolMode={sessionController.activeToolMode}
          selectedStopId={sessionController.selectedStopId}
          placedStops={sessionController.sessionStops}
          sessionLines={sessionController.sessionLines}
          selectedLineId={sessionController.selectedLineId}
          vehicleNetworkProjection={projections.vehicleNetworkProjection}
          onPlacedStopsChange={sessionController.setSessionStops}
          onStopSelectionChange={sessionController.setSelectedStop}
          onLineBuildSelectionChange={sessionController.setLineBuildSelection}
          onSessionLinesChange={sessionController.setSessionLines}
          onSelectedLineIdChange={sessionController.setSelectedLineId}
          onSelectedLineDialogOpenIntentChange={sessionController.setSelectedLineDialogOpenIntent}
          mapFocusIntent={mapFocusIntent}
          onMapFocusIntentConsumed={setMapFocusIntent}
          onDebugSnapshotChange={handleMapDebugSnapshotChange}
          onOsmCandidateSelectionChange={sessionController.setSelectedOsmCandidateGroupId}
          osmStopCandidateGroups={osmStopCandidateGroups}
          onOsmCandidateAnchorResolved={setSelectedOsmCandidateAnchor}
          demandNodes={scenarioDemandNodes}
          activeTimeBandId={clockController.activeSimulationTimeBandId}
          demandCapturePreviewProjection={projections.demandCapturePreviewProjection}
        />

      </main>

      <InspectorPanel
        inspectorPanelState={inspectorPanelState}
        completedLines={sessionController.sessionLines}
        staticNetworkSummaryKpis={projections.staticNetworkSummaryKpis}
        networkServicePlanProjection={projections.networkServicePlanProjection}
        vehicleNetworkProjection={projections.vehicleNetworkProjection}
        selectedLineRouteBaseline={projections.selectedLineRouteBaseline}
        placedStops={sessionController.sessionStops}
        activeTimeBandId={clockController.activeSimulationTimeBandId}
        selectedLineServiceProjection={projections.selectedLineServiceProjection}
        selectedLineServiceInspectorProjection={projections.selectedLineServiceInspectorProjection}
        selectedLinePlanningVehicleProjection={projections.selectedLinePlanningVehicleProjection}
        selectedLineDemandProjection={projections.selectedLineDemandProjection}
        networkDemandProjection={projections.networkDemandProjection}
        lineFrequencyInputByTimeBand={sessionController.lineFrequencyInputByTimeBand}
        lineFrequencyControlByTimeBand={sessionController.lineFrequencyControlByTimeBand}
        lineFrequencyValidationByTimeBand={sessionController.lineFrequencyValidationByTimeBand}
        onFrequencyChange={sessionController.updateSelectedCompletedLineFrequency}
        onSelectedLineIdChange={handleLineInventorySelection}
        onStopSelectionChange={handleStopInventorySelection}
        onLineSequenceStopFocus={handleLineSequenceStopFocus}
        onStopRename={sessionController.renameStopLabel}
        onLineRename={sessionController.renameLineLabel}
        openDialogIntent={sessionController.selectedLineDialogOpenIntent}
        onOpenDialogIntentConsumed={sessionController.setSelectedLineDialogOpenIntent}
        onOsmCandidateAdopt={async (group, anchor) => {
          setActiveDataOperation({
            title: 'Adopting OSM stop',
            phase: 'Creating CityOps stop and refreshing map overlays...',
            progress: { kind: 'indeterminate' }
          });

          // Ensure the modal can paint before the main thread is occupied
          await new Promise((resolve) => requestAnimationFrame(resolve));

          sessionController.adoptOsmCandidateGroup(group, anchor);

          // Wait another frame to allow map source sync to process
          await new Promise((resolve) => requestAnimationFrame(resolve));

          setActiveDataOperation(null);
        }}
        osmStopCandidateGroups={osmStopCandidateGroups}
        selectedOsmCandidateAnchor={selectedOsmCandidateAnchor}
        adoptedOsmCandidateGroupIds={sessionController.adoptedOsmCandidateGroupIds}
      />

      <DebugModal
        open={isMapDebugModalOpen}
        onClose={() => setMapDebugModalOpen(false)}
        mapWorkspaceDebugSnapshot={mapWorkspaceDebugSnapshot}
        overviewDiagnostics={overviewDiagnostics}
        routingDiagnostics={routingDiagnostics}
        serviceDiagnostics={serviceDiagnostics}
        rawStateDiagnostics={{
          mapWorkspaceDebugSnapshot,
          overview: overviewDiagnostics,
          routing: routingDiagnostics,
          service: serviceDiagnostics
        }}
      />
    </AppShell>
  );
}
