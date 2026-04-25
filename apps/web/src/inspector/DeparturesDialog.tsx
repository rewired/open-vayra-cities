import type { ReactElement } from 'react';

interface DeparturesDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedLineDepartureInspectorProjection: ReturnType<typeof import('../domain/projection/lineDepartureScheduleProjection').projectLineSelectedDepartureInspector> | null;
}

/** Renders active-band departure schedule details for the currently selected line. */
export function DeparturesDialog({
  open,
  onClose,
  selectedLineDepartureInspectorProjection
}: DeparturesDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Departures dialog">
      <div className="inspector-dialog__surface inspector-dialog__surface--large">
        <header className="inspector-dialog__header">
          <h3>Departures</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>
        {selectedLineDepartureInspectorProjection ? (
          <section className="inspector-card inspector-line-departure-schedule" aria-label="Departure schedule summary">
            <h3>Departure schedule summary</h3>
            <table className="inspector-compact-table">
              <tbody>
                <tr>
                  <th scope="row">Active time band</th>
                  <td className="inspector-compact-table__value--left">
                    {selectedLineDepartureInspectorProjection.activeTimeBandLabel}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Projection status</th>
                  <td className="inspector-compact-table__value--left">
                    {selectedLineDepartureInspectorProjection.statusLabel}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Headway</th>
                  <td>{selectedLineDepartureInspectorProjection.headwayLabel}</td>
                </tr>
                <tr>
                  <th scope="row">Previous departure</th>
                  <td>{selectedLineDepartureInspectorProjection.previousDepartureLabel ?? 'None'}</td>
                </tr>
                <tr>
                  <th scope="row">Next departure</th>
                  <td>{selectedLineDepartureInspectorProjection.nextDepartureLabel ?? 'None'}</td>
                </tr>
                <tr>
                  <th scope="row">Minutes until next</th>
                  <td>{selectedLineDepartureInspectorProjection.minutesUntilNextDepartureLabel ?? 'None'}</td>
                </tr>
                <tr>
                  <th scope="row">Departures in active band</th>
                  <td>{selectedLineDepartureInspectorProjection.departureCount}</td>
                </tr>
              </tbody>
            </table>

            <details className="inspector-details" aria-label="Detailed upcoming departures">
              <summary>Show upcoming departures</summary>
              {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.length > 0 ? (
                <ul className="inspector-simple-list" aria-label="Upcoming departures">
                  {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              ) : (
                <p>No departure raster available for the active time band.</p>
              )}
            </details>
          </section>
        ) : (
          <p className="inspector-dialog__unavailable">Departure projection unavailable for the selected line.</p>
        )}
      </div>
    </div>
  );
}
