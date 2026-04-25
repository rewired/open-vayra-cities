import type { ReactElement } from 'react';

interface ServicePlanDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
}

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
          <button type="button" className="inspector-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>

        {selectedLineServiceProjection ? (
          <section className="inspector-card inspector-line-readiness" aria-label="Service readiness summary">
            <h3>Service readiness summary</h3>
            <p className="inspector-line-readiness__status">Status: {selectedLineServiceProjection.readiness.status}</p>
            <table className="inspector-compact-table">
              <tbody>
                <tr>
                  <th scope="row">Configured bands</th>
                  <td>{selectedLineServiceProjection.readiness.summary.configuredTimeBandCount}</td>
                </tr>
                <tr>
                  <th scope="row">Missing / unset bands</th>
                  <td>
                    {selectedLineServiceProjection.readiness.summary.canonicalTimeBandCount -
                      selectedLineServiceProjection.readiness.summary.configuredTimeBandCount}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Route segments</th>
                  <td>{selectedLineServiceProjection.readiness.summary.routeSegmentCount}</td>
                </tr>
                <tr>
                  <th scope="row">Blocker issues</th>
                  <td>{selectedLineServiceProjection.readiness.summary.errorIssueCount}</td>
                </tr>
                <tr>
                  <th scope="row">Warning issues</th>
                  <td>{selectedLineServiceProjection.readiness.summary.warningIssueCount}</td>
                </tr>
              </tbody>
            </table>
            {selectedLineServiceProjection.readiness.issues.length > 0 ? (
              <details className="inspector-details" aria-label="Full readiness issue list">
                <summary>Show full readiness issue list</summary>
                <ul className="inspector-line-readiness__issues">
                  {selectedLineServiceProjection.readiness.issues.map((issue, index) => (
                    <li key={`${issue.code}-full-${index}`}>
                      <span>{issue.message}</span>{' '}
                      {issue.code ? <code className="inspector-line-readiness__code">{issue.code}</code> : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <p>No readiness issues.</p>
            )}
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
                  <th scope="row">Current headway</th>
                  <td>{selectedLineServiceInspectorProjection.headwayLabel}</td>
                </tr>
                <tr>
                  <th scope="row">Departures/hour</th>
                  <td>{selectedLineServiceInspectorProjection.theoreticalDeparturesPerHourLabel ?? 'Unavailable'}</td>
                </tr>
                <tr>
                  <th scope="row">Route time</th>
                  <td>{selectedLineServiceInspectorProjection.totalRouteTravelMinutesLabel}</td>
                </tr>
                <tr>
                  <th scope="row">Route segment count</th>
                  <td>{selectedLineServiceInspectorProjection.routeSegmentCount}</td>
                </tr>
                <tr>
                  <th scope="row">Blockers / warnings</th>
                  <td>
                    {selectedLineServiceInspectorProjection.blockerCount} / {selectedLineServiceInspectorProjection.warningCount}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Service notes</th>
                  <td>{selectedLineServiceInspectorProjection.noteMessages.length}</td>
                </tr>
              </tbody>
            </table>
            {selectedLineServiceInspectorProjection.noteMessages.length > 0 ? (
              <details className="inspector-details" aria-label="Detailed service notes">
                <summary>Show service notes and render timing details</summary>
                <ul className="inspector-line-readiness__issues">
                  {selectedLineServiceInspectorProjection.noteMessages.map((message, index) => (
                    <li key={`line-service-note-${index}`}>{message}</li>
                  ))}
                </ul>
              </details>
            ) : (
              <p>No service notes.</p>
            )}
          </section>
        ) : (
          <p className="inspector-dialog__unavailable">Selected-line service summary projection unavailable.</p>
        )}
      </div>
    </div>
  );
}
