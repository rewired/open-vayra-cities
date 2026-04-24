import type { ReactElement } from 'react';

import type { Line } from '../domain/types/line';

interface SelectedLineContextTrayProps {
  /** Selected completed line used as the canonical identity/structure source for the tray. */
  readonly selectedLine: Line;
  /** Optional selected-line departure projection values for compact active-band context. */
  readonly selectedLineDepartureInspectorProjection: ReturnType<typeof import('../domain/projection/lineDepartureScheduleProjection').projectLineSelectedDepartureInspector> | null;
  /** Optional selected-line vehicle projection used for projected vehicle count display. */
  readonly selectedLineVehicleProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>['lines'][number] | null;
}

const formatCompactStopSequence = (stopIds: readonly Line['stopIds'][number][]): string => {
  if (stopIds.length === 0) {
    return '—';
  }

  if (stopIds.length <= 4) {
    return stopIds.join(' → ');
  }

  const firstStopId = stopIds[0];
  const secondStopId = stopIds[1];
  const penultimateStopId = stopIds.at(-2);
  const finalStopId = stopIds.at(-1);

  if (!firstStopId || !secondStopId || !penultimateStopId || !finalStopId) {
    return stopIds.join(' → ');
  }

  return `${firstStopId} → ${secondStopId} → … → ${penultimateStopId} → ${finalStopId}`;
};

/**
 * Renders a compact, non-interactive selected-line context tray near the map bottom without owning simulation/session state.
 */
export function SelectedLineContextTray({
  selectedLine,
  selectedLineDepartureInspectorProjection,
  selectedLineVehicleProjection
}: SelectedLineContextTrayProps): ReactElement {
  const activeTimeBandHeadwayLabel = selectedLineDepartureInspectorProjection
    ? `${selectedLineDepartureInspectorProjection.activeTimeBandLabel}: ${selectedLineDepartureInspectorProjection.headwayLabel}`
    : 'Unavailable';

  return (
    <section className="selected-line-context-tray" aria-label="Selected line context tray">
      <dl className="selected-line-context-tray__list">
        <div className="selected-line-context-tray__item">
          <dt>Line</dt>
          <dd>{`${selectedLine.id} / ${selectedLine.label}`}</dd>
        </div>

        <div className="selected-line-context-tray__item selected-line-context-tray__item--wide">
          <dt>Stops</dt>
          <dd>
            {selectedLine.stopIds.length} · {formatCompactStopSequence(selectedLine.stopIds)}
          </dd>
        </div>

        <div className="selected-line-context-tray__item">
          <dt>Segments</dt>
          <dd>{selectedLine.routeSegments.length}</dd>
        </div>

        <div className="selected-line-context-tray__item">
          <dt>Route time</dt>
          <dd>{selectedLineDepartureInspectorProjection?.totalRouteTravelMinutesLabel ?? 'Unavailable'}</dd>
        </div>

        <div className="selected-line-context-tray__item">
          <dt>Headway</dt>
          <dd>{activeTimeBandHeadwayLabel}</dd>
        </div>

        <div className="selected-line-context-tray__item">
          <dt>Next dep.</dt>
          <dd>{selectedLineDepartureInspectorProjection?.nextDepartureLabel ?? 'None'}</dd>
        </div>

        <div className="selected-line-context-tray__item">
          <dt>Vehicles</dt>
          <dd>{selectedLineVehicleProjection?.vehicles.length ?? 0}</dd>
        </div>
      </dl>
    </section>
  );
}
