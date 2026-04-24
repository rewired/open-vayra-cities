import { describe, expect, it } from 'vitest';

import { createLineId } from '../domain/types/line';
import { createLineVehicleProjectionId, type LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import { buildVehicleFeatureCollection } from './vehicleGeoJson';

const lineId = createLineId('line-1');

const createVehicleNetworkProjection = (
  status: 'projected' | 'degraded-projected' | 'unavailable',
  coordinate: readonly [number, number] | null
): LineVehicleNetworkProjection => ({
  lines: [
    {
      lineId,
      lineLabel: 'Line 1',
      activeTimeBandId: 'morning-rush',
      departureScheduleStatus: 'configured',
      vehicles: [
        {
          id: createLineVehicleProjectionId('line-1:420'),
          lineId,
          lineLabel: 'Line 1',
          activeTimeBandId: 'morning-rush',
          departureMinute: 420,
          elapsedMinutes: 2,
          routeProgressRatio: 0.2,
          segmentProgressRatio: 0.5,
          currentSegmentId: null,
          coordinate,
          status
        }
      ]
    }
  ],
  summary: {
    totalProjectedVehicleCount: 0,
    totalDegradedProjectedVehicleCount: 0,
    linesWithProjectedVehiclesCount: 0,
    activeTimeBandId: 'morning-rush'
  }
});

describe('buildVehicleFeatureCollection', () => {
  it('returns one Point feature for projected vehicles with coordinates', () => {
    const result = buildVehicleFeatureCollection({
      vehicleNetworkProjection: createVehicleNetworkProjection('projected', [13.405, 52.52])
    });

    expect(result.features).toEqual([
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [13.405, 52.52]
        },
        properties: {
          projectedVehicleId: createLineVehicleProjectionId('line-1:420'),
          lineId,
          projectionStatus: 'projected',
          degraded: false
        }
      }
    ]);
  });

  it('returns one Point feature for degraded-projected vehicles with coordinates', () => {
    const result = buildVehicleFeatureCollection({
      vehicleNetworkProjection: createVehicleNetworkProjection('degraded-projected', [9.9937, 53.5511])
    });

    expect(result.features).toEqual([
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [9.9937, 53.5511]
        },
        properties: {
          projectedVehicleId: createLineVehicleProjectionId('line-1:420'),
          lineId,
          projectionStatus: 'degraded-projected',
          degraded: true
        }
      }
    ]);
  });

  it('returns no feature for unavailable vehicle status', () => {
    const result = buildVehicleFeatureCollection({
      vehicleNetworkProjection: createVehicleNetworkProjection('unavailable', [13.4, 52.5])
    });

    expect(result.features).toEqual([]);
  });

  it('returns no feature when coordinate is null', () => {
    const result = buildVehicleFeatureCollection({
      vehicleNetworkProjection: createVehicleNetworkProjection('projected', null)
    });

    expect(result.features).toEqual([]);
  });

  it('keeps geometry coordinates in [lng, lat] order', () => {
    const result = buildVehicleFeatureCollection({
      vehicleNetworkProjection: createVehicleNetworkProjection('projected', [11.5761, 48.1371])
    });

    expect(result.features[0]?.geometry.coordinates).toEqual([11.5761, 48.1371]);
  });
});
