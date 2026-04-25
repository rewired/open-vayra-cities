import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLineId } from '../domain/types/line';
import {
  createLineVehicleProjectionId,
  type LineVehicleNetworkProjection
} from '../domain/types/lineVehicleProjection';
import type { SelectedLineExportPayload } from '../domain/types/selectedLineExport';
import { buildVehicleFeatureCollection } from './vehicleGeoJson';

const lineId = createLineId('line-1');
const currentDirPath = path.dirname(fileURLToPath(import.meta.url));

const createVehicleNetworkProjection = (
  status: 'projected' | 'degraded-projected' | 'unavailable',
  coordinate: readonly [number, number] | null
): LineVehicleNetworkProjection => ({
  lines: [
    {
      lineId,
      lineLabel: 'Line 1',
      activeTimeBandId: 'morning-rush',
      serviceState: 'frequency',
      routeStatus: 'routed',
      vehicles: [
        {
          id: createLineVehicleProjectionId('line-1:420'),
          lineId,
          lineLabel: 'Line 1',
          activeTimeBandId: 'morning-rush',
          routeProgressRatio: 0.2,
          segmentIndex: null,
          direction: 'outbound',
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

  it('returns deterministic filtered vehicle feature counts for mixed statuses and missing coordinates', () => {
    const result = buildVehicleFeatureCollection({
      vehicleNetworkProjection: {
        lines: [
          {
            lineId,
            lineLabel: 'Line 1',
            activeTimeBandId: 'morning-rush',
            serviceState: 'frequency',
            routeStatus: 'routed',
            vehicles: [
              {
                id: createLineVehicleProjectionId('line-1:420'),
                lineId,
                lineLabel: 'Line 1',
                activeTimeBandId: 'morning-rush',
                routeProgressRatio: 0.2,
                segmentIndex: null,
                direction: 'outbound',
                coordinate: [13.4, 52.5],
                status: 'projected'
              },
              {
                id: createLineVehicleProjectionId('line-1:430'),
                lineId,
                lineLabel: 'Line 1',
                activeTimeBandId: 'morning-rush',
                routeProgressRatio: 0.1,
                segmentIndex: null,
                direction: 'outbound',
                coordinate: [13.45, 52.55],
                status: 'degraded-projected'
              },
              {
                id: createLineVehicleProjectionId('line-1:440'),
                lineId,
                lineLabel: 'Line 1',
                activeTimeBandId: 'morning-rush',
                routeProgressRatio: 0,
                segmentIndex: null,
                direction: 'outbound',
                coordinate: [13.5, 52.6],
                status: 'unavailable'
              },
              {
                id: createLineVehicleProjectionId('line-1:450'),
                lineId,
                lineLabel: 'Line 1',
                activeTimeBandId: 'morning-rush',
                routeProgressRatio: 0,
                segmentIndex: null,
                direction: 'outbound',
                coordinate: null,
                status: 'projected'
              }
            ]
          }
        ],
        summary: {
          totalProjectedVehicleCount: 1,
          totalDegradedProjectedVehicleCount: 1,
          linesWithProjectedVehiclesCount: 1,
          activeTimeBandId: 'morning-rush'
        }
      }
    });

    expect(result.features).toHaveLength(2);
    expect(result.features.map((feature) => feature.properties.projectionStatus)).toEqual([
      'projected',
      'degraded-projected'
    ]);
  });

  it('keeps fixture-backed vehicle rendering behavior explicit for projected/degraded and unavailable statuses', () => {
    const fixturePath = path.resolve(
      currentDirPath,
      '../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json'
    );
    const payload = JSON.parse(readFileSync(fixturePath, 'utf8')) as SelectedLineExportPayload;
    const fixtureLineId = createLineId(payload.line.id);

    const result = buildVehicleFeatureCollection({
      vehicleNetworkProjection: {
        lines: [
          {
            lineId: fixtureLineId,
            lineLabel: payload.line.label,
            activeTimeBandId: 'morning-rush',
            serviceState: 'frequency',
            routeStatus: 'fallback-routed',
            vehicles: [
              {
                id: createLineVehicleProjectionId(`${payload.line.id}:projected`),
                lineId: fixtureLineId,
                lineLabel: payload.line.label,
                activeTimeBandId: 'morning-rush',
                routeProgressRatio: 0.1,
                segmentIndex: null,
                direction: 'outbound',
                coordinate: [payload.stops[0]!.position.lng, payload.stops[0]!.position.lat],
                status: 'projected'
              },
              {
                id: createLineVehicleProjectionId(`${payload.line.id}:degraded`),
                lineId: fixtureLineId,
                lineLabel: payload.line.label,
                activeTimeBandId: 'morning-rush',
                routeProgressRatio: 0.2,
                segmentIndex: null,
                direction: 'outbound',
                coordinate: [payload.stops[1]!.position.lng, payload.stops[1]!.position.lat],
                status: 'degraded-projected'
              },
              {
                id: createLineVehicleProjectionId(`${payload.line.id}:unavailable`),
                lineId: fixtureLineId,
                lineLabel: payload.line.label,
                activeTimeBandId: 'morning-rush',
                routeProgressRatio: 0.3,
                segmentIndex: null,
                direction: 'outbound',
                coordinate: [payload.stops[2]!.position.lng, payload.stops[2]!.position.lat],
                status: 'unavailable'
              }
            ]
          }
        ],
        summary: {
          totalProjectedVehicleCount: 1,
          totalDegradedProjectedVehicleCount: 1,
          linesWithProjectedVehiclesCount: 1,
          activeTimeBandId: 'morning-rush'
        }
      }
    });

    expect(result.features).toHaveLength(2);
    expect(result.features.map((feature) => feature.properties.projectionStatus)).toEqual([
      'projected',
      'degraded-projected'
    ]);
  });
});
