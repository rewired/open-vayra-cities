import type { ReactElement } from 'react';

import { buildSelectedLineExportPayload } from './domain/types/selectedLineExport';
import { useNetworkPlanningProjections } from './domain/projection/useNetworkPlanningProjections';
import { InspectorPanel } from './inspector/InspectorPanel';
import type { InspectorPanelState } from './inspector/types';
import { MapWorkspaceSurface } from './map-workspace/MapWorkspaceSurface';
import { SelectedLineContextTray } from './map-workspace/SelectedLineContextTray';
import { SessionActions } from './session/SessionActions';
import { useNetworkSessionState } from './session/useNetworkSessionState';
import { SimulationControlBar } from './simulation/SimulationControlBar';
import { useSimulationClockController } from './simulation/useSimulationClockController';
import { MaterialIcon } from './ui/icons/MaterialIcon';
import { WORKSPACE_MODE_ICONS } from './ui/icons/materialIcons';

import './App.css';

const buildSelectedLineExportFilename = (lineId: string): string => `cityops-line-${lineId}.json`;

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
  selectedStop: ReturnType<typeof useNetworkSessionState>['selectedStop']
): InspectorPanelState => {
  if (selectedLine) {
    return {
      mode: 'line-selected',
      selectedLine
    };
  }

  if (selectedStop) {
    return {
      mode: 'stop-selected',
      selectedStop
    };
  }

  return {
    mode: 'empty'
  };
};

/** Renders the desktop-only CityOps application shell layout and composes extracted session/projection/inspector boundaries. */
export default function App(): ReactElement {
  const sessionController = useNetworkSessionState();
  const clockController = useSimulationClockController();

  const projections = useNetworkPlanningProjections(
    sessionController.sessionLines,
    sessionController.sessionStops,
    sessionController.selectedLine,
    clockController.activeSimulationTimeBandId,
    clockController.currentSimulationMinuteOfDay
  );
  const inspectorPanelState = resolveInspectorPanelState(
    sessionController.selectedLine,
    sessionController.selectedStop
  );
  const selectedCompletedLineForExport =
    inspectorPanelState.mode === 'line-selected'
      ? sessionController.sessionLines.find((line) => line.id === inspectorPanelState.selectedLine.id) ?? null
      : null;
  const toolModeControlOptions: ReadonlyArray<{
    readonly mode: 'inspect' | 'place-stop' | 'build-line';
    readonly shortLabel: string;
    readonly accessibleLabel: string;
  }> = [
    { mode: 'inspect', shortLabel: 'Inspect', accessibleLabel: 'Inspect workspace' },
    { mode: 'place-stop', shortLabel: 'STOP', accessibleLabel: 'Place stop tool' },
    { mode: 'build-line', shortLabel: 'LINE', accessibleLabel: 'Build line tool' }
  ];

  return (
    <div className="app-shell" data-app-surface="desktop-shell">
      <SimulationControlBar
        clockController={clockController}
        sessionActions={
          <SessionActions
            selectedLineImportFeedback={sessionController.selectedLineImportFeedback}
            hasSelectedLineForExport={selectedCompletedLineForExport !== null}
            onLoadStart={sessionController.clearSelectedLineImportFeedback}
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
                  source: 'cityops-web'
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
          lineBuildSelection={sessionController.lineBuildSelection}
          sessionLines={sessionController.sessionLines}
          selectedLineId={sessionController.selectedLineId}
          vehicleNetworkProjection={projections.vehicleNetworkProjection}
          onPlacedStopsChange={sessionController.setSessionStops}
          onStopSelectionChange={sessionController.setSelectedStop}
          onLineBuildSelectionChange={sessionController.setLineBuildSelection}
          onSessionLinesChange={sessionController.setSessionLines}
          onSelectedLineIdChange={sessionController.setSelectedLineId}
        />
        {selectedCompletedLineForExport ? (
          <SelectedLineContextTray
            selectedLine={selectedCompletedLineForExport}
            selectedLineDepartureInspectorProjection={projections.selectedLineDepartureInspectorProjection}
            selectedLineVehicleProjection={projections.selectedLineVehicleProjection}
          />
        ) : null}
      </main>

      <InspectorPanel
        activeToolMode={sessionController.activeToolMode}
        inspectorPanelState={inspectorPanelState}
        staticNetworkSummaryKpis={projections.staticNetworkSummaryKpis}
        networkServicePlanProjection={projections.networkServicePlanProjection}
        vehicleNetworkProjection={projections.vehicleNetworkProjection}
        selectedLineRouteBaselineMetrics={projections.selectedLineRouteBaselineMetrics}
        selectedLineServiceProjection={projections.selectedLineServiceProjection}
        selectedLineServiceInspectorProjection={projections.selectedLineServiceInspectorProjection}
        selectedLineDepartureInspectorProjection={projections.selectedLineDepartureInspectorProjection}
        selectedLineVehicleProjection={projections.selectedLineVehicleProjection}
        lineFrequencyInputByTimeBand={sessionController.lineFrequencyInputByTimeBand}
        lineFrequencyValidationByTimeBand={sessionController.lineFrequencyValidationByTimeBand}
        onFrequencyChange={sessionController.updateSelectedCompletedLineFrequency}
      />
    </div>
  );
}
