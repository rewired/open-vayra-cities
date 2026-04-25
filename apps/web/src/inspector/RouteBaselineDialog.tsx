import type { ReactElement } from 'react';

import { ROUTE_STATUS_LABELS } from '../domain/projection/useNetworkPlanningProjections';
import type { Line } from '../domain/types/line';

const formatDistanceMeters = (distanceMeters: number): string => `${distanceMeters.toFixed(0)} m`;
const formatTravelMinutes = (travelMinutes: number): string => `${travelMinutes.toFixed(2)} min`;

interface RouteBaselineDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedLineRouteBaselineMetrics: import('../domain/projection/useNetworkPlanningProjections').RouteBaselineAggregateMetrics | null;
  readonly routeSegments: Line['routeSegments'];
}

/** Renders route baseline aggregate and per-segment inspector detail for one selected line. */
export function RouteBaselineDialog({
  open,
  onClose,
  selectedLineRouteBaselineMetrics,
  routeSegments
}: RouteBaselineDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Route baseline dialog">
      <div className="inspector-dialog__surface">
        <header className="inspector-dialog__header">
          <h3>Route baseline</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>
        <section className="inspector-card inspector-route-baseline" aria-label="Route baseline summary">
          <h3>Route baseline summary</h3>
          {selectedLineRouteBaselineMetrics ? (
            <>
              <table className="inspector-compact-table">
                <tbody>
                  <tr>
                    <th scope="row">Segment count</th>
                    <td>{selectedLineRouteBaselineMetrics.segmentCount}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total distance</th>
                    <td>{formatDistanceMeters(selectedLineRouteBaselineMetrics.totalDistanceMeters)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total in-motion time</th>
                    <td>{formatTravelMinutes(selectedLineRouteBaselineMetrics.totalInMotionMinutes)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total dwell time</th>
                    <td>{formatTravelMinutes(selectedLineRouteBaselineMetrics.totalDwellMinutes)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total line time</th>
                    <td>{formatTravelMinutes(selectedLineRouteBaselineMetrics.totalLineMinutes)}</td>
                  </tr>
                </tbody>
              </table>
              {selectedLineRouteBaselineMetrics.hasFallbackSegments ? (
                <p className="inspector-route-baseline__fallback-note">
                  Fallback routed segments detected. Values are baseline fallback outputs and are not accuracy claims.
                </p>
              ) : null}
            </>
          ) : (
            <p className="inspector-dialog__unavailable">Route baseline aggregate metrics unavailable for the selected line.</p>
          )}
          <details className="inspector-details" aria-label="Route segment details">
            <summary>Route segment details</summary>
            {routeSegments.length > 0 ? (
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
                  {routeSegments.map((segment) => (
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
    </div>
  );
}
