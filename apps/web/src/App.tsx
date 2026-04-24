import { useEffect, useRef, useState, type ReactElement } from 'react';

import { MVP_TIME_BAND_IDS, TIME_BAND_DISPLAY_LABELS } from './domain/constants/timeBands';
import {
  projectLineDepartureScheduleForLine,
  projectLineSelectedDepartureInspector
} from './domain/projection/lineDepartureScheduleProjection';
import {
  projectLineSelectedServiceInspector,
  projectLineServicePlan,
  projectLineServicePlanForLine
} from './domain/projection/lineServicePlanProjection';
import {
  applySimulationClockCommand,
  createInitialSimulationClockState,
  deriveTimeBandIdFromMinuteOfDay,
  formatSimulationMinuteOfDay,
  formatSimulationRunningStateLabel,
  parseSimulationSpeedId
} from './domain/simulation/simulationClock';
import { createLineFrequencyMinutes, type Line } from './domain/types/line';
import type { LineRouteSegment, RouteStatus } from './domain/types/lineRoute';
import { buildSelectedLineExportPayload } from './domain/types/selectedLineExport';
import type { SimulationSpeedId } from './domain/types/simulationClock';
import type { Stop, StopId } from './domain/types/stop';
import type { TimeBandId } from './domain/types/timeBand';
import { SIMULATION_SPEED_DEFINITIONS } from './domain/constants/simulationClock';
import {
  MapWorkspaceSurface,
  type StopSelectionState
} from './map-workspace/MapWorkspaceSurface';
import { MaterialIcon } from './ui/icons/MaterialIcon';
import { WORKSPACE_MODE_ICONS } from './ui/icons/materialIcons';

import './App.css';

/**
 * Defines the workspace tool modes available in the desktop shell.
 */
export type WorkspaceToolMode = 'inspect' | 'place-stop' | 'build-line';

/**
 * Carries the active line-building draft selection as an ordered stop-id list.
 */
export interface LineBuildSelectionState {
  readonly selectedStopIds: readonly StopId[];
}

/**
 * Carries the currently selected completed line for structural inspector rendering.
 */
export interface LineSelectionState {
  readonly selectedLine: Line | null;
}

type LineFrequencyInputByTimeBand = Readonly<Record<TimeBandId, string>>;

type LineFrequencyValidationByTimeBand = Readonly<Record<TimeBandId, string | null>>;

interface SelectedLineStructureSummary {
  readonly stopCount: number;
  readonly configuredTimeBandCount: number;
  readonly unconfiguredTimeBandCount: number;
}

interface StaticNetworkSummaryKpis {
  readonly totalStopCount: number;
  readonly completedLineCount: number;
  readonly selectedCompletedLine: SelectedLineStructureSummary | null;
}

interface RouteBaselineAggregateMetrics {
  readonly segmentCount: number;
  readonly totalDistanceMeters: number;
  readonly totalInMotionMinutes: number;
  readonly totalDwellMinutes: number;
  readonly totalLineMinutes: number;
  readonly hasFallbackSegments: boolean;
}

const MAX_READINESS_ISSUES_VISIBLE = 5;
const MAX_UPCOMING_DEPARTURES_VISIBLE = 5;

/**
 * Enumerates the inspector's mutually exclusive visual states.
 */
export type InspectorPanelMode = 'line-selected' | 'stop-selected' | 'empty';

/**
 * Carries inspector data when a completed line is the active selection context.
 */
export interface LineSelectedInspectorPanelState {
  readonly mode: 'line-selected';
  readonly selectedLine: Line;
}

/**
 * Carries inspector data when a stop is the active selection context.
 */
export interface StopSelectedInspectorPanelState {
  readonly mode: 'stop-selected';
  readonly selectedStop: StopSelectionState;
}

/**
 * Carries inspector data when neither a line nor stop is selected.
 */
export interface EmptyInspectorPanelState {
  readonly mode: 'empty';
}

/**
 * Represents the resolved inspector view model after applying selection priority rules.
 */
export type InspectorPanelState =
  | LineSelectedInspectorPanelState
  | StopSelectedInspectorPanelState
  | EmptyInspectorPanelState;

const INITIAL_LINE_BUILD_SELECTION_STATE: LineBuildSelectionState = {
  selectedStopIds: []
};

