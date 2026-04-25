import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import type { Line } from '../domain/types/line';
import { SelectedLineInspector } from './SelectedLineInspector';
import { INSPECTOR_TAB_IDS, INSPECTOR_TAB_LABELS, type InspectorTabId } from './inspectorTabs';
import type { InspectorPanelState } from './types';
import type {
  LineFrequencyControlByTimeBand,
  LineFrequencyInputByTimeBand,
  LineFrequencyValidationByTimeBand,
  SelectedLineFrequencyUpdateAction
} from '../session/useNetworkSessionState';
import type { TimeBandId } from '../domain/types/timeBand';

interface InspectorPanelProps {
  readonly inspectorPanelState: InspectorPanelState;
  readonly completedLines: readonly Line[];
  readonly staticNetworkSummaryKpis: import('../domain/projection/useNetworkPlanningProjections').StaticNetworkSummaryKpis;
  readonly networkServicePlanProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlan>;
  readonly vehicleNetworkProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>;
  readonly selectedLineRouteBaselineMetrics: import('../domain/projection/useNetworkPlanningProjections').RouteBaselineAggregateMetrics | null;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
  readonly selectedLineDepartureInspectorProjection: ReturnType<typeof import('../domain/projection/lineDepartureScheduleProjection').projectLineSelectedDepartureInspector> | null;
  readonly selectedLineVehicleProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>['lines'][number] | null;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyControlByTimeBand: LineFrequencyControlByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly onFrequencyChange: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
  readonly onSelectedLineIdChange: (lineId: Line['id']) => void;
}

const resolveGlobalStateLabel = (panelState: InspectorPanelState): string => {
  if (panelState.mode === 'line-selected') {
    return `Line selected (${panelState.selectedLine.id})`;
  }

  if (panelState.mode === 'stop-selected') {
    return `Stop selected (${panelState.selectedStop.selectedStopId})`;
  }

  return 'No active line or stop selection';
};

/** Renders inspector tab sections while keeping projection usage read-only and selection-specific details delegated to child components. */
export function InspectorPanel({
  inspectorPanelState,
  completedLines,
  staticNetworkSummaryKpis,
  networkServicePlanProjection,
  vehicleNetworkProjection,
  selectedLineRouteBaselineMetrics,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection,
  selectedLineDepartureInspectorProjection,
  selectedLineVehicleProjection,
  lineFrequencyInputByTimeBand,
  lineFrequencyControlByTimeBand,
  lineFrequencyValidationByTimeBand,
  onFrequencyChange,
  onSelectedLineIdChange
}: InspectorPanelProps): ReactElement {
  const [activeTabId, setActiveTabId] = useState<InspectorTabId>('network');
  const [linesViewMode, setLinesViewMode] = useState<'list' | 'detail'>('list');
  const globalStateLabel = useMemo(() => resolveGlobalStateLabel(inspectorPanelState), [inspectorPanelState]);

  useEffect(() => {
    if (linesViewMode === 'detail' && inspectorPanelState.mode !== 'line-selected') {
      setLinesViewMode('list');
    }
  }, [inspectorPanelState.mode, linesViewMode]);

  return (
    <aside className="right-panel" aria-label="Inspector panel">
      <h2>Inspector</h2>

      <nav className="inspector-tabs" aria-label="Inspector tabs" role="tablist">
        {INSPECTOR_TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={activeTabId === tabId}
            className="inspector-tabs__button"
            onClick={() => {
              setActiveTabId(tabId);
            }}
          >
            {INSPECTOR_TAB_LABELS[tabId]}
          </button>
        ))}
      </nav>

      {activeTabId === 'network' ? (
        <section className="inspector-network-summary" aria-label="Network">
          <h3>Network</h3>
          <table className="inspector-compact-table inspector-network-summary__primary-table">
            <tbody>
              <tr>
                <th scope="row">Stops</th>
                <td>{staticNetworkSummaryKpis.totalStopCount}</td>
              </tr>
              <tr>
                <th scope="row">Completed lines</th>
                <td>{staticNetworkSummaryKpis.completedLineCount}</td>
              </tr>
              <tr>
                <th scope="row">Projected vehicles</th>
                <td>{vehicleNetworkProjection.summary.totalProjectedVehicleCount}</td>
              </tr>
              <tr>
                <th scope="row">Active service band</th>
                <td>{TIME_BAND_DISPLAY_LABELS[networkServicePlanProjection.summary.activeTimeBandId]}</td>
              </tr>
              <tr>
                <th scope="row">Global state</th>
                <td>{globalStateLabel}</td>
              </tr>
              <tr>
                <th scope="row">Degraded service lines</th>
                <td>{networkServicePlanProjection.summary.degradedLineCount}</td>
              </tr>
              <tr>
                <th scope="row">Blocked service lines</th>
                <td>{networkServicePlanProjection.summary.blockedLineCount}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      {activeTabId === 'lines' ? (
        <section className="inspector-card inspector-lines-tab" aria-label="Lines">
          <h3>Lines</h3>
          {linesViewMode === 'list' ? (
            completedLines.length > 0 ? (
              <ul className="inspector-simple-list inspector-lines-tab__list" aria-label="Completed line list">
                {completedLines.map((line) => (
                  <li key={line.id} className="inspector-lines-tab__list-item">
                    <span>{`${line.id} · ${line.label}`}</span>
                    <button
                      type="button"
                      className="inspector-lines-tab__action"
                      onClick={() => {
                        onSelectedLineIdChange(line.id);
                        setLinesViewMode('detail');
                      }}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No completed lines.</p>
            )
          ) : (
            <>
              <button
                type="button"
                className="inspector-lines-tab__back"
                onClick={() => {
                  setLinesViewMode('list');
                }}
              >
                Back to completed lines
              </button>
              {inspectorPanelState.mode === 'line-selected' ? (
                <SelectedLineInspector
                  panelState={inspectorPanelState}
                  selectedLineRouteBaselineMetrics={selectedLineRouteBaselineMetrics}
                  lineFrequencyInputByTimeBand={lineFrequencyInputByTimeBand}
                  lineFrequencyControlByTimeBand={lineFrequencyControlByTimeBand}
                  lineFrequencyValidationByTimeBand={lineFrequencyValidationByTimeBand}
                  selectedLineServiceProjection={selectedLineServiceProjection}
                  selectedLineServiceInspectorProjection={selectedLineServiceInspectorProjection}
                  selectedLineDepartureInspectorProjection={selectedLineDepartureInspectorProjection}
                  selectedLineVehicleProjection={selectedLineVehicleProjection}
                  onFrequencyChange={onFrequencyChange}
                />
              ) : (
                <p>Select a completed line from the list to open detail.</p>
              )}
            </>
          )}
        </section>
      ) : null}

    </aside>
  );
}
