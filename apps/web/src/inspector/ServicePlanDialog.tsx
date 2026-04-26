import type { ReactElement } from 'react';
import { TIME_BAND_DEFINITIONS, formatTimeBandWindow } from '../domain/constants/timeBands';
import { MaterialIcon } from '../ui/icons/MaterialIcon';

interface ServicePlanDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
}

const TIME_BAND_WINDOW_LABELS = Object.fromEntries(
  TIME_BAND_DEFINITIONS.map((definition) => [definition.id, formatTimeBandWindow(definition)])
) as Record<(typeof TIME_BAND_DEFINITIONS)[number]['id'], string>;

const toActiveServiceStateLabel = (
  activeBandState: NonNullable<ServicePlanDialogProps['selectedLineServiceInspectorProjection']>['activeBandState'],
  currentBandHeadwayMinutes: number | null
): string => {
  if (activeBandState === 'no-service') {
    return 'No service';
  }

  return currentBandHeadwayMinutes === null ? 'No service' : `Every ${currentBandHeadwayMinutes} min`;
};

/** Renders selected-line service readiness and service-plan detail in a dialog. */
export function ServicePlanDialog({
  open,
  onClose,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection
}: ServicePlanDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Service plan dialog">
      <div className="inspector-dialog__surface inspector-dialog__surface--medium">
        <header className="inspector-dialog__header">
          <h3>Service plan</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose} aria-label="Close service plan dialog" title="Close service plan dialog">
            <MaterialIcon name="close" />
          </button>
        </header>

        {selectedLineServiceProjection ? (
          <section className="inspector-card inspector-line-readiness" aria-label="Service readiness summary">
            <h3>Service readiness summary</h3>
            <p className="inspector-line-readiness__status">Status: {selectedLineServiceProjection.readiness.status}</p>
          </section>
        ) : (
          <p className="inspector-dialog__unavailable">Service readiness projection unavailable for the selected line.</p>
        )}

        {selectedLineServiceInspectorProjection ? (
          <section className="inspector-card inspector-line-service-plan" aria-label="Current service plan summary">
            <h3>Current service plan summary</h3>
            <p className="inspector-status-badge">{selectedLineServiceInspectorProjection.statusLabel}</p>
            <table className="inspector-compact-table">
              <tbody>
                <tr>
                  <th scope="row">Active time band</th>
                  <td className="inspector-compact-table__value--left">
                    {selectedLineServiceInspectorProjection.activeTimeBandLabel}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Active window</th>
                  <td>{TIME_BAND_WINDOW_LABELS[selectedLineServiceInspectorProjection.activeTimeBandId]}</td>
                </tr>
                <tr>
                  <th scope="row">Active service state</th>
                  <td>
                    {toActiveServiceStateLabel(
                      selectedLineServiceInspectorProjection.activeBandState,
                      selectedLineServiceInspectorProjection.currentBandHeadwayMinutes
                    )}
                  </td>
                </tr>
                {selectedLineServiceInspectorProjection.theoreticalDeparturesPerHourLabel ? (
                  <tr>
                    <th scope="row">Departures/hour</th>
                    <td>{selectedLineServiceInspectorProjection.theoreticalDeparturesPerHourLabel}</td>
                  </tr>
                ) : null}
                {selectedLineServiceInspectorProjection.routeSegmentCount > 0 ? (
                  <tr>
                    <th scope="row">Runtime</th>
                    <td>{selectedLineServiceInspectorProjection.totalRouteTravelMinutesLabel}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <div className="service-plan-dialog__issue-pills" aria-label="Service issues">
              {selectedLineServiceInspectorProjection.blockerCount > 0 ? (
                <p className="service-plan-dialog__issue-pill service-plan-dialog__issue-pill--blocker">
                  {selectedLineServiceInspectorProjection.blockerCount} blocker
                  {selectedLineServiceInspectorProjection.blockerCount === 1 ? '' : 's'}
                </p>
              ) : null}
              {selectedLineServiceInspectorProjection.warningCount > 0 ? (
                <p className="service-plan-dialog__issue-pill service-plan-dialog__issue-pill--warning">
                  {selectedLineServiceInspectorProjection.warningCount} warning
                  {selectedLineServiceInspectorProjection.warningCount === 1 ? '' : 's'}
                </p>
              ) : null}
              {selectedLineServiceInspectorProjection.noteMessages.length > 0
                ? selectedLineServiceInspectorProjection.noteMessages.map((message, index) => (
                    <p key={`line-service-note-${index}`} className="service-plan-dialog__issue-pill service-plan-dialog__issue-pill--message">
                      {message}
                    </p>
                  ))
                : null}
            </div>
            {selectedLineServiceInspectorProjection.blockerCount > 0 ||
            selectedLineServiceInspectorProjection.warningCount > 0 ? (
              <p className="inspector-dialog__note">
                Open the global Debug modal for full readiness issue details and technical issue codes.
              </p>
            ) : (
              <p className="inspector-dialog__note">No actionable issues for the active service band.</p>
            )}
          </section>
        ) : (
          <p className="inspector-dialog__unavailable">Selected-line service summary projection unavailable.</p>
        )}
      </div>
    </div>
  );
}
