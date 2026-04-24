import type { ReactElement } from 'react';

import { MVP_TIME_BAND_IDS, TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import type { TimeBandId } from '../domain/types/timeBand';
import { ROUTE_STATUS_LABELS, type RouteBaselineAggregateMetrics } from '../domain/projection/useNetworkPlanningProjections';
import type { LineFrequencyInputByTimeBand, LineFrequencyValidationByTimeBand } from '../session/useNetworkSessionState';
import type { LineSelectedInspectorPanelState } from './types';

interface SelectedLineInspectorProps {
  readonly panelState: LineSelectedInspectorPanelState;
  readonly selectedLineRouteBaselineMetrics: RouteBaselineAggregateMetrics | null;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
  readonly selectedLineDepartureInspectorProjection: ReturnType<typeof import('../domain/projection/lineDepartureScheduleProjection').projectLineSelectedDepartureInspector> | null;
  readonly selectedLineVehicleProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>['lines'][number] | null;
  readonly onFrequencyChange: (timeBandId: TimeBandId, rawInputValue: string) => void;
}

const formatDistanceMeters = (distanceMeters: number): string => `${distanceMeters.toFixed(0)} m`;
const formatTravelMinutes = (travelMinutes: number): string => `${travelMinutes.toFixed(2)} min`;
const formatMinuteOfDayNumber = (minuteOfDay: number): string => {
  const normalizedMinute = ((Math.floor(minuteOfDay) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinute / 60);
  const minutes = normalizedMinute % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/** Renders selected-line inspector sections and forwards edits through narrow callbacks. */
export function SelectedLineInspector({
  panelState,
  selectedLineRouteBaselineMetrics,
  lineFrequencyInputByTimeBand,
  lineFrequencyValidationByTimeBand,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection,
  selectedLineDepartureInspectorProjection,
  selectedLineVehicleProjection,
  onFrequencyChange
}: SelectedLineInspectorProps): ReactElement {
  return (
    <div className="selected-line-inspector">
      <section className="inspector-card" aria-label="Selected line identity">
        <h3>Selected line</h3>
        <table className="inspector-compact-table">
          <tbody>
            <tr>
              <th scope="row">ID / Label</th>
              <td>{`${panelState.selectedLine.id} / ${panelState.selectedLine.label}`}</td>
            </tr>
            <tr>
              <th scope="row">Stop count</th>
              <td>{panelState.selectedLine.stopIds.length}</td>
            </tr>
            <tr>
              <th scope="row">Ordered stops</th>
              <td>{panelState.selectedLine.stopIds.join(' → ')}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="inspector-card inspector-frequency-editor" aria-label="Frequency editing">
        <h3>Frequency editing</h3>
        {MVP_TIME_BAND_IDS.map((timeBandId) => (
          <label key={timeBandId} className="inspector-frequency-editor__row">
            <span>{TIME_BAND_DISPLAY_LABELS[timeBandId]} interval (minutes)</span>
            <input
              type="number"
              min={1}
              value={lineFrequencyInputByTimeBand[timeBandId] ?? ''}
              onChange={(event) => {
                onFrequencyChange(timeBandId, event.currentTarget.value);
              }}
            />
            {lineFrequencyValidationByTimeBand[timeBandId] ? (
              <span className="inspector-frequency-editor__error">{lineFrequencyValidationByTimeBand[timeBandId]}</span>
            ) : null}
          </label>
        ))}
      </section>

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
            <>
              <ul className="inspector-line-readiness__issues">
                {selectedLineServiceProjection.readiness.issues.slice(0, 3).map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>
                    <span>{issue.message}</span>{' '}
                    {issue.code ? <code className="inspector-line-readiness__code">{issue.code}</code> : null}
                  </li>
                ))}
              </ul>
              {selectedLineServiceProjection.readiness.issues.length > 3 ? (
                <details className="inspector-details" aria-label="All readiness issues">
                  <summary>Show all readiness issues</summary>
                  <ul className="inspector-line-readiness__issues">
                    {selectedLineServiceProjection.readiness.issues.slice(3).map((issue, index) => (
                      <li key={`${issue.code}-extra-${index}`}>
                        <span>{issue.message}</span>{' '}
                        {issue.code ? <code className="inspector-line-readiness__code">{issue.code}</code> : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          ) : (
            <p>No readiness issues.</p>
          )}
        </section>
      ) : null}

      {selectedLineServiceInspectorProjection ? (
        <section className="inspector-card inspector-line-service-plan" aria-label="Current service plan summary">
          <h3>Current service plan summary</h3>
          <p className="inspector-status-badge">{selectedLineServiceInspectorProjection.statusLabel}</p>
          <table className="inspector-compact-table">
            <tbody>
              <tr>
                <th scope="row">Active time band</th>
                <td>{selectedLineServiceInspectorProjection.activeTimeBandLabel}</td>
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
            </tbody>
          </table>
          {selectedLineServiceInspectorProjection.noteMessages.length > 0 ? (
            <ul className="inspector-line-readiness__issues">
              {selectedLineServiceInspectorProjection.noteMessages.slice(0, 3).map((message, index) => (
                <li key={`line-service-note-${index}`}>{message}</li>
              ))}
            </ul>
          ) : (
            <p>No service notes.</p>
          )}
        </section>
      ) : null}

      {selectedLineDepartureInspectorProjection ? (
        <section className="inspector-card inspector-line-departure-schedule" aria-label="Departure schedule summary">
          <h3>Departure schedule summary</h3>
          <table className="inspector-compact-table">
            <tbody>
              <tr>
                <th scope="row">Active time band</th>
                <td>{selectedLineDepartureInspectorProjection.activeTimeBandLabel}</td>
              </tr>
              <tr>
                <th scope="row">Projection status</th>
                <td>{selectedLineDepartureInspectorProjection.statusLabel}</td>
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

          {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.length > 0 ? (
            <ul className="inspector-simple-list" aria-label="Upcoming departures">
              {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : (
            <p>No departure raster available for the active time band.</p>
          )}
        </section>
      ) : null}

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
          <details className="inspector-details" aria-label="Projected vehicle departure minutes">
            <summary>Projected vehicle departure minutes</summary>
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
      ) : null}

      <section className="inspector-card inspector-route-baseline" aria-label="Route baseline summary">
        <h3>Route baseline summary</h3>
        <table className="inspector-compact-table">
          <tbody>
            <tr>
              <th scope="row">Segment count</th>
              <td>{selectedLineRouteBaselineMetrics?.segmentCount ?? 0}</td>
            </tr>
            <tr>
              <th scope="row">Total distance</th>
              <td>{formatDistanceMeters(selectedLineRouteBaselineMetrics?.totalDistanceMeters ?? 0)}</td>
            </tr>
            <tr>
              <th scope="row">Total in-motion time</th>
              <td>{formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalInMotionMinutes ?? 0)}</td>
            </tr>
            <tr>
              <th scope="row">Total dwell time</th>
              <td>{formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalDwellMinutes ?? 0)}</td>
            </tr>
            <tr>
              <th scope="row">Total line time</th>
              <td>{formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalLineMinutes ?? 0)}</td>
            </tr>
          </tbody>
        </table>
        {selectedLineRouteBaselineMetrics?.hasFallbackSegments ? (
          <p className="inspector-route-baseline__fallback-note">
            Fallback routed segments detected. Values are baseline fallback outputs and are not accuracy claims.
          </p>
        ) : null}
        <details className="inspector-details" aria-label="Route segment details">
          <summary>Route segment details</summary>
          {panelState.selectedLine.routeSegments.length > 0 ? (
            <table className="inspector-route-baseline__segment-table">
              <thead>
                <tr>
                  <th scope="col">From</th>
                  <th scope="col">To</th>
                  <th scope="col">Distance</th>
                  <th scope="col">In-motion</th>
                  <th scope="col">Dwell</th>
                  <th scope="col">Line time</th>
                  <th scope="col">Route status</th>
                </tr>
              </thead>
              <tbody>
                {panelState.selectedLine.routeSegments.map((segment) => (
                  <tr key={segment.id}>
                    <td>{segment.fromStopId}</td>
                    <td>{segment.toStopId}</td>
                    <td>{formatDistanceMeters(segment.distanceMeters)}</td>
                    <td>{formatTravelMinutes(segment.inMotionTravelMinutes)}</td>
                    <td>{formatTravelMinutes(segment.dwellMinutes)}</td>
                    <td>{formatTravelMinutes(segment.totalTravelMinutes)}</td>
                    <td>{ROUTE_STATUS_LABELS[segment.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No route segments available.</p>
          )}
        </details>
      </section>
    </div>
  );
}
