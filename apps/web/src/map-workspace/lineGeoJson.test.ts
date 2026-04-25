import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createNoServiceLineServiceByTimeBand, createLineId, type Line } from '../domain/types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../domain/types/lineRoute';
import { createStopId, type Stop } from '../domain/types/stop';
import { convertSelectedLineExportPayloadToSession } from '../domain/export/selectedLineExportSessionLoader';
import type { SelectedLineExportPayload } from '../domain/types/selectedLineExport';
import { buildCompletedLineFeatureCollection } from './lineGeoJson';

const stopAId = createStopId('stop-a');
const stopBId = createStopId('stop-b');
const stopCId = createStopId('stop-c');
const lineId = createLineId('line-1');

const stops: readonly Stop[] = [
  { id: stopAId, position: { lng: 9.99, lat: 53.55 }, label: 'Stop A' },
  { id: stopBId, position: { lng: 10.01, lat: 53.56 }, label: 'Stop B' },
  { id: stopCId, position: { lng: 10.03, lat: 53.57 }, label: 'Stop C' }
];

const stopsById = new Map(stops.map((stop) => [stop.id, stop] as const));
const currentDirPath = path.dirname(fileURLToPath(import.meta.url));

const buildRouteSegment = ({
  id,
  fromStopId,
  toStopId,
  orderedGeometry
}: {
  readonly id: string;
  readonly fromStopId: Stop['id'];
  readonly toStopId: Stop['id'];
  readonly orderedGeometry: readonly (readonly [number, number])[];
}): LineRouteSegment => ({
  id: createLineSegmentId(id),
  lineId,
  fromStopId,
  toStopId,
  orderedGeometry,
  distanceMeters: createRouteDistanceMeters(1000),
  inMotionTravelMinutes: createRouteTravelMinutes(2),
  dwellMinutes: createRouteTravelMinutes(1),
  totalTravelMinutes: createRouteTravelMinutes(3),
  status: 'routed'
});

const buildLine = ({
  routeSegments = [],
  stopIds = [stopAId, stopBId, stopCId]
}: {
  readonly routeSegments?: readonly LineRouteSegment[];
  readonly stopIds?: readonly Stop['id'][];
} = {}): Line => ({
  id: lineId,
  label: 'Line 1',
  stopIds,
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments,
  frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
});

describe('buildCompletedLineFeatureCollection', () => {
  it('creates one LineString feature for a loaded-style line with stored route segments', () => {
    const featureCollection = buildCompletedLineFeatureCollection({
      lines: [
        buildLine({
          routeSegments: [
            buildRouteSegment({
              id: 'segment-1',
              fromStopId: stopAId,
              toStopId: stopBId,
              orderedGeometry: [
                [9.99, 53.55],
                [10.0, 53.555],
                [10.01, 53.56]
              ]
            })
          ]
        })
      ],
      stopsById,
      selectedLineId: null
    });

    expect(featureCollection.features).toHaveLength(1);
    expect(featureCollection.features[0]?.geometry.type).toBe('LineString');
  });

  it('prefers route-segment geometry over stop-order fallback geometry', () => {
    const featureCollection = buildCompletedLineFeatureCollection({
      lines: [
        buildLine({
          routeSegments: [
            buildRouteSegment({
              id: 'segment-1',
              fromStopId: stopAId,
              toStopId: stopBId,
              orderedGeometry: [
                [100, 50],
                [101, 51]
              ]
            })
          ]
        })
      ],
      stopsById,
      selectedLineId: null
    });

    expect(featureCollection.features[0]?.geometry.coordinates).toEqual([
      [100, 50],
      [101, 51]
    ]);
  });

  it('sets selected=true when the line id matches selectedLineId', () => {
    const featureCollection = buildCompletedLineFeatureCollection({
      lines: [buildLine()],
      stopsById,
      selectedLineId: lineId
    });

    expect(featureCollection.features[0]?.properties.selected).toBe(true);
  });

  it('sets selected=false when the line id does not match selectedLineId', () => {
    const featureCollection = buildCompletedLineFeatureCollection({
      lines: [buildLine()],
      stopsById,
      selectedLineId: createLineId('line-other')
    });

    expect(featureCollection.features[0]?.properties.selected).toBe(false);
  });

  it('falls back to stop-order geometry when route segments are missing and enough stops exist', () => {
    const featureCollection = buildCompletedLineFeatureCollection({
      lines: [buildLine({ routeSegments: [] })],
      stopsById,
      selectedLineId: null
    });

    expect(featureCollection.features[0]?.geometry.coordinates).toEqual([
      [9.99, 53.55],
      [10.01, 53.56],
      [10.03, 53.57]
    ]);
  });

  it('returns zero features when neither route segments nor stop-order fallback provides enough geometry', () => {
    const featureCollection = buildCompletedLineFeatureCollection({
      lines: [buildLine({ routeSegments: [], stopIds: [stopAId] })],
      stopsById,
      selectedLineId: null
    });

    expect(featureCollection.features).toHaveLength(0);
  });

  it('returns deterministic feature counts across repeated calls and filters invalid line geometry', () => {
    const invalidLine = buildLine({ routeSegments: [], stopIds: [stopAId] });

    const buildCollection = () =>
      buildCompletedLineFeatureCollection({
        lines: [buildLine(), invalidLine],
        stopsById,
        selectedLineId: null
      });

    expect(buildCollection().features).toHaveLength(1);
    expect(buildCollection().features).toHaveLength(1);
  });

  it('builds one completed LineString feature from the Hamburg selected-line export fixture', () => {
    const fixturePath = path.resolve(
      currentDirPath,
      '../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json'
    );
    const payload = JSON.parse(readFileSync(fixturePath, 'utf8')) as SelectedLineExportPayload;
    const loadResult = convertSelectedLineExportPayloadToSession(payload);

    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) {
      throw new Error(`Expected fixture conversion to succeed but got ${loadResult.issue.code}.`);
    }

    const loadedStopsById = new Map(loadResult.session.placedStops.map((stop) => [stop.id, stop] as const));
    const featureCollection = buildCompletedLineFeatureCollection({
      lines: loadResult.session.sessionLines,
      stopsById: loadedStopsById,
      selectedLineId: loadResult.session.selectedLineId
    });

    expect(featureCollection.features).toHaveLength(1);
    expect(featureCollection.features[0]?.geometry.type).toBe('LineString');
  });
});
