import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import type { Line } from '../domain/types/line';
import { SelectedLineInspector } from './SelectedLineInspector';
import { NetworkInventory } from './NetworkInventory';
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
  readonly selectedLineRouteBaseline: import('../domain/types/routeBaseline').LineRouteBaseline | null;
  readonly placedStops: readonly import('../domain/types/stop').Stop[];
  readonly activeTimeBandId: TimeBandId;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
  readonly selectedLinePlanningVehicleProjection: ReturnType<typeof import('../domain/projection/linePlanningVehicleProjection').projectLinePlanningVehicles> | null;
  readonly selectedLineDemandProjection: import('../domain/demand/servedDemandProjection').LineBandDemandProjection | null;
  readonly networkDemandProjection: import('../domain/projection/demandCatchmentProjection').NetworkDemandProjection;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyControlByTimeBand: LineFrequencyControlByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly onFrequencyChange: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
  readonly onSelectedLineIdChange: (lineId: Line['id']) => void;
  readonly onStopSelectionChange: (stopId: import('../domain/types/stop').StopId) => void;
  readonly openDialogIntent: import('../session/sessionTypes').SelectedLineDialogOpenIntent | null;
  readonly onOpenDialogIntentConsumed: (intent: import('../session/sessionTypes').SelectedLineDialogOpenIntent | null) => void;
}

const resolveGlobalStateLabel = (panelState: InspectorPanelState): string => {
  if (panelState.mode === 'line-selected') {
    return `Line selected (${panelState.selectedLine.id})`;
  }

  if (panelState.mode === 'stop-selected') {
    return `Stop selected (${panelState.selection.selectedStopId})`;
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
  selectedLineRouteBaseline,
  placedStops,
  activeTimeBandId,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection,
  selectedLinePlanningVehicleProjection,
  selectedLineDemandProjection,
  networkDemandProjection,
  lineFrequencyInputByTimeBand,
  lineFrequencyControlByTimeBand,
  lineFrequencyValidationByTimeBand,
  onFrequencyChange,
  onSelectedLineIdChange,
  onStopSelectionChange,
  openDialogIntent,
  onOpenDialogIntentConsumed
}: InspectorPanelProps): ReactElement {
  const [activeTabId, setActiveTabId] = useState<InspectorTabId>('network');
  const [linesViewMode, setLinesViewMode] = useState<'list' | 'detail'>('list');
  const globalStateLabel = useMemo(() => resolveGlobalStateLabel(inspectorPanelState), [inspectorPanelState]);

  useEffect(() => {
    if (linesViewMode === 'detail' && inspectorPanelState.mode !== 'line-selected') {
      setLinesViewMode('list');
    }
  }, [inspectorPanelState.mode, linesViewMode]);

  useEffect(() => {
    if (
      openDialogIntent &&
      inspectorPanelState.mode === 'line-selected' &&
      openDialogIntent.lineId === inspectorPanelState.selectedLine.id
    ) {
      setActiveTabId('lines');
      setLinesViewMode('detail');
    }
  }, [openDialogIntent, inspectorPanelState]);

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
                <td className="inspector-compact-table__value--left">
                  {TIME_BAND_DISPLAY_LABELS[networkServicePlanProjection.summary.activeTimeBandId]}
                </td>
              </tr>
              <tr>
                <th scope="row">Global state</th>
                <td className="inspector-compact-table__value--left">{globalStateLabel}</td>
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

          <NetworkInventory
            placedStops={placedStops}
            completedLines={completedLines}
            onStopSelect={onStopSelectionChange}
            onLineSelect={onSelectedLineIdChange}
          />

          <h3 style={{ marginTop: '1.5rem' }}>Demand capture</h3>
          <table className="inspector-compact-table">
            <tbody>
              <tr>
                <th scope="row">Homes covered</th>
                <td>{`${networkDemandProjection.residential.capturedWeight} / ${networkDemandProjection.residential.totalWeight}`}</td>
              </tr>
              <tr>
                <th scope="row">Jobs covered</th>
                <td>{`${networkDemandProjection.workplace.capturedWeight} / ${networkDemandProjection.workplace.totalWeight}`}</td>
              </tr>
              <tr>
                <th scope="row">Served now</th>
                <td className="inspector-compact-table__value--highlight">
                  {networkDemandProjection.activelyServedResidentialWeight}
                </td>
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
                  selectedLineRouteBaseline={selectedLineRouteBaseline}
                  placedStops={placedStops}
                  activeTimeBandId={activeTimeBandId}
                  lineFrequencyInputByTimeBand={lineFrequencyInputByTimeBand}
                  lineFrequencyControlByTimeBand={lineFrequencyControlByTimeBand}
                  lineFrequencyValidationByTimeBand={lineFrequencyValidationByTimeBand}
                  selectedLineServiceProjection={selectedLineServiceProjection}
                  selectedLineServiceInspectorProjection={selectedLineServiceInspectorProjection}
                  selectedLinePlanningVehicleProjection={selectedLinePlanningVehicleProjection}
                  selectedLineDemandProjection={selectedLineDemandProjection}
                  onFrequencyChange={onFrequencyChange}
                  openDialogIntent={openDialogIntent}
                  onOpenDialogIntentConsumed={onOpenDialogIntentConsumed}
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
