import { useState, type ReactElement } from 'react';

import { DeparturesDialog } from './DeparturesDialog';
import { FrequencyEditorDialog } from './FrequencyEditorDialog';
import { ProjectedVehiclesDialog } from './ProjectedVehiclesDialog';
import { RouteBaselineDialog } from './RouteBaselineDialog';
import { ServicePlanDialog } from './ServicePlanDialog';
import type {
  LineFrequencyControlByTimeBand,
  LineFrequencyInputByTimeBand,
  LineFrequencyValidationByTimeBand,
  SelectedLineFrequencyUpdateAction
} from '../session/useNetworkSessionState';
import type { LineSelectedInspectorPanelState } from './types';
import type { TimeBandId } from '../domain/types/timeBand';

interface SelectedLineInspectorProps {
  readonly panelState: LineSelectedInspectorPanelState;
  readonly selectedLineRouteBaselineMetrics: import('../domain/projection/useNetworkPlanningProjections').RouteBaselineAggregateMetrics | null;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyControlByTimeBand: LineFrequencyControlByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
  readonly selectedLineDepartureInspectorProjection: ReturnType<typeof import('../domain/projection/lineDepartureScheduleProjection').projectLineSelectedDepartureInspector> | null;
  readonly selectedLineVehicleProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>['lines'][number] | null;
  readonly onFrequencyChange: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
}

type SelectedLineDialogId = 'frequency' | 'service-plan' | 'departures' | 'projected-vehicles' | 'route-baseline';

const formatIssueSummaryLabel = (blockerCount: number, warningCount: number): string =>
  `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} · ${warningCount} warning${warningCount === 1 ? '' : 's'}`;

/**
 * Renders compact selected-line summary actions and opens focused dialogs for detailed inspector sections.
 */
export function SelectedLineInspector({
  panelState,
  selectedLineRouteBaselineMetrics,
  lineFrequencyInputByTimeBand,
  lineFrequencyControlByTimeBand,
  lineFrequencyValidationByTimeBand,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection,
  selectedLineDepartureInspectorProjection,
  selectedLineVehicleProjection,
  onFrequencyChange
}: SelectedLineInspectorProps): ReactElement {
  const [activeDialogId, setActiveDialogId] = useState<SelectedLineDialogId | null>(null);
  const readinessBlockerCount = selectedLineServiceProjection?.readiness.summary.errorIssueCount ?? 0;
  const readinessWarningCount = selectedLineServiceProjection?.readiness.summary.warningIssueCount ?? 0;
  const serviceBlockerCount = selectedLineServiceInspectorProjection?.blockerCount ?? 0;
  const serviceWarningCount = selectedLineServiceInspectorProjection?.warningCount ?? 0;
  const issueSummaryBlockerCount = Math.max(readinessBlockerCount, serviceBlockerCount);
  const issueSummaryWarningCount = Math.max(readinessWarningCount, serviceWarningCount);

  return (
    <div className="selected-line-inspector">
      <section className="inspector-card" aria-label="Selected line compact header">
        <h3>Selected line</h3>
        <table className="inspector-compact-table">
          <tbody>
            <tr>
              <th scope="row">ID / Label</th>
              <td className="inspector-compact-table__value--left">{`${panelState.selectedLine.id} / ${panelState.selectedLine.label}`}</td>
            </tr>
            <tr>
              <th scope="row">Stop count</th>
              <td>{panelState.selectedLine.stopIds.length}</td>
            </tr>
            <tr>
              <th scope="row">Ordered stops</th>
              <td className="inspector-compact-table__value--left">{panelState.selectedLine.stopIds.join(' → ')}</td>
            </tr>
            <tr>
              <th scope="row">Segments / route time</th>
              <td>
                {selectedLineRouteBaselineMetrics
                  ? `${selectedLineRouteBaselineMetrics.segmentCount} / ${selectedLineRouteBaselineMetrics.totalLineMinutes.toFixed(2)} min`
                  : 'Unavailable'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="inspector-card" aria-label="Selected line readiness pills">
        <div className="selected-line-inspector__pill-row">
          <p className="selected-line-inspector__pill selected-line-inspector__pill--issues">
            {formatIssueSummaryLabel(issueSummaryBlockerCount, issueSummaryWarningCount)}
          </p>
          <p className="selected-line-inspector__pill selected-line-inspector__pill--readiness">
            {selectedLineServiceProjection ? `Readiness: ${selectedLineServiceProjection.readiness.status}` : 'Readiness: Unavailable'}
          </p>
        </div>
      </section>

      <section className="inspector-card" aria-label="Selected line actions">
        <h3>Actions</h3>
        <div className="selected-line-inspector__actions-grid">
          <button type="button" className="inspector-lines-tab__action" onClick={() => setActiveDialogId('frequency')}>
            Edit service plan
          </button>
          <button type="button" className="inspector-lines-tab__action" onClick={() => setActiveDialogId('service-plan')}>
            Service plan
          </button>
          <button type="button" className="inspector-lines-tab__action" onClick={() => setActiveDialogId('departures')}>
            Departures
          </button>
          <button
            type="button"
            className="inspector-lines-tab__action"
            onClick={() => setActiveDialogId('projected-vehicles')}
          >
            Projected vehicles
          </button>
          <button type="button" className="inspector-lines-tab__action" onClick={() => setActiveDialogId('route-baseline')}>
            Route baseline
          </button>
        </div>
      </section>

      <FrequencyEditorDialog
        open={activeDialogId === 'frequency'}
        onClose={() => setActiveDialogId(null)}
        lineFrequencyInputByTimeBand={lineFrequencyInputByTimeBand}
        lineFrequencyControlByTimeBand={lineFrequencyControlByTimeBand}
        lineFrequencyValidationByTimeBand={lineFrequencyValidationByTimeBand}
        onFrequencyChange={onFrequencyChange}
      />
      <ServicePlanDialog
        open={activeDialogId === 'service-plan'}
        onClose={() => setActiveDialogId(null)}
        selectedLineServiceProjection={selectedLineServiceProjection}
        selectedLineServiceInspectorProjection={selectedLineServiceInspectorProjection}
      />
      <DeparturesDialog
        open={activeDialogId === 'departures'}
        onClose={() => setActiveDialogId(null)}
        selectedLineDepartureInspectorProjection={selectedLineDepartureInspectorProjection}
      />
      <ProjectedVehiclesDialog
        open={activeDialogId === 'projected-vehicles'}
        onClose={() => setActiveDialogId(null)}
        selectedLineVehicleProjection={selectedLineVehicleProjection}
      />
      <RouteBaselineDialog
        open={activeDialogId === 'route-baseline'}
        onClose={() => setActiveDialogId(null)}
        selectedLineRouteBaselineMetrics={selectedLineRouteBaselineMetrics}
        routeSegments={panelState.selectedLine.routeSegments}
      />
    </div>
  );
}
