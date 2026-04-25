import type { ReactElement } from 'react';

const formatMinuteOfDayNumber = (minuteOfDay: number): string => {
  const normalizedMinute = ((Math.floor(minuteOfDay) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinute / 60);
  const minutes = normalizedMinute % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

interface ProjectedVehiclesDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedLineVehicleProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>['lines'][number] | null;
}

/** Renders selected-line projected vehicle details for the active simulation minute. */
export function ProjectedVehiclesDialog({
  open,
  onClose,
  selectedLineVehicleProjection
}: ProjectedVehiclesDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Projected vehicles dialog">
      <div className="inspector-dialog__surface">
        <header className="inspector-dialog__header">
          <h3>Projected vehicles</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>
        {selectedLineVehicleProjection ? (
          <section className="inspector-card inspector-line-projected-vehicles" aria-label="Projected vehicles summary">
            <h3>Projected vehicles summary</h3>
            <table className="inspector-compact-table">
              <tbody>
                <tr>
                  <th scope="row">Projected vehicle count</th>
                  <td>{selectedLineVehicleProjection.vehicles.length}</td>
                </tr>
                <tr>
                  <th scope="row">Projection status</th>
                  <td>{selectedLineVehicleProjection.departureScheduleStatus}</td>
                </tr>
              </tbody>
            </table>
            {selectedLineVehicleProjection.departureScheduleStatus === 'degraded' ? (
              <p>Degraded note: {selectedLineVehicleProjection.note ?? 'Degraded departure projection in active time band.'}</p>
            ) : null}
            <details className="inspector-details" aria-label="Detailed projected vehicle departures">
              <summary>Show projected vehicle departure minutes</summary>
              {selectedLineVehicleProjection.vehicles.length > 0 ? (
                <ul className="inspector-simple-list">
                  {selectedLineVehicleProjection.vehicles.map((vehicle) => (
                    <li key={vehicle.id}>{formatMinuteOfDayNumber(vehicle.departureMinute)}</li>
                  ))}
                </ul>
              ) : (
                <p>No projected departures active in the current minute.</p>
              )}
            </details>
          </section>
        ) : (
          <p className="inspector-dialog__unavailable">Projected vehicle data unavailable for the selected line.</p>
        )}
      </div>
    </div>
  );
}
