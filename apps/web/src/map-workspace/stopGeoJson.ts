import type { Stop, StopId } from '../domain/types/stop';
import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';

/**
 * Public stop feature property contract projected into MapLibre GeoJSON sources.
 */
export interface StopFeatureProperties {
  readonly stopId: StopId;
  readonly label: string;
  readonly selected: boolean;
  readonly draftMember: boolean;
  readonly buildLineInteractive: boolean;
}

/**
 * Builds a typed GeoJSON feature collection for all currently placed stops.
 */
export const buildStopFeatureCollection = ({
  stops,
  selectedStopId,
  draftStopIds,
  buildLineInteractive
}: {
  readonly stops: readonly Stop[];
  readonly selectedStopId: StopId | null;
  readonly draftStopIds: ReadonlySet<StopId>;
  readonly buildLineInteractive: boolean;
}): MapLibreGeoJsonFeatureCollection<StopFeatureProperties> => ({
  type: 'FeatureCollection',
  features: stops.map((stop) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [stop.position.lng, stop.position.lat]
    },
    properties: {
      stopId: stop.id,
      label: stop.label ?? stop.id,
      selected: selectedStopId === stop.id,
      draftMember: draftStopIds.has(stop.id),
      buildLineInteractive
    }
  }))
});
