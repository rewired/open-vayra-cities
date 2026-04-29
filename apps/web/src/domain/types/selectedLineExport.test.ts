import { describe, expect, it } from 'vitest';

import { createLineFrequencyMinutes, createLineId, createNoServiceLineServiceByTimeBand, type Line } from './line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from './lineRoute';
import { buildSelectedLineExportPayload } from './selectedLineExport';
import { createStopId, type Stop } from './stop';

const stopAId = createStopId('stop-a');
const stopBId = createStopId('stop-b');
const stopCId = createStopId('stop-c');
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
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments,
  frequencyByTimeBand: {
    ...createNoServiceLineServiceByTimeBand(),
    'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(8) }
  }
};

const placedStops: readonly Stop[] = [
  { id: stopAId, position: { lng: 9.99, lat: 53.55 }, label: 'A' },
  { id: stopBId, position: { lng: 10, lat: 53.56 }, label: 'B' },
  { id: stopCId, position: { lng: 10.01, lat: 53.57 }, label: 'C' }
];

describe('buildSelectedLineExportPayload', () => {
  it('exports only selected line data with referenced stops and summary metadata wrapped in a network save envelope', () => {
    const envelope = buildSelectedLineExportPayload({
      selectedLine,
      placedStops,
      createdAtIsoUtc: '2026-04-24T12:00:00.000Z',
      sourceMetadata: {
        source: 'openvayra-cities-web',
        sourceVersion: 'test'
      }
    });

    // Verify envelope
    expect(envelope.schema).toBe('openvayra-cities.network-save');
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.exportedAt).toBe('2026-04-24T12:00:00.000Z');
    expect(envelope.app.name).toBe('CityOps');

    // Verify nested payload
    const payload = envelope.payload;
    expect(payload.schemaVersion).toBe('openvayra-cities-selected-line-export-v4');
    expect(payload.exportKind).toBe('single-line');
    expect(payload.createdAtIsoUtc).toBe('2026-04-24T12:00:00.000Z');
    expect(payload.line.id).toBe(lineId);
    expect(payload.line.orderedStopIds).toEqual([stopAId, stopBId]);
    expect(payload.line.topology).toBe('linear');
    expect(payload.line.servicePattern).toBe('one-way');
    
    // v4 line should not have route geometry fields at the type level or runtime
    expect('routeSegments' in payload.line).toBe(false);
    expect('reverseRouteSegments' in payload.line).toBe(false);

    expect(payload.stops.map((stop) => stop.id)).toEqual([stopAId, stopBId]);
    expect(payload.metadata).toEqual({
      lineCount: 1,
      stopCount: 2,
      routeSegmentCount: 0,
      includedTimeBandIds: ['morning-rush', 'late-morning', 'midday', 'afternoon', 'evening-rush', 'evening', 'night']
    });
    expect(payload.line.frequencyByTimeBand).toEqual({
      'morning-rush': { kind: 'frequency', headwayMinutes: 8 },
      'late-morning': { kind: 'no-service' },
      midday: { kind: 'no-service' },
      afternoon: { kind: 'no-service' },
      'evening-rush': { kind: 'no-service' },
      evening: { kind: 'no-service' },
      night: { kind: 'no-service' }
    });
    expect(payload.sourceMetadata).toEqual({
      source: 'openvayra-cities-web',
      sourceVersion: 'test'
    });
  });

  it('defaults source metadata to openvayra-cities-web when omitted', () => {
    const envelope = buildSelectedLineExportPayload({
      selectedLine,
      placedStops,
      createdAtIsoUtc: '2026-04-24T12:00:00.000Z'
    });

    expect(envelope.payload.sourceMetadata).toEqual({ source: 'openvayra-cities-web' });
  });

  it('produces JSON output without route geometry fields for v4', () => {
    const envelope = buildSelectedLineExportPayload({
      selectedLine,
      placedStops,
      createdAtIsoUtc: '2026-04-24T12:00:00.000Z'
    });

    const json = JSON.stringify(envelope);
    
    expect(json).not.toContain('"routeSegments"');
    expect(json).not.toContain('"reverseRouteSegments"');
    expect(json).not.toContain('"orderedGeometry"');
    
    // Ensure envelope fields are present in JSON
    expect(json).toContain('"schema":"openvayra-cities.network-save"');
    expect(json).toContain('"schemaVersion":1');
  });
});
