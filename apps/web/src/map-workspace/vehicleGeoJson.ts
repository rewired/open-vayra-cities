import type { Line } from '../domain/types/line';
import type {
  LineVehicleNetworkProjection,
  LineVehicleProjectionId,
  LineVehicleProjectionStatus
} from '../domain/types/lineVehicleProjection';
import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';

/**
 * Public vehicle feature property contract projected into MapLibre GeoJSON sources.
 */
export interface VehicleFeatureProperties {
  /** Stable projected vehicle identifier used for keyed map feature updates. */
  readonly projectedVehicleId: LineVehicleProjectionId;
  /** Parent completed line identifier associated with this projected vehicle. */
  readonly lineId: Line['id'];
  /** Projection status forwarded for styling/debug semantics at map boundaries. */
  readonly projectionStatus: LineVehicleProjectionStatus;
  /** Degraded-state marker flag derived from projection status. */
  readonly degraded: boolean;
}

const isRenderableVehicleStatus = (
  status: LineVehicleProjectionStatus
): status is 'projected' | 'degraded-projected' => status === 'projected' || status === 'degraded-projected';

/**
 * Builds a typed GeoJSON feature collection for active projected/degraded-projected vehicles only.
 */
export const buildVehicleFeatureCollection = ({
  vehicleNetworkProjection
}: {
  readonly vehicleNetworkProjection: LineVehicleNetworkProjection;
}): MapLibreGeoJsonFeatureCollection<VehicleFeatureProperties> => ({
  type: 'FeatureCollection',
  features: vehicleNetworkProjection.lines.flatMap((lineProjection) =>
    lineProjection.vehicles.flatMap((vehicleProjection) => {
      if (!isRenderableVehicleStatus(vehicleProjection.status) || vehicleProjection.coordinate === null) {
        return [];
      }

      return [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: vehicleProjection.coordinate
          },
          properties: {
            projectedVehicleId: vehicleProjection.id,
            lineId: vehicleProjection.lineId,
            projectionStatus: vehicleProjection.status,
            degraded: vehicleProjection.status === 'degraded-projected'
          }
        }
      ];
    })
  )
});
