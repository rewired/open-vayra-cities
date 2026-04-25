import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { validateSelectedLineExportPayload } from './selectedLineExportValidation';
import type { SelectedLineExportPayload } from '../types/selectedLineExport';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const fixturePath = resolve(currentDirPath, '../../../../../data/fixtures/selected-line-exports/hamburg-line-1.v3.json');

const readFixturePayload = (): SelectedLineExportPayload => {
  const payload = JSON.parse(readFileSync(fixturePath, 'utf-8')) as any;
  return payload as SelectedLineExportPayload;
};

const expectIssue = (payload: SelectedLineExportPayload, expectedCode: string): void => {
  const result = validateSelectedLineExportPayload(payload);

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.issues.map((issue) => issue.code)).toContain(expectedCode);
  }
};

describe('validateSelectedLineExportPayload fixture contract', () => {
  it('validates committed hamburg-line-1 fixture successfully', () => {
    const payload = readFixturePayload();

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
  });

  it('fails on unknown schema version', () => {
    const payload = readFixturePayload();
    (payload as any).schemaVersion = 'cityops-selected-line-export-v999';

    expectIssue(payload, 'invalid-schema-version');
  });

  it('fails on unknown export kind', () => {
    const payload = readFixturePayload();
    (payload as any).exportKind = 'multi-line' as SelectedLineExportPayload['exportKind'];

    expectIssue(payload, 'invalid-export-kind');
  });

  it('fails when an ordered stop is missing from exported stops', () => {
    const payload = readFixturePayload();
    (payload as any).stops = payload.stops.filter((stop) => stop.id !== 'stop-7');
    (payload.metadata as any).stopCount = payload.stops.length;

    expectIssue(payload, 'stop-reference-mismatch');
  });

  it('fails when an exported stop is unreferenced by ordered stops', () => {
    const payload = readFixturePayload();
    (payload as any).stops = [
      ...payload.stops,
      {
        id: 'stop-extra',
        position: { lng: 9.95, lat: 53.55 },
        label: 'Extra Stop'
      }
    ];
    (payload.metadata as any).stopCount = payload.stops.length;

    expectIssue(payload, 'stop-reference-mismatch');
  });

  it('fails when route segment count is below ordered stop chain minimum', () => {
    const payload = readFixturePayload();
    (payload.line as any).routeSegments = payload.line.routeSegments.slice(0, -1);
    (payload.metadata as any).routeSegmentCount = payload.line.routeSegments.length;

    expectIssue(payload, 'route-segment-count-mismatch');
  });

  it('fails on route segment adjacency mismatch', () => {
    const payload = readFixturePayload();
    const stop3 = payload.stops.find((stop) => stop.id === 'stop-3');

    expect(stop3).toBeDefined();
    if (!stop3) {
      return;
    }

    (payload.line.routeSegments as any)[0] = {
      ...payload.line.routeSegments[0]!,
      toStopId: 'stop-3',
      orderedGeometry: [
        payload.line.routeSegments[0]!.orderedGeometry[0]!,
        [stop3.position.lng, stop3.position.lat]
      ]
    };

    expectIssue(payload, 'route-segment-adjacency-mismatch');
  });

  it('fails on route segment line id mismatch', () => {
    const payload = readFixturePayload();
    (payload.line.routeSegments as any)[0] = {
      ...payload.line.routeSegments[0]!,
      lineId: 'line-2'
    };

    expectIssue(payload, 'route-segment-line-id-mismatch');
  });

  it('fails on invalid coordinate range', () => {
    const payload = readFixturePayload();
    (payload.stops as any)[0] = {
      ...payload.stops[0]!,
      position: { lng: 190, lat: 53.5 }
    };

    expectIssue(payload, 'invalid-stop-position');
  });

  it('fails on invalid total travel time', () => {
    const payload = readFixturePayload();
    (payload.line.routeSegments as any)[0] = {
      ...payload.line.routeSegments[0]!,
      totalTravelMinutes: payload.line.routeSegments[0]!.inMotionTravelMinutes
    };

    expectIssue(payload, 'route-segment-total-travel-minutes-mismatch');
  });

  it('fails on metadata stop count mismatch', () => {
    const payload = readFixturePayload();
    (payload.metadata as any).stopCount = payload.metadata.stopCount + 1;

    expectIssue(payload, 'invalid-metadata-counts');
  });

  it('fails on metadata route segment count mismatch', () => {
    const payload = readFixturePayload();
    (payload.metadata as any).routeSegmentCount = payload.metadata.routeSegmentCount + 1;

    expectIssue(payload, 'invalid-metadata-counts');
  });

  it('accepts includedTimeBandIds that match configured service plans in canonical order', () => {
    const payload = readFixturePayload();

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
  });

  it('requires canonical includedTimeBandIds when all service plans are no-service', () => {
    const payload = readFixturePayload();

    (payload.line as any).frequencyByTimeBand = {
      'morning-rush': { kind: 'no-service' },
      'late-morning': { kind: 'no-service' },
      midday: { kind: 'no-service' },
      afternoon: { kind: 'no-service' },
      'evening-rush': { kind: 'no-service' },
      evening: { kind: 'no-service' },
      night: { kind: 'no-service' }
    };
    (payload.metadata as any).includedTimeBandIds = [
      'morning-rush',
      'late-morning',
      'midday',
      'afternoon',
      'evening-rush',
      'evening',
      'night'
    ];

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
  });

  it('allows no-service plans and counts them as configured in includedTimeBandIds', () => {
    const payload = readFixturePayload();
    (payload.line as any).frequencyByTimeBand = {
      ...payload.line.frequencyByTimeBand,
      evening: { kind: 'no-service' },
      night: { kind: 'no-service' }
    };
    (payload.metadata as any).includedTimeBandIds = [
      'morning-rush',
      'late-morning',
      'midday',
      'afternoon',
      'evening-rush',
      'evening',
      'night'
    ];

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
  });

  it('fails when frequency plan headwayMinutes is not positive', () => {
    const payload = readFixturePayload();
    (payload.line as any).frequencyByTimeBand = {
      ...payload.line.frequencyByTimeBand,
      midday: { kind: 'frequency', headwayMinutes: 0 }
    };

    expectIssue(payload, 'invalid-frequency-value');
  });
  
  it('accepts payload with missing routeSegments as derived cache intent', () => {
    const payload = readFixturePayload();
    delete (payload.line as any).routeSegments;
    (payload.metadata as any).routeSegmentCount = 0;

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
  });
});
