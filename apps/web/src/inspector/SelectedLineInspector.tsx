import { useEffect, useState, type ReactElement } from 'react';

import { DeparturesDialog } from './DeparturesDialog';
import { FrequencyEditorDialog } from './FrequencyEditorDialog';
import { ProjectedVehiclesDialog } from './ProjectedVehiclesDialog';
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
  readonly selectedLineRouteBaseline: import('../domain/types/routeBaseline').LineRouteBaseline | null;
  readonly placedStops: readonly import('../domain/types/stop').Stop[];
  readonly activeTimeBandId: TimeBandId;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyControlByTimeBand: LineFrequencyControlByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
  readonly selectedLinePlanningVehicleProjection: ReturnType<typeof import('../domain/projection/linePlanningVehicleProjection').projectLinePlanningVehicles> | null;
  readonly selectedLineDemandProjection: import('../domain/demand/servedDemandProjection').LineBandDemandProjection | null;
  readonly onFrequencyChange: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
  readonly openDialogIntent: import('../session/sessionTypes').SelectedLineDialogOpenIntent | null;
  readonly onOpenDialogIntentConsumed: (intent: import('../session/sessionTypes').SelectedLineDialogOpenIntent | null) => void;
}

type SelectedLineDialogId = 'frequency' | 'service-plan' | 'departures' | 'projected-vehicles';

const formatIssueSummaryLabel = (blockerCount: number, warningCount: number): string =>
  `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} · ${warningCount} warning${warningCount === 1 ? '' : 's'}`;

const MAX_VISIBLE_STOP_CHIPS = 4;

/**
 * Renders compact selected-line summary actions and opens focused dialogs for detailed inspector sections.
 */
