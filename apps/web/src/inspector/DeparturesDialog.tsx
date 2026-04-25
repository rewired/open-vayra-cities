import type { ReactElement } from 'react';

import { projectLineDepartureTimetable } from '../domain/projection/lineDepartureTimetableProjection';
import type { Line } from '../domain/types/line';
import type { Stop } from '../domain/types/stop';
import type { TimeBandId } from '../domain/types/timeBand';

interface DeparturesDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedLine: Line;
  readonly placedStops: readonly Stop[];
  readonly activeTimeBandId: TimeBandId;
  readonly selectedLineRouteBaselineMetrics: import('../domain/projection/useNetworkPlanningProjections').RouteBaselineAggregateMetrics | null;
}

const formatHourLabel = (hour: number): string => String(hour).padStart(2, '0');

const formatMinutesLabel = (minutes: readonly number[]): string => minutes.map((minute) => String(minute).padStart(2, '0')).join(' ');

/** Renders a selected-line departures timetable matrix with compact service and route baseline context. */
export function DeparturesDialog({
  open,
  onClose,
  selectedLine,
  placedStops,
  activeTimeBandId,
  selectedLineRouteBaselineMetrics
}: DeparturesDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  const timetableProjection = projectLineDepartureTimetable(
    selectedLine,
    placedStops,
    activeTimeBandId,
    selectedLineRouteBaselineMetrics
  );

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Departures dialog">
      <div className="inspector-dialog__surface inspector-dialog__surface--large">
        <header className="inspector-dialog__header">
          <h3>Departures</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="inspector-card" aria-label="Departures summary">
          <p className="departures-dialog__line-label">Line: {selectedLine.id} · {timetableProjection.lineLabel}</p>
          <p className="departures-dialog__active-summary">
            {timetableProjection.activeServiceSummary.activeTimeBandLabel} · {timetableProjection.activeServiceSummary.activeWindowLabel} · {timetableProjection.activeServiceSummary.activeServiceLabel}
          </p>
          {timetableProjection.routeBaselineSummary ? (
            <div className="departures-dialog__route-baseline" aria-label="Route baseline summary">
              <span className="departures-dialog__route-baseline-pill">
                {timetableProjection.routeBaselineSummary.routingStatusLabel}
              </span>
              <span>Runtime {timetableProjection.routeBaselineSummary.totalLineMinutes.toFixed(2)} min</span>
              <span>{timetableProjection.routeBaselineSummary.segmentCount} segments</span>
            </div>
          ) : null}
          {timetableProjection.routeBaselineSummary?.fallbackWarning ? (
            <p className="inspector-dialog__note">{timetableProjection.routeBaselineSummary.fallbackWarning}</p>
          ) : null}
        </section>

        <section className="inspector-card departures-dialog__timetable" aria-label="Departures timetable matrix">
          <div className="departures-dialog__table-scroll">
            <table className="departures-dialog__table">
              <thead>
                <tr>
                  <th scope="col">Stop</th>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <th key={hour} scope="col">
                      {formatHourLabel(hour)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetableProjection.rows.map((row) => (
                  <tr key={row.stopLabel}>
                    <th scope="row">{row.stopLabel}</th>
                    {row.cells.map((cell) => (
                      <td key={`${row.stopLabel}-${cell.hour}`} data-state={cell.state}>
                        {cell.state === 'departures'
                          ? formatMinutesLabel(cell.departureMinutes)
                          : cell.state === 'unavailable'
                            ? 'Unavailable'
                            : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {timetableProjection.notices.length > 0 ? (
          <section className="inspector-card" aria-label="Departures notes">
            {timetableProjection.notices.map((note) => (
              <p key={note.message} className="inspector-dialog__note">
                {note.message}
              </p>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
