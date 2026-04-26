import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { DeparturesDialog } from './DeparturesDialog';
import { FrequencyEditorDialog } from './FrequencyEditorDialog';
import { InlineRenameField } from './InlineRenameField';
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
  readonly onLineRename: (
    lineId: import('../domain/types/line').Line['id'],
    nextLabel: string
  ) => void;
  readonly onStopSelectionChange: (stopId: import('../domain/types/stop').StopId) => void;
  readonly onStopRename: (stopId: import('../domain/types/stop').StopId, nextLabel: string) => void;
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
  onLineRename,
  onStopSelectionChange,
  onStopRename,
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
  const placedStopsById = useMemo(
    () => new Map(placedStops.map((stop) => [stop.id, stop] as const)),
    [placedStops]
  );
  const selectedLineId = panelState.selectedLine.id;
  const segmentCountLabel =
    panelState.selectedLine.servicePattern === 'bidirectional'
      ? `F:${panelState.selectedLine.routeSegments.length} / R:${panelState.selectedLine.reverseRouteSegments?.length ?? 0}`
      : `${panelState.selectedLine.routeSegments.length}`;
  const runtimeLabel = selectedLineRouteBaseline
    ? `${(selectedLineRouteBaseline.totalTravelTimeSeconds / 60).toFixed(2)} min`
    : 'Unavailable';
  const readinessStatusLabel = selectedLineServiceProjection
    ? selectedLineServiceProjection.readiness.status
    : 'Unavailable';

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
        <div className="selected-line-inspector__header-row">
          <span className="selected-line-inspector__line-badge">{panelState.selectedLine.id}</span>
          <InlineRenameField
            value={panelState.selectedLine.label}
            entityLabel="line"
            onAccept={(nextValue) => onLineRename(panelState.selectedLine.id, nextValue)}
          />
        </div>
        <p className="selected-line-inspector__issue-summary">{formatIssueSummaryLabel(issueSummaryBlockerCount, issueSummaryWarningCount)}</p>
        <div className="selected-line-inspector__metadata-grid" aria-label="Selected line metadata">
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Topology</span>
            <span className="selected-line-inspector__metadata-value">
              {panelState.selectedLine.topology === 'loop' ? 'Loop' : 'Linear'}
            </span>
          </p>
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Service</span>
            <span className="selected-line-inspector__metadata-value">
              {panelState.selectedLine.servicePattern === 'bidirectional' ? 'Both directions' : 'One-way'}
            </span>
          </p>
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Stops</span>
            <span className="selected-line-inspector__metadata-value">{orderedStopIds.length}</span>
          </p>
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Segments</span>
            <span className="selected-line-inspector__metadata-value">{segmentCountLabel}</span>
          </p>
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Runtime</span>
            <span className="selected-line-inspector__metadata-value">{runtimeLabel}</span>
          </p>
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Readiness</span>
            <span className="selected-line-inspector__metadata-value">{readinessStatusLabel}</span>
          </p>
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Warnings</span>
            <span className="selected-line-inspector__metadata-value">{issueSummaryWarningCount}</span>
          </p>
          <p className="selected-line-inspector__metadata-item">
            <span className="selected-line-inspector__metadata-key">Blockers</span>
            <span className="selected-line-inspector__metadata-value">{issueSummaryBlockerCount}</span>
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

      <section className="inspector-card" aria-label="Selected line route sequence">
        <h3>Route sequence</h3>
        {orderedStopIds.length > 0 ? (
          <ul className="selected-line-inspector__route-list" aria-label="Selected line route-ordered stop list">
            {orderedStopIds.map((stopId, index) => {
              const stop = placedStopsById.get(stopId);
              const fallbackLabel = `Unknown stop (${stopId})`;
              const stopLabel = stop?.label ?? fallbackLabel;

              return (
                <li key={`${stopId}-${index}`} className="selected-line-inspector__route-item">
                  <button
                    type="button"
                    className="selected-line-inspector__route-order-badge"
                    onClick={() => onStopSelectionChange(stopId)}
                    title={`Select and focus ${stopLabel}`}
                    aria-label={`Select stop ${index + 1}: ${stopLabel}`}
                  >
                    [{index + 1}]
                  </button>
                  <span className="selected-line-inspector__route-stop-label" title={stopLabel}>
                    {stopLabel}
                  </span>
                  <InlineRenameField
                    value={stopLabel}
                    entityLabel="stop"
                    onAccept={(nextValue) => onStopRename(stopId, nextValue)}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No stops in this line route.</p>
        )}
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
