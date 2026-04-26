import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { DeparturesDialog } from './DeparturesDialog';
import { FrequencyEditorDialog } from './FrequencyEditorDialog';
import { InlineRenameField } from './InlineRenameField';
import { ProjectedVehiclesDialog } from './ProjectedVehiclesDialog';
import { ServicePlanDialog } from './ServicePlanDialog';
import { MaterialIcon } from '../ui/icons/MaterialIcon';
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
  /** Callback for line-context stop focus (does not clear selected line). */
  readonly onLineSequenceStopFocus: (stopId: import('../domain/types/stop').StopId) => void;
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
  onLineSequenceStopFocus,
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
      <section className="selected-line-inspector__summary" aria-label="Selected line summary">
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
        <div className="selected-line-inspector__metadata-chips">
          <span className="selected-line-inspector__metadata-chip">
            <span className="selected-line-inspector__metadata-chip-key">Topology</span>
            <span className="selected-line-inspector__metadata-chip-value">
              {panelState.selectedLine.topology === 'loop' ? 'Loop' : 'Linear'}
            </span>
          </span>
          <span className="selected-line-inspector__metadata-chip">
            <span className="selected-line-inspector__metadata-chip-key">Service</span>
            <span className="selected-line-inspector__metadata-chip-value">
              {panelState.selectedLine.servicePattern === 'bidirectional' ? 'Both' : 'One-way'}
            </span>
          </span>
          <span className="selected-line-inspector__metadata-chip">
            <span className="selected-line-inspector__metadata-chip-key">Stops</span>
            <span className="selected-line-inspector__metadata-chip-value">{orderedStopIds.length}</span>
          </span>
          <span className="selected-line-inspector__metadata-chip">
            <span className="selected-line-inspector__metadata-chip-key">Runtime</span>
            <span className="selected-line-inspector__metadata-chip-value">{runtimeLabel}</span>
          </span>
          <span className="selected-line-inspector__metadata-chip">
            <span className="selected-line-inspector__metadata-chip-key">Status</span>
            <span className="selected-line-inspector__metadata-chip-value">{readinessStatusLabel}</span>
          </span>
          <span className="selected-line-inspector__metadata-chip">
            <span className="selected-line-inspector__metadata-chip-key">Issues</span>
            <span className="selected-line-inspector__metadata-chip-value">{issueSummaryWarningCount + issueSummaryBlockerCount}</span>
          </span>
        </div>
      </section>

      {selectedLineDemandProjection ? (
        <section className="selected-line-inspector__demand" aria-label="Line demand">
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

      <section className="selected-line-inspector__actions" aria-label="Line actions">
        <div className="selected-line-inspector__actions-row">
          <button
            type="button"
            className="selected-line-inspector__action-icon"
            onClick={() => setActiveDialogId('frequency')}
            title="Edit frequency"
            aria-label="Edit frequency"
          >
            <MaterialIcon name="pace" />
          </button>
          <button
            type="button"
            className="selected-line-inspector__action-icon"
            onClick={() => setActiveDialogId('service-plan')}
            title="Service plan"
            aria-label="Service plan"
          >
            <MaterialIcon name="route" />
          </button>
          <button
            type="button"
            className="selected-line-inspector__action-icon"
            onClick={() => setActiveDialogId('departures')}
            title="Departures"
            aria-label="Departures"
          >
            <MaterialIcon name="schedule" />
          </button>
          <button
            type="button"
            className="selected-line-inspector__action-icon"
            onClick={() => setActiveDialogId('projected-vehicles')}
            title="Projected vehicles"
            aria-label="Projected vehicles"
          >
            <MaterialIcon name="directions_bus" />
          </button>
        </div>
      </section>

      <section className="selected-line-inspector__route-sequence" aria-label="Selected line route sequence">
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
                    onClick={() => onLineSequenceStopFocus(stopId)}
                    title={`Focus ${stopLabel} on map`}
                    aria-label={`Focus stop ${index + 1}: ${stopLabel}`}
                  >
                    {index + 1}
                  </button>
                  <span className="selected-line-inspector__route-stop-label" title={stopLabel}>
                    {stopLabel}
                  </span>
                  <InlineRenameField
                    value={stopLabel}
                    entityLabel="stop"
                    idleDisplayMode="edit-only"
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
