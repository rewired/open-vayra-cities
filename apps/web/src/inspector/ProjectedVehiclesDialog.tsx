import type { ReactElement } from 'react';

import { TIME_BAND_DEFINITIONS, formatTimeBandWindow } from '../domain/constants/timeBands';
import type { LineBandVehicleProjection, LinePlanningVehicleProjection } from '../domain/types/linePlanningVehicleProjection';
import type { TimeBandId } from '../domain/types/timeBand';
import { MaterialIcon } from '../ui/icons/MaterialIcon';

interface ProjectedVehiclesDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedLinePlanningVehicleProjection: LinePlanningVehicleProjection | null;
}

const getBandDefinition = (timeBandId: TimeBandId) => 
  TIME_BAND_DEFINITIONS.find((def) => def.id === timeBandId)!;

const renderStatusText = (band: LineBandVehicleProjection): ReactElement | string => {
  if (band.status === 'fallback-route') {
    return <span style={{ color: 'var(--color-warning, #f59e0b)', fontWeight: 500 }}>Fallback route</span>;
  }
  if (band.status === 'route-unavailable') {
    return <span style={{ color: 'var(--color-error, #ef4444)', fontWeight: 500 }}>Route unavailable</span>;
  }
  if (band.status === 'unconfigured') {
    return <span style={{ opacity: 0.6 }}>Unconfigured</span>;
  }
  return 'Ready';
};

/** Renders selected-line projected vehicle planning across all time bands. */
export function ProjectedVehiclesDialog({
  open,
  onClose,
  selectedLinePlanningVehicleProjection
}: ProjectedVehiclesDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Projected vehicles dialog">
      <div className="inspector-dialog__surface inspector-dialog__surface--large" style={{ maxWidth: '1000px' }}>
        <header className="inspector-dialog__header">
          <h3>Projected vehicles</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose} aria-label="Close projected vehicles dialog" title="Close projected vehicles dialog">
            <MaterialIcon name="close" />
          </button>
        </header>
        
        {selectedLinePlanningVehicleProjection ? (
          <section className="inspector-card" aria-label="Projected vehicles planning">
            <p className="departures-dialog__line-label" style={{ marginBottom: '16px' }}>
              Line: {selectedLinePlanningVehicleProjection.lineId}
            </p>
            
            <div className="departures-dialog__table-scroll">
              <table className="inspector-compact-table inspector-compact-table--data" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left', paddingRight: '12px' }}>Time band</th>
                    <th scope="col" style={{ textAlign: 'left', paddingRight: '12px' }}>Window</th>
                    <th scope="col" style={{ textAlign: 'left', paddingRight: '12px' }}>Service state</th>
                    <th scope="col" style={{ textAlign: 'right', paddingRight: '12px' }}>Headway</th>
                    <th scope="col" style={{ textAlign: 'right', paddingRight: '12px' }}>Round-trip</th>
                    <th scope="col" style={{ textAlign: 'right', paddingRight: '12px' }}>Vehicles</th>
                    <th scope="col" style={{ textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLinePlanningVehicleProjection.bands.map((band) => {
                    const def = getBandDefinition(band.timeBandId);
                    const isUnset = band.serviceState === 'unset';
                    const isNoService = band.serviceState === 'no-service';
                    
                    return (
                      <tr key={band.timeBandId}>
                        <th scope="row" style={{ textAlign: 'left', fontWeight: 'normal', paddingRight: '12px' }}>
                          {def.label}
                        </th>
                        <td style={{ textAlign: 'left', paddingRight: '12px' }}>
                          {formatTimeBandWindow(def)}
                        </td>
                        <td style={{ textAlign: 'left', paddingRight: '12px' }}>
                          {isUnset ? <span style={{ opacity: 0.6 }}>Unset</span> : isNoService ? 'No service' : 'Frequency'}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                          {band.headwayMinutes ? `${band.headwayMinutes} min` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                          {band.roundTripSeconds ? `${(band.roundTripSeconds / 60).toFixed(1)} min` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '12px', fontWeight: band.projectedVehicles ? 'bold' : 'normal' }}>
                          {isUnset ? <span style={{ opacity: 0.6 }}>—</span> : isNoService ? '0' : band.projectedVehicles ?? '—'}
                        </td>
                        <td style={{ textAlign: 'left' }}>
                          {renderStatusText(band)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="inspector-compact-table__summary" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                Max projected vehicles across configured bands: <strong style={{ fontSize: '1.2em' }}>{selectedLinePlanningVehicleProjection.maxProjectedVehicles}</strong>
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', opacity: 0.8 }}>
                Configured bands: {selectedLinePlanningVehicleProjection.totalConfiguredBands} · No service: {selectedLinePlanningVehicleProjection.totalNoServiceBands} · Unconfigured: {selectedLinePlanningVehicleProjection.totalUnconfiguredBands}
              </p>
              {selectedLinePlanningVehicleProjection.hasFallbackRouteWarning ? (
                <p className="inspector-dialog__note" style={{ color: 'var(--color-warning, #f59e0b)', margin: 0 }}>
                  Warning: Some vehicle projections are based on fallback route estimations.
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <p className="inspector-dialog__unavailable">Projected vehicle planning data unavailable for the selected line.</p>
        )}
      </div>
    </div>
  );
}