const createEmptyLineFrequencyInputByTimeBand = (): LineFrequencyInputByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, ''])) as LineFrequencyInputByTimeBand;

const createEmptyLineFrequencyValidationByTimeBand = (): LineFrequencyValidationByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, null])) as LineFrequencyValidationByTimeBand;

const ROUTE_STATUS_LABELS: Readonly<Record<RouteStatus, string>> = {
  'not-routed': 'Not routed',
  routed: 'Routed',
  'fallback-routed': 'Fallback routed',
  'routing-failed': 'Routing failed'
};

const formatDistanceMeters = (distanceMeters: number): string => `${distanceMeters.toFixed(0)} m`;

const formatTravelMinutes = (travelMinutes: number): string => `${travelMinutes.toFixed(2)} min`;

const buildSelectedLineExportFilename = (lineId: Line['id']): string => `cityops-line-${lineId}.json`;

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

const projectRouteBaselineAggregateMetrics = (
  routeSegments: readonly LineRouteSegment[]
): RouteBaselineAggregateMetrics => ({
  segmentCount: routeSegments.length,
  totalDistanceMeters: routeSegments.reduce((sum, segment) => sum + segment.distanceMeters, 0),
  totalInMotionMinutes: routeSegments.reduce((sum, segment) => sum + segment.inMotionTravelMinutes, 0),
  totalDwellMinutes: routeSegments.reduce((sum, segment) => sum + segment.dwellMinutes, 0),
  totalLineMinutes: routeSegments.reduce((sum, segment) => sum + segment.totalTravelMinutes, 0),
  hasFallbackSegments: routeSegments.some((segment) => segment.status === 'fallback-routed')
});

/**
 * Resolves the inspector panel state with explicit selection priority:
 * selected line first, then selected stop, else neutral empty state.
 */
function resolveInspectorPanelState(
  selectedLine: Line | null,
  selectedStop: StopSelectionState | null
): InspectorPanelState {
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
}

/**
 * Projects a minimal structural-only network KPI summary from current in-memory planning state.
 */
function projectStaticNetworkSummaryKpis(
  totalStopCount: number,
  sessionLines: readonly Line[],
  selectedLine: Line | null
): StaticNetworkSummaryKpis {
  if (!selectedLine) {
    return {
      totalStopCount,
      completedLineCount: sessionLines.length,
      selectedCompletedLine: null
    };
  }

  const configuredTimeBandCount = MVP_TIME_BAND_IDS.filter((timeBandId) => {
    const frequencyValue = selectedLine.frequencyByTimeBand[timeBandId];
    return frequencyValue !== null && frequencyValue !== undefined;
  }).length;

  return {
    totalStopCount,
    completedLineCount: sessionLines.length,
    selectedCompletedLine: {
      stopCount: selectedLine.stopIds.length,
      configuredTimeBandCount,
      unconfiguredTimeBandCount: MVP_TIME_BAND_IDS.length - configuredTimeBandCount
    }
  };
}

/**
 * Renders the initial desktop-only CityOps application shell layout.
 */