export function SelectedLineInspector({
  panelState,
  selectedLineRouteBaseline,
  placedStops,
  activeTimeBandId,
  lineFrequencyInputByTimeBand,
  lineFrequencyControlByTimeBand,
  lineFrequencyValidationByTimeBand,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection,
  selectedLinePlanningVehicleProjection,
  selectedLineDemandProjection,
  onFrequencyChange,
  openDialogIntent,
  onOpenDialogIntentConsumed
}: SelectedLineInspectorProps): ReactElement {
  const [activeDialogId, setActiveDialogId] = useState<SelectedLineDialogId | null>(null);
  const readinessBlockerCount = selectedLineServiceProjection?.readiness.summary.errorIssueCount ?? 0;
  const readinessWarningCount = selectedLineServiceProjection?.readiness.summary.warningIssueCount ?? 0;
  const serviceBlockerCount = selectedLineServiceInspectorProjection?.blockerCount ?? 0;
  const serviceWarningCount = selectedLineServiceInspectorProjection?.warningCount ?? 0;
  const issueSummaryBlockerCount = Math.max(readinessBlockerCount, serviceBlockerCount);
  const issueSummaryWarningCount = Math.max(readinessWarningCount, serviceWarningCount);
  const orderedStopIds = panelState.selectedLine.stopIds;
  const visibleStopIds = orderedStopIds.slice(0, MAX_VISIBLE_STOP_CHIPS);
  const hasCollapsedStops = orderedStopIds.length > MAX_VISIBLE_STOP_CHIPS;
  const selectedLineId = panelState.selectedLine.id;

  useEffect(() => {
    if (
      openDialogIntent &&
      openDialogIntent.lineId === selectedLineId &&
      openDialogIntent.dialogId === 'frequency'
    ) {
      setActiveDialogId('frequency');
      onOpenDialogIntentConsumed(null);
    }
  }, [openDialogIntent, selectedLineId, onOpenDialogIntentConsumed]);

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
              <th scope="row">Ordered stops</th>
              <td className="inspector-compact-table__value--left">
                <div className="selected-line-inspector__stop-chip-row" aria-label="Ordered stops preview">
                  {visibleStopIds.map((stopId) => (
                    <span key={stopId} className="selected-line-inspector__stop-chip">
                      {stopId}
                    </span>
                  ))}
                  {hasCollapsedStops ? (
                    <span className="selected-line-inspector__stop-chip selected-line-inspector__stop-chip--more">
                      +{orderedStopIds.length - visibleStopIds.length} more
                    </span>
                  ) : null}
                </div>
                {hasCollapsedStops ? (
                  <details className="selected-line-inspector__stop-sequence-details">
                    <summary>Expand stop sequence</summary>
                    <div className="selected-line-inspector__stop-chip-row" aria-label="Ordered stops full sequence">
                      {orderedStopIds.map((stopId) => (
                        <span key={`${stopId}-full`} className="selected-line-inspector__stop-chip">
                          {stopId}
                        </span>
                      ))}
                    </div>
                  </details>
                ) : null}
              </td>
            </tr>
            <tr>
              <th scope="row">Topology</th>
              <td className="inspector-compact-table__value--left">
                <span className="selected-line-inspector__value-label">
                  {panelState.selectedLine.topology === 'loop' ? 'Loop' : 'Linear'}
                </span>
              </td>
            </tr>
            <tr>
              <th scope="row">Service</th>
              <td className="inspector-compact-table__value--left">
                <span className="selected-line-inspector__value-label">
                  {panelState.selectedLine.servicePattern === 'bidirectional' ? 'Both directions' : 'One-way'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="selected-line-inspector__summary-stats" aria-label="Selected line route summary">
          <div className="selected-line-inspector__summary-stat-card">
            <span className="selected-line-inspector__summary-stat-label">Stops</span>
            <strong className="selected-line-inspector__summary-stat-value">{orderedStopIds.length}</strong>
          </div>
          <div className="selected-line-inspector__summary-stat-card">
            <span className="selected-line-inspector__summary-stat-label">Segments</span>
            <strong className="selected-line-inspector__summary-stat-value">
              {panelState.selectedLine.servicePattern === 'bidirectional' 
                ? `F:${panelState.selectedLine.routeSegments.length} / R:${panelState.selectedLine.reverseRouteSegments?.length ?? 0}`
                : panelState.selectedLine.routeSegments.length}
            </strong>
          </div>
          <div className="selected-line-inspector__summary-stat-card">
            <span className="selected-line-inspector__summary-stat-label">Runtime</span>
            <strong className="selected-line-inspector__summary-stat-value">
              {selectedLineRouteBaseline ? `${(selectedLineRouteBaseline.totalTravelTimeSeconds / 60).toFixed(2)} min` : 'Unavailable'}
            </strong>
          </div>
        </div>
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

      {selectedLineDemandProjection ? (
        <section className="inspector-card" aria-label="Selected line demand summary">
          <h3>Line demand</h3>
          <table className="inspector-compact-table">
            <tbody>
              <tr>
                <th scope="row">Status</th>
                <td className="inspector-compact-table__value--left">
                  <span className={`selected-line-inspector__value-label selected-line-inspector__value-label--${selectedLineDemandProjection.status}`}>
                    {selectedLineDemandProjection.status === 'served' ? 'Active' : selectedLineDemandProjection.status}
                  </span>
                </td>
              </tr>
              {selectedLineDemandProjection.status === 'served' ? (
                <>
                  <tr>
                    <th scope="row">Structural coverage</th>
                    <td className="inspector-compact-table__value--left">
                      {`${selectedLineDemandProjection.capturedOriginWeight} homes · ${selectedLineDemandProjection.capturedDestinationWeight} jobs`}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Served demand</th>
                    <td className="inspector-compact-table__value--highlight">
                      {selectedLineDemandProjection.servedDemandWeight}
                    </td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
          {selectedLineDemandProjection.warnings.length > 0 ? (
            <div className="selected-line-inspector__demand-warnings">
              {selectedLineDemandProjection.warnings.map((w, idx) => (
                <p key={idx} className="selected-line-inspector__warning-text">
                  {`⚠ ${w.message}`}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="inspector-card" aria-label="Selected line actions">
        <h3>Actions</h3>
        <div className="selected-line-inspector__actions-grid">
          <button type="button" className="inspector-lines-tab__action" onClick={() => setActiveDialogId('frequency')}>
            Edit frequency
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
        selectedLine={panelState.selectedLine}
        placedStops={placedStops}
        activeTimeBandId={activeTimeBandId}
        selectedLineRouteBaseline={selectedLineRouteBaseline}
      />
      <ProjectedVehiclesDialog
        open={activeDialogId === 'projected-vehicles'}
        onClose={() => setActiveDialogId(null)}
        selectedLinePlanningVehicleProjection={selectedLinePlanningVehicleProjection}
      />
    </div>
  );
}
