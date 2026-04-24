import { describe, expect, it } from 'vitest';

import { validateSelectedLineExportPayload } from './selectedLineExportValidation';
import { createLineFrequencyMinutes, createLineId, type Line } from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import { buildSelectedLineExportPayload } from '../types/selectedLineExport';
import { createStopId, type Stop } from '../types/stop';

const stopAId = createStopId('stop-a');
const stopBId = createStopId('stop-b');
const lineId = createLineId('line-1');

const routeSegments: readonly LineRouteSegment[] = [
  {
    id: createLineSegmentId('line-1-segment-1'),
    lineId,
    fromStopId: stopAId,
    toStopId: stopBId,
    orderedGeometry: [
      [9.99, 53.55],
      [10, 53.56]
    ],
    distanceMeters: createRouteDistanceMeters(1000),
    inMotionTravelMinutes: createRouteTravelMinutes(4),
    dwellMinutes: createRouteTravelMinutes(0.5),
    totalTravelMinutes: createRouteTravelMinutes(4.5),
    status: 'fallback-routed'
  }
];

const selectedLine: Line = {
  id: lineId,
  label: 'Line 1',
  stopIds: [stopAId, stopBId],
  routeSegments,
  frequencyByTimeBand: {
    'morning-rush': createLineFrequencyMinutes(8)
  }
};

const stops: readonly Stop[] = [
  { id: stopAId, position: { lng: 9.99, lat: 53.55 }, label: 'A' },
  { id: stopBId, position: { lng: 10, lat: 53.56 }, label: 'B' }
];

describe('validateSelectedLineExportPayload', () => {
  it('returns success with a typed payload for valid selected-line export JSON', () => {
    const payload = buildSelectedLineExportPayload({
      selectedLine,
      placedStops: stops,
      createdAtIsoUtc: '2026-04-24T12:00:00.000Z',
      sourceMetadata: { source: 'cityops-web' }
    });

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.line.id).toBe(lineId);
      expect(result.payload.metadata.includedTimeBandIds).toEqual(['morning-rush']);
    }
  });

  it('collects multiple validation issues in one pass for invalid payloads', () => {
    const result = validateSelectedLineExportPayload({
      schemaVersion: 'wrong',
      exportKind: 'not-single-line',
      createdAtIsoUtc: 'not-an-iso',
      sourceMetadata: { source: '' },
      line: {
        id: 'line-1',
        label: 'Line 1',
        orderedStopIds: ['stop-a', 'stop-b'],
        frequencyByTimeBand: {
          'morning-rush': 8,
          invalid: 10
        },
        routeSegments: [
          {
            id: 'segment-1',
            lineId: 'line-2',
            fromStopId: 'stop-a',
            toStopId: 'stop-b',
            orderedGeometry: [
              [9.9, 53.5],
              [9.91, 53.51]
            ],
            distanceMeters: 1000,
            inMotionTravelMinutes: 4,
            dwellMinutes: 0.5,
            totalTravelMinutes: 9,
            status: 'bad-status'
          }
        ]
      },
      stops: [
        { id: 'stop-a', position: { lng: 9.99, lat: 53.55 } },
        { id: 'stop-b', position: { lng: 10, lat: 53.56 } },
        { id: 'stop-extra', position: { lng: 10.01, lat: 53.57 } }
      ],
      metadata: {
        lineCount: 1,
        stopCount: 1,
        routeSegmentCount: 3,
        includedTimeBandIds: ['morning-rush', 'late-morning']
      }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const codes = result.issues.map((issue) => issue.code);
      expect(codes).toContain('invalid-schema-version');
      expect(codes).toContain('invalid-export-kind');
      expect(codes).toContain('invalid-created-at-iso-utc');
      expect(codes).toContain('invalid-source-metadata-source');
      expect(codes).toContain('invalid-frequency-time-band-id');
      expect(codes).toContain('route-segment-line-id-mismatch');
      expect(codes).toContain('route-segment-endpoint-mismatch');
      expect(codes).toContain('route-segment-total-travel-minutes-mismatch');
      expect(codes).toContain('invalid-route-status');
      expect(codes).toContain('stop-reference-mismatch');
      expect(codes).toContain('invalid-metadata-counts');
      expect(codes).toContain('metadata-included-time-band-order-mismatch');
    }
  });
});
