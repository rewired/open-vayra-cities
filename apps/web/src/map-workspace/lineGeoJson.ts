import type { Line } from '../domain/types/line';
import type { Stop, StopId } from '../domain/types/stop';
import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';

/**
 * Public completed-line feature property contract projected into MapLibre GeoJSON sources.
 */
export interface CompletedLineFeatureProperties {
  readonly lineId: Line['id'];
  readonly selected: boolean;
}

/**
 * Public draft-line feature property contract projected into MapLibre GeoJSON sources.
 */
export interface DraftLineFeatureProperties {
  readonly draft: true;
}

/**
 * Builds a typed GeoJSON feature collection for completed session line stop-order paths.
 */
export const buildCompletedLineFeatureCollection = ({
  lines,
  stopsById,
  selectedLineId
}: {
  readonly lines: readonly Line[];
  readonly stopsById: ReadonlyMap<StopId, Stop>;
  readonly selectedLineId: Line['id'] | null;
}): MapLibreGeoJsonFeatureCollection<CompletedLineFeatureProperties> => ({
  type: 'FeatureCollection',
  features: lines
    .map((line) => {
      const coordinates = line.stopIds
        .map((stopId) => stopsById.get(stopId))
        .filter((stop): stop is Stop => stop !== undefined)
        .map((stop) => [stop.position.lng, stop.position.lat] as const);

      if (coordinates.length < 2) {
        return null;
      }

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates
        },
        properties: {
          lineId: line.id,
          selected: selectedLineId === line.id
        }
      };
    })
    .filter((feature): feature is NonNullable<typeof feature> => feature !== null)
});

/**
 * Builds a typed GeoJSON feature collection for the active draft line stop-order preview.
 */
export const buildDraftLineFeatureCollection = ({
  draftStopIds,
  stopsById
}: {
  readonly draftStopIds: readonly StopId[];
  readonly stopsById: ReadonlyMap<StopId, Stop>;
}): MapLibreGeoJsonFeatureCollection<DraftLineFeatureProperties> => {
  const coordinates = draftStopIds
    .map((stopId) => stopsById.get(stopId))
    .filter((stop): stop is Stop => stop !== undefined)
    .map((stop) => [stop.position.lng, stop.position.lat] as const);

  return {
    type: 'FeatureCollection',
    features:
      coordinates.length < 2
        ? []
        : [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates
              },
              properties: {
                draft: true
              }
            }
          ]
  };
};