export default function App(): ReactElement {
  const [activeToolMode, setActiveToolMode] = useState<WorkspaceToolMode>('inspect');
  const [sessionStops, setSessionStops] = useState<readonly Stop[]>([]);
  const [selectedStop, setSelectedStop] = useState<StopSelectionState | null>(null);
  const [lineBuildSelection, setLineBuildSelection] =
    useState<LineBuildSelectionState>(INITIAL_LINE_BUILD_SELECTION_STATE);
  const [sessionLines, setSessionLines] = useState<readonly Line[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<Line['id'] | null>(null);
  const [lineFrequencyInputByTimeBand, setLineFrequencyInputByTimeBand] =
    useState<LineFrequencyInputByTimeBand>(createEmptyLineFrequencyInputByTimeBand);
  const [lineFrequencyValidationByTimeBand, setLineFrequencyValidationByTimeBand] =
    useState<LineFrequencyValidationByTimeBand>(createEmptyLineFrequencyValidationByTimeBand);
  const [simulationClockState, setSimulationClockState] = useState(createInitialSimulationClockState);
  const lastClockTickRealMillisecondsRef = useRef<number | null>(null);

  const handleToolModeSelection = (nextMode: WorkspaceToolMode): void => {
    setActiveToolMode(nextMode);

    if (nextMode !== 'build-line') {
      setLineBuildSelection(INITIAL_LINE_BUILD_SELECTION_STATE);
    }
  };

  const selectedLine = sessionLines.find((line) => line.id === selectedLineId) ?? null;
  const activeSimulationTimeBandId = deriveTimeBandIdFromMinuteOfDay(
    simulationClockState.timestamp.minuteOfDay
  );
  const selectedStopId: StopId | null = selectedStop?.selectedStopId ?? null;
  const inspectorPanelState = resolveInspectorPanelState(selectedLine, selectedStop);
  const staticNetworkSummaryKpis = projectStaticNetworkSummaryKpis(
    sessionStops.length,
    sessionLines,
    selectedLine
  );
  const selectedLineRouteBaselineMetrics = selectedLine
    ? projectRouteBaselineAggregateMetrics(selectedLine.routeSegments)
    : null;
  const selectedLineServiceProjection = selectedLine
    ? projectLineServicePlanForLine(selectedLine, sessionStops, activeSimulationTimeBandId)
    : null;
  const selectedLineDepartureProjection = selectedLine
    ? projectLineDepartureScheduleForLine(
        selectedLine,
        sessionStops,
        activeSimulationTimeBandId,
        simulationClockState.timestamp.minuteOfDay
      )
    : null;
  const networkServicePlanProjection = projectLineServicePlan(
    sessionLines,
    sessionStops,
    activeSimulationTimeBandId
  );
  const selectedLineServiceInspectorProjection = selectedLineServiceProjection
    ? projectLineSelectedServiceInspector(selectedLineServiceProjection, MAX_READINESS_ISSUES_VISIBLE)
    : null;
  const selectedLineDepartureInspectorProjection = selectedLineDepartureProjection
    ? projectLineSelectedDepartureInspector(
        selectedLineDepartureProjection,
        MAX_UPCOMING_DEPARTURES_VISIBLE,
        MAX_READINESS_ISSUES_VISIBLE
      )
    : null;
  const selectedCompletedLineForExport =
    inspectorPanelState.mode === 'line-selected'
      ? sessionLines.find((line) => line.id === inspectorPanelState.selectedLine.id) ?? null
      : null;

  useEffect(() => {
    if (!selectedLine) {
      setLineFrequencyInputByTimeBand(createEmptyLineFrequencyInputByTimeBand());
      setLineFrequencyValidationByTimeBand(createEmptyLineFrequencyValidationByTimeBand());
      return;
    }

    setLineFrequencyInputByTimeBand(
      Object.fromEntries(
        MVP_TIME_BAND_IDS.map((timeBandId) => [
          timeBandId,
          selectedLine.frequencyByTimeBand[timeBandId] === null ||
          selectedLine.frequencyByTimeBand[timeBandId] === undefined
            ? ''
            : String(selectedLine.frequencyByTimeBand[timeBandId])
        ])
      ) as LineFrequencyInputByTimeBand
    );
    setLineFrequencyValidationByTimeBand(createEmptyLineFrequencyValidationByTimeBand());
  }, [selectedLine]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nowMilliseconds = performance.now();
      const previousTick = lastClockTickRealMillisecondsRef.current;
      lastClockTickRealMillisecondsRef.current = nowMilliseconds;

      if (previousTick === null) {
        return;
      }

      const elapsedRealMilliseconds = nowMilliseconds - previousTick;
      setSimulationClockState((currentClockState) =>
        applySimulationClockCommand(currentClockState, {
          type: 'advance-elapsed',
          elapsedRealMilliseconds
        }).nextState
      );
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const updateSelectedCompletedLineFrequency = (
    timeBandId: TimeBandId,
    rawInputValue: string
  ): void => {
    setLineFrequencyInputByTimeBand((currentInputs) => ({
      ...currentInputs,
      [timeBandId]: rawInputValue
    }));

    if (!selectedLine) {
      return;
    }

    const trimmedValue = rawInputValue.trim();
    if (trimmedValue.length === 0) {
      setLineFrequencyValidationByTimeBand((currentValidation) => ({
        ...currentValidation,
        [timeBandId]: null
      }));
      setSessionLines((currentLines) =>
        currentLines.map((line) =>
          line.id === selectedLine.id
            ? {
                ...line,
                frequencyByTimeBand: {
                  ...line.frequencyByTimeBand,
                  [timeBandId]: null
                }
              }
            : line
        )
      );
      return;
    }

    const parsedFrequencyMinutes = Number(trimmedValue);
    if (!Number.isFinite(parsedFrequencyMinutes) || parsedFrequencyMinutes <= 0) {
      setLineFrequencyValidationByTimeBand((currentValidation) => ({
        ...currentValidation,
        [timeBandId]: 'Enter a positive minute interval.'
      }));
      return;
    }

    setLineFrequencyValidationByTimeBand((currentValidation) => ({
      ...currentValidation,
      [timeBandId]: null
    }));
    setSessionLines((currentLines) =>
      currentLines.map((line) =>
        line.id === selectedLine.id
          ? {
              ...line,
              frequencyByTimeBand: {
                ...line.frequencyByTimeBand,
                [timeBandId]: createLineFrequencyMinutes(parsedFrequencyMinutes)
              }
            }
          : line
      )
    );
  };

  const handleSelectedLineExport = (): void => {
    if (!selectedCompletedLineForExport) {
      return;
    }

    const exportPayload = buildSelectedLineExportPayload({
      selectedLine: selectedCompletedLineForExport,
      placedStops: sessionStops,
      createdAtIsoUtc: new Date().toISOString(),
      sourceMetadata: {
        source: 'cityops-web'
      }
    });

    downloadJsonFile(
      buildSelectedLineExportFilename(selectedCompletedLineForExport.id),
      exportPayload
    );
  };

  const handlePauseClock = (): void => {
    setSimulationClockState((currentClockState) =>
      applySimulationClockCommand(currentClockState, { type: 'pause' }).nextState
    );
  };

  const handleResumeClock = (): void => {
    setSimulationClockState((currentClockState) =>
      applySimulationClockCommand(currentClockState, { type: 'resume' }).nextState
    );
  };

  const handleResetClock = (): void => {
    setSimulationClockState((currentClockState) =>
      applySimulationClockCommand(currentClockState, { type: 'reset' }).nextState
    );
  };

  const handleSpeedSelection = (speedId: SimulationSpeedId): void => {
    setSimulationClockState((currentClockState) =>
      applySimulationClockCommand(currentClockState, {
        type: 'set-speed',
        speedId
      }).nextState
    );
  };

  return (
    <div className="app-shell" data-app-surface="desktop-shell">
      <header className="app-header" aria-label="Application header">
        <h1>CityOps</h1>
        <p>Desktop transit planning shell (bus-first MVP).</p>
      </header>

      <aside className="left-panel" aria-label="Tools and navigation panel">
        <h2>Tools</h2>
        <div className="tool-mode-control" aria-label="Active workspace tool">
          <p>Current mode: {activeToolMode}</p>
          <div className="tool-mode-control__button-row" role="group" aria-label="Workspace mode selection">
            <button
              type="button"
              className="tool-mode-control__button"
              aria-pressed={activeToolMode === 'inspect'}
              onClick={() => {
                handleToolModeSelection('inspect');
              }}
            >
              <MaterialIcon name={WORKSPACE_MODE_ICONS.inspect} />
              <span>Inspect</span>
            </button>
            <button
              type="button"
              className="tool-mode-control__button"
              aria-pressed={activeToolMode === 'place-stop'}
              onClick={() => {
                handleToolModeSelection('place-stop');
              }}
            >
              <MaterialIcon name={WORKSPACE_MODE_ICONS['place-stop']} />
              <span>Place stop</span>
            </button>
            <button
              type="button"
              className="tool-mode-control__button"
              aria-pressed={activeToolMode === 'build-line'}
              onClick={() => {
                handleToolModeSelection('build-line');
              }}
            >
              <MaterialIcon name={WORKSPACE_MODE_ICONS['build-line']} />
              <span>Build line</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="workspace" aria-label="Main workspace">
        <MapWorkspaceSurface
          activeToolMode={activeToolMode}
          selectedStopId={selectedStopId}
          placedStops={sessionStops}
          lineBuildSelection={lineBuildSelection}
          sessionLines={sessionLines}
          selectedLineId={selectedLineId}
          onPlacedStopsChange={setSessionStops}
          onStopSelectionChange={setSelectedStop}
          onLineBuildSelectionChange={setLineBuildSelection}
          onSessionLinesChange={setSessionLines}
          onSelectedLineIdChange={setSelectedLineId}
        />
      </main>

      <aside className="right-panel" aria-label="Inspector panel">
        <h2>Inspector</h2>
        <p>Active mode: {activeToolMode}</p>
        <section className="inspector-network-summary" aria-label="Static network summary">
          <h3>Static network summary</h3>
          <p>Total stops: {staticNetworkSummaryKpis.totalStopCount}</p>
          <p>Completed lines: {staticNetworkSummaryKpis.completedLineCount}</p>
          <div>
            <p>Active service time band: {TIME_BAND_DISPLAY_LABELS[networkServicePlanProjection.summary.activeTimeBandId]}</p>
            <p>Total completed lines (service): {networkServicePlanProjection.summary.totalCompletedLineCount}</p>
            <p>Configured lines: {networkServicePlanProjection.summary.configuredLineCount}</p>
            <p>Degraded lines: {networkServicePlanProjection.summary.degradedLineCount}</p>
            <p>Not configured lines: {networkServicePlanProjection.summary.notConfiguredLineCount}</p>
            <p>Blocked lines: {networkServicePlanProjection.summary.blockedLineCount}</p>
          </div>
          {staticNetworkSummaryKpis.selectedCompletedLine ? (
            <div>
              <p>Selected line stops: {staticNetworkSummaryKpis.selectedCompletedLine.stopCount}</p>
              <p>Configured time bands: {staticNetworkSummaryKpis.selectedCompletedLine.configuredTimeBandCount}</p>
              <p>Unconfigured time bands: {staticNetworkSummaryKpis.selectedCompletedLine.unconfiguredTimeBandCount}</p>
            </div>
          ) : (
            <p>Selected completed line: none</p>
          )}
        </section>
        <p>MVP time bands: {MVP_TIME_BAND_IDS.map((timeBandId) => TIME_BAND_DISPLAY_LABELS[timeBandId]).join(', ')}</p>
        {inspectorPanelState.mode === 'line-selected' ? (
          <div>
            <p>Selected line</p>
            <p>ID/Label: {`${inspectorPanelState.selectedLine.id} / ${inspectorPanelState.selectedLine.label}`}</p>
            <p>Stop count: {inspectorPanelState.selectedLine.stopIds.length}</p>
            <p>Ordered stops: {inspectorPanelState.selectedLine.stopIds.join(' → ')}</p>
            {selectedLineServiceInspectorProjection ? (
              <section className="inspector-line-service-plan" aria-label="Line service plan">
                <h3>Line service plan</h3>
                <p>Active time band: {selectedLineServiceInspectorProjection.activeTimeBandLabel}</p>
                <p>Current service status: {selectedLineServiceInspectorProjection.statusLabel}</p>
                <p>Configured headway: {selectedLineServiceInspectorProjection.headwayLabel}</p>
                {selectedLineServiceInspectorProjection.theoreticalDeparturesPerHourLabel ? (
                  <p>
                    Theoretical departures/hour:{' '}
                    {selectedLineServiceInspectorProjection.theoreticalDeparturesPerHourLabel}
                  </p>
                ) : null}
                <p>Total stored route time: {selectedLineServiceInspectorProjection.totalRouteTravelMinutesLabel}</p>
                <p>Route segment count: {selectedLineServiceInspectorProjection.routeSegmentCount}</p>
                <p>Blocker issues: {selectedLineServiceInspectorProjection.blockerCount}</p>
                <p>Warning issues: {selectedLineServiceInspectorProjection.warningCount}</p>
                {selectedLineServiceInspectorProjection.noteMessages.length > 0 ? (
                  <ul className="inspector-line-readiness__issues">
                    {selectedLineServiceInspectorProjection.noteMessages.map((message, index) => (
                      <li key={`line-service-note-${index}`}>{message}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No service notes.</p>
                )}
              </section>
            ) : null}
            {selectedLineDepartureInspectorProjection ? (
              <section className="inspector-line-departure-schedule" aria-label="Line departure schedule">
                <h3>Line departure schedule</h3>
                <p>Active time band: {selectedLineDepartureInspectorProjection.activeTimeBandLabel}</p>
                <p>Departure projection status: {selectedLineDepartureInspectorProjection.statusLabel}</p>
                <p>Configured headway: {selectedLineDepartureInspectorProjection.headwayLabel}</p>
                <p>Departures in active band: {selectedLineDepartureInspectorProjection.departureCount}</p>
                {selectedLineDepartureInspectorProjection.nextDepartureLabel ? (
                  <p>Next departure: {selectedLineDepartureInspectorProjection.nextDepartureLabel}</p>
                ) : (
                  <p>No next departure in the active time band.</p>
                )}
                {selectedLineDepartureInspectorProjection.minutesUntilNextDepartureLabel ? (
                  <p>
                    Minutes until next departure:{' '}
                    {selectedLineDepartureInspectorProjection.minutesUntilNextDepartureLabel}
                  </p>
                ) : null}
                {selectedLineDepartureInspectorProjection.previousDepartureLabel ? (
                  <p>Previous departure: {selectedLineDepartureInspectorProjection.previousDepartureLabel}</p>
                ) : null}
                {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.length > 0 ? (
                  <p>
                    Upcoming departures:{' '}
                    {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.join(', ')}
                  </p>
                ) : (
                  <p>No departure raster available for the active time band.</p>
                )}
              </section>
            ) : null}
            {selectedLineServiceProjection ? (
              <section className="inspector-line-readiness" aria-label="Line readiness">
                <h3>Line readiness</h3>
                <p>Status: {selectedLineServiceProjection.readiness.status}</p>
                <p>Configured time bands: {selectedLineServiceProjection.readiness.summary.configuredTimeBandCount}</p>
                <p>
                  Missing/unset time bands:{' '}
                  {selectedLineServiceProjection.readiness.summary.canonicalTimeBandCount -
                    selectedLineServiceProjection.readiness.summary.configuredTimeBandCount}
                </p>
                <p>Route segments: {selectedLineServiceProjection.readiness.summary.routeSegmentCount}</p>
                <p>Blocker issues: {selectedLineServiceProjection.readiness.summary.errorIssueCount}</p>
                <p>Warning issues: {selectedLineServiceProjection.readiness.summary.warningIssueCount}</p>
                {selectedLineServiceProjection.readiness.issues.length > 0 ? (
                  <ul className="inspector-line-readiness__issues">
                    {selectedLineServiceProjection.readiness.issues
                      .slice(0, MAX_READINESS_ISSUES_VISIBLE)
                      .map((issue, index) => (
                      <li key={`${issue.code}-${index}`}>
                        <span>{issue.message}</span>{' '}
                        {issue.code ? <code className="inspector-line-readiness__code">{issue.code}</code> : null}
                      </li>
                      ))}
                  </ul>
                ) : (
                  <p>No readiness issues.</p>
                )}
              </section>
            ) : null}
            {selectedCompletedLineForExport ? (
              <button type="button" onClick={handleSelectedLineExport}>
                Export line JSON
              </button>
            ) : null}
            <section className="inspector-route-baseline" aria-label="Route baseline">
              <h3>Route baseline</h3>
              <div className="inspector-route-baseline__totals">
                <p>Segment count: {selectedLineRouteBaselineMetrics?.segmentCount ?? 0}</p>
                <p>
                  Total distance:{' '}
                  {formatDistanceMeters(selectedLineRouteBaselineMetrics?.totalDistanceMeters ?? 0)}
                </p>
                <p>
                  Total in-motion time:{' '}
                  {formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalInMotionMinutes ?? 0)}
                </p>
                <p>
                  Total dwell time:{' '}
                  {formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalDwellMinutes ?? 0)}
                </p>
                <p>Total line time: {formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalLineMinutes ?? 0)}</p>
              </div>
              {selectedLineRouteBaselineMetrics?.hasFallbackSegments ? (
                <p className="inspector-route-baseline__fallback-note">
                  Fallback routed segments detected. Values are baseline fallback outputs and are not accuracy
                  claims.
                </p>
              ) : null}
              {inspectorPanelState.selectedLine.routeSegments.length > 0 ? (
                <table className="inspector-route-baseline__segment-table">
                  <thead>
                    <tr>
                      <th scope="col">From</th>
                      <th scope="col">To</th>
                      <th scope="col">Distance</th>
                      <th scope="col">In-motion</th>
                      <th scope="col">Dwell</th>
                      <th scope="col">Line time</th>
                      <th scope="col">Route status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectorPanelState.selectedLine.routeSegments.map((segment) => (
                      <tr key={segment.id}>
                        <td>{segment.fromStopId}</td>
                        <td>{segment.toStopId}</td>
                        <td>{formatDistanceMeters(segment.distanceMeters)}</td>
                        <td>{formatTravelMinutes(segment.inMotionTravelMinutes)}</td>
                        <td>{formatTravelMinutes(segment.dwellMinutes)}</td>
                        <td>{formatTravelMinutes(segment.totalTravelMinutes)}</td>
                        <td>{ROUTE_STATUS_LABELS[segment.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No route segments available.</p>
              )}
            </section>
            <div className="inspector-frequency-editor">
              {MVP_TIME_BAND_IDS.map((timeBandId) => (
                <label key={timeBandId} className="inspector-frequency-editor__row">
                  <span>{TIME_BAND_DISPLAY_LABELS[timeBandId]} interval (minutes)</span>
                  <input
                    type="number"
                    min={1}
                    value={lineFrequencyInputByTimeBand[timeBandId] ?? ''}
                    onChange={(event) => {
                      updateSelectedCompletedLineFrequency(timeBandId, event.currentTarget.value);
                    }}
                  />
                  {lineFrequencyValidationByTimeBand[timeBandId] ? (
                    <span className="inspector-frequency-editor__error">
                      {lineFrequencyValidationByTimeBand[timeBandId]}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {inspectorPanelState.mode === 'stop-selected' ? (
          <div>
            <p>Selected stop</p>
            <p>ID: {inspectorPanelState.selectedStop.selectedStopId}</p>
          </div>
        ) : null}

        {inspectorPanelState.mode === 'empty' ? <p>No stop or line selected.</p> : null}
      </aside>

      <footer className="status-bar" aria-label="Status bar">
        <div className="status-bar__clock-readout">
          <span>Status: {formatSimulationRunningStateLabel(simulationClockState.runningState)}</span>
          <span>Day {simulationClockState.timestamp.dayIndex}</span>
          <span>Time {formatSimulationMinuteOfDay(simulationClockState.timestamp.minuteOfDay)}</span>
          <span>Band {TIME_BAND_DISPLAY_LABELS[activeSimulationTimeBandId]}</span>
        </div>
        <div className="status-bar__clock-controls" role="group" aria-label="Simulation clock controls">
          <button
            type="button"
            className="status-bar__button"
            onClick={handlePauseClock}
            disabled={simulationClockState.runningState === 'paused'}
          >
            Pause
          </button>
          <button
            type="button"
            className="status-bar__button"
            onClick={handleResumeClock}
            disabled={simulationClockState.runningState === 'running'}
          >
            Resume
          </button>
          <div className="status-bar__speed-group" role="group" aria-label="Simulation speed selection">
            {SIMULATION_SPEED_DEFINITIONS.map((speedDefinition) => (
              <button
                key={speedDefinition.id}
                type="button"
                className="status-bar__button"
                aria-pressed={simulationClockState.speedId === speedDefinition.id}
                onClick={() => {
                  const parsedSpeedId = parseSimulationSpeedId(speedDefinition.id);
                  if (!parsedSpeedId) {
                    return;
                  }

                  handleSpeedSelection(parsedSpeedId);
                }}
              >
                {speedDefinition.label}
              </button>
            ))}
          </div>
          <button type="button" className="status-bar__button" onClick={handleResetClock}>
            Reset
          </button>
        </div>
        {selectedLine ? (
          <div className="status-bar__line-frequency-hint">
            <span>Selected line service plan:</span>
            <span>{selectedLineServiceInspectorProjection?.headwayLabel ?? 'No line selected.'}</span>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
