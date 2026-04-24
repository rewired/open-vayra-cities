import type { ReactElement } from 'react';

import { TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import { EmptyInspector } from './EmptyInspector';
import { SelectedLineInspector } from './SelectedLineInspector';
import { SelectedStopInspector } from './SelectedStopInspector';
import type { InspectorPanelState } from './types';
import type { LineFrequencyInputByTimeBand, LineFrequencyValidationByTimeBand } from '../session/useNetworkSessionState';
import type { TimeBandId } from '../domain/types/timeBand';

interface InspectorPanelProps {
  readonly activeToolMode: string;
  readonly inspectorPanelState: InspectorPanelState;
  readonly staticNetworkSummaryKpis: import('../domain/projection/useNetworkPlanningProjections').StaticNetworkSummaryKpis;
  readonly networkServicePlanProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlan>;
  readonly vehicleNetworkProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>;
  readonly selectedLineRouteBaselineMetrics: import('../domain/projection/useNetworkPlanningProjections').RouteBaselineAggregateMetrics | null;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
  readonly selectedLineDepartureInspectorProjection: ReturnType<typeof import('../domain/projection/lineDepartureScheduleProjection').projectLineSelectedDepartureInspector> | null;
  readonly selectedLineVehicleProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>['lines'][number] | null;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly onFrequencyChange: (timeBandId: TimeBandId, rawInputValue: string) => void;
}

/** Renders the inspector panel layout while delegating selection-specific details to focused child components. */
export function InspectorPanel({
  activeToolMode,
  inspectorPanelState,
  staticNetworkSummaryKpis,
  networkServicePlanProjection,
  vehicleNetworkProjection,
  selectedLineRouteBaselineMetrics,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection,
  selectedLineDepartureInspectorProjection,
  selectedLineVehicleProjection,
  lineFrequencyInputByTimeBand,
  lineFrequencyValidationByTimeBand,
  onFrequencyChange
}: InspectorPanelProps): ReactElement {
  return (
    <aside className="right-panel" aria-label="Inspector panel">
      <h2>Inspector</h2>
      <p>Active mode: {activeToolMode}</p>
      <section className="inspector-network-summary" aria-label="Static network summary">
        <h3>Static network summary</h3>
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
              <th scope="row">Service completed lines</th>
              <td>{networkServicePlanProjection.summary.totalCompletedLineCount}</td>
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
        <details className="inspector-details inspector-debug-details">
          <summary>Debug details</summary>
          <table className="inspector-compact-table inspector-debug-details__table">
            <tbody>
              <tr>
                <th scope="row">Degraded projected vehicles</th>
                <td>{vehicleNetworkProjection.summary.totalDegradedProjectedVehicleCount}</td>
              </tr>
              <tr>
                <th scope="row">Configured service lines</th>
                <td>{networkServicePlanProjection.summary.configuredLineCount}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </section>
      {inspectorPanelState.mode === 'line-selected' ? (
        <SelectedLineInspector
          panelState={inspectorPanelState}
          selectedLineRouteBaselineMetrics={selectedLineRouteBaselineMetrics}
          lineFrequencyInputByTimeBand={lineFrequencyInputByTimeBand}
          lineFrequencyValidationByTimeBand={lineFrequencyValidationByTimeBand}
          selectedLineServiceProjection={selectedLineServiceProjection}
          selectedLineServiceInspectorProjection={selectedLineServiceInspectorProjection}
          selectedLineDepartureInspectorProjection={selectedLineDepartureInspectorProjection}
          selectedLineVehicleProjection={selectedLineVehicleProjection}
          onFrequencyChange={onFrequencyChange}
        />
      ) : null}
      {inspectorPanelState.mode === 'stop-selected' ? <SelectedStopInspector panelState={inspectorPanelState} /> : null}
      {inspectorPanelState.mode === 'empty' ? <EmptyInspector /> : null}
    </aside>
  );
}
