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
    <div>
      <p>Selected line</p>
      <p>ID/Label: {`${panelState.selectedLine.id} / ${panelState.selectedLine.label}`}</p>
      <p>Stop count: {panelState.selectedLine.stopIds.length}</p>
      <p>Ordered stops: {panelState.selectedLine.stopIds.join(' → ')}</p>
      {selectedLineServiceInspectorProjection ? (
        <section className="inspector-line-service-plan" aria-label="Line service plan">
          <h3>Line service plan</h3>
          <p>Active time band: {selectedLineServiceInspectorProjection.activeTimeBandLabel}</p>
          <p>Current service status: {selectedLineServiceInspectorProjection.statusLabel}</p>
          <p>Configured headway: {selectedLineServiceInspectorProjection.headwayLabel}</p>
          {selectedLineServiceInspectorProjection.theoreticalDeparturesPerHourLabel ? (
            <p>Theoretical departures/hour: {selectedLineServiceInspectorProjection.theoreticalDeparturesPerHourLabel}</p>
          ) : null}
          <p>Total stored route time: {selectedLineServiceInspectorProjection.totalRouteTravelMinutesLabel}</p>
          <p>Route segment count: {selectedLineServiceInspectorProjection.routeSegmentCount}</p>
          <p>Blocker issues: {selectedLineServiceInspectorProjection.blockerCount}</p>
          <p>Warning issues: {selectedLineServiceInspectorProjection.warningCount}</p>
          {selectedLineServiceInspectorProjection.noteMessages.length > 0 ? (
            <ul className="inspector-line-readiness__issues">
              {selectedLineServiceInspectorProjection.noteMessages.map((message, index) => (
                <li key={`line-service-note-${index}`}>{message}</li>
              ))}
            </ul>
          ) : (
            <p>No service notes.</p>
          )}
        </section>
      ) : null}
      {selectedLineDepartureInspectorProjection ? (
        <section className="inspector-line-departure-schedule" aria-label="Line departure schedule">
          <h3>Line departure schedule</h3>
          <p>Active time band: {selectedLineDepartureInspectorProjection.activeTimeBandLabel}</p>
          <p>Departure projection status: {selectedLineDepartureInspectorProjection.statusLabel}</p>
          <p>Configured headway: {selectedLineDepartureInspectorProjection.headwayLabel}</p>
          <p>Departures in active band: {selectedLineDepartureInspectorProjection.departureCount}</p>
          {selectedLineDepartureInspectorProjection.nextDepartureLabel ? (
            <p>Next departure: {selectedLineDepartureInspectorProjection.nextDepartureLabel}</p>
          ) : (
            <p>No next departure in the active time band.</p>
          )}
          {selectedLineDepartureInspectorProjection.minutesUntilNextDepartureLabel ? (
            <p>Minutes until next departure: {selectedLineDepartureInspectorProjection.minutesUntilNextDepartureLabel}</p>
          ) : null}
          {selectedLineDepartureInspectorProjection.previousDepartureLabel ? (
            <p>Previous departure: {selectedLineDepartureInspectorProjection.previousDepartureLabel}</p>
          ) : null}
          {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.length > 0 ? (
            <p>Upcoming departures: {selectedLineDepartureInspectorProjection.upcomingDepartureLabels.join(', ')}</p>
          ) : (
            <p>No departure raster available for the active time band.</p>
          )}
        </section>
      ) : null}
      {selectedLineVehicleProjection ? (
        <section className="inspector-line-projected-vehicles" aria-label="Projected vehicles">
          <h3>Projected vehicles</h3>
          <p>Projected vehicle count: {selectedLineVehicleProjection.vehicles.length}</p>
          {selectedLineVehicleProjection.vehicles.length > 0 ? (
            <p>
              Active departure minutes:{' '}
              {selectedLineVehicleProjection.vehicles.map((vehicle) => formatMinuteOfDayNumber(vehicle.departureMinute)).join(', ')}
            </p>
          ) : (
            <p>No projected departures active in the current minute.</p>
          )}
          {selectedLineVehicleProjection.departureScheduleStatus === 'degraded' ? (
            <p>Degraded note: {selectedLineVehicleProjection.note ?? 'Degraded departure projection in active time band.'}</p>
          ) : null}
        </section>
      ) : null}
      {selectedLineServiceProjection ? (
        <section className="inspector-line-readiness" aria-label="Line readiness">
          <h3>Line readiness</h3>
          <p>Status: {selectedLineServiceProjection.readiness.status}</p>
          <p>Configured time bands: {selectedLineServiceProjection.readiness.summary.configuredTimeBandCount}</p>
          <p>
            Missing/unset time bands:{' '}
            {selectedLineServiceProjection.readiness.summary.canonicalTimeBandCount -
              selectedLineServiceProjection.readiness.summary.configuredTimeBandCount}
          </p>
          <p>Route segments: {selectedLineServiceProjection.readiness.summary.routeSegmentCount}</p>
          <p>Blocker issues: {selectedLineServiceProjection.readiness.summary.errorIssueCount}</p>
          <p>Warning issues: {selectedLineServiceProjection.readiness.summary.warningIssueCount}</p>
          {selectedLineServiceProjection.readiness.issues.length > 0 ? (
            <ul className="inspector-line-readiness__issues">
              {selectedLineServiceProjection.readiness.issues.slice(0, 5).map((issue, index) => (
                <li key={`${issue.code}-${index}`}>
                  <span>{issue.message}</span> {issue.code ? <code className="inspector-line-readiness__code">{issue.code}</code> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>No readiness issues.</p>
          )}
        </section>
      ) : null}
      <section className="inspector-route-baseline" aria-label="Route baseline">
        <h3>Route baseline</h3>
        <div className="inspector-route-baseline__totals">
          <p>Segment count: {selectedLineRouteBaselineMetrics?.segmentCount ?? 0}</p>
          <p>Total distance: {formatDistanceMeters(selectedLineRouteBaselineMetrics?.totalDistanceMeters ?? 0)}</p>
          <p>Total in-motion time: {formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalInMotionMinutes ?? 0)}</p>
          <p>Total dwell time: {formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalDwellMinutes ?? 0)}</p>
          <p>Total line time: {formatTravelMinutes(selectedLineRouteBaselineMetrics?.totalLineMinutes ?? 0)}</p>
        </div>
        {selectedLineRouteBaselineMetrics?.hasFallbackSegments ? (
          <p className="inspector-route-baseline__fallback-note">
            Fallback routed segments detected. Values are baseline fallback outputs and are not accuracy claims.
          </p>
        ) : null}
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
      </section>
      <div className="inspector-frequency-editor">
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
      </div>
    </div>
  );
}
