import type { ReactElement } from 'react';

import { MVP_TIME_BAND_IDS, TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
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
  readonly sessionActions: ReactElement;
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
  onFrequencyChange,
  sessionActions
}: InspectorPanelProps): ReactElement {
  return (
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
          <p>Projected vehicles: {vehicleNetworkProjection.summary.totalProjectedVehicleCount}</p>
          <p>Degraded projected vehicles: {vehicleNetworkProjection.summary.totalDegradedProjectedVehicleCount}</p>
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
      {sessionActions}
      <p>MVP time bands: {MVP_TIME_BAND_IDS.map((timeBandId) => TIME_BAND_DISPLAY_LABELS[timeBandId]).join(', ')}</p>
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
