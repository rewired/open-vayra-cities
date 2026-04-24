import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { validateSelectedLineExportPayload } from './selectedLineExportValidation';
import type { SelectedLineExportPayload } from '../types/selectedLineExport';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const fixturePath = resolve(currentDirPath, '../../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json');

const readFixturePayload = (): SelectedLineExportPayload =>
  JSON.parse(readFileSync(fixturePath, 'utf-8')) as SelectedLineExportPayload;

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
    payload.schemaVersion = 'cityops-selected-line-export-v999';

    expectIssue(payload, 'invalid-schema-version');
  });

  it('fails on unknown export kind', () => {
    const payload = readFixturePayload();
    payload.exportKind = 'multi-line' as SelectedLineExportPayload['exportKind'];

    expectIssue(payload, 'invalid-export-kind');
  });

  it('fails when an ordered stop is missing from exported stops', () => {
    const payload = readFixturePayload();
    payload.stops = payload.stops.filter((stop) => stop.id !== 'stop-7');
    payload.metadata.stopCount = payload.stops.length;

    expectIssue(payload, 'stop-reference-mismatch');
  });

  it('fails when an exported stop is unreferenced by ordered stops', () => {
    const payload = readFixturePayload();
    payload.stops = [
      ...payload.stops,
      {
        id: 'stop-extra',
        position: { lng: 9.95, lat: 53.55 },
        label: 'Extra Stop'
      }
    ];
    payload.metadata.stopCount = payload.stops.length;

    expectIssue(payload, 'stop-reference-mismatch');
  });

  it('fails when route segment count is below ordered stop chain minimum', () => {
    const payload = readFixturePayload();
    payload.line.routeSegments = payload.line.routeSegments.slice(0, -1);
    payload.metadata.routeSegmentCount = payload.line.routeSegments.length;

    expectIssue(payload, 'route-segment-count-mismatch');
  });

  it('fails on route segment adjacency mismatch', () => {
    const payload = readFixturePayload();
    const stop3 = payload.stops.find((stop) => stop.id === 'stop-3');

    expect(stop3).toBeDefined();
    if (!stop3) {
      return;
    }

    payload.line.routeSegments[0] = {
      ...payload.line.routeSegments[0],
      toStopId: 'stop-3',
      orderedGeometry: [
        payload.line.routeSegments[0].orderedGeometry[0],
        [stop3.position.lng, stop3.position.lat]
      ]
    };

    expectIssue(payload, 'route-segment-adjacency-mismatch');
  });

  it('fails on route segment line id mismatch', () => {
    const payload = readFixturePayload();
    payload.line.routeSegments[0] = {
      ...payload.line.routeSegments[0],
      lineId: 'line-2'
    };

    expectIssue(payload, 'route-segment-line-id-mismatch');
  });

  it('fails on invalid coordinate range', () => {
    const payload = readFixturePayload();
    payload.stops[0] = {
      ...payload.stops[0],
      position: { lng: 190, lat: 53.5 }
    };

    expectIssue(payload, 'invalid-stop-position');
  });

  it('fails on invalid total travel time', () => {
    const payload = readFixturePayload();
    payload.line.routeSegments[0] = {
      ...payload.line.routeSegments[0],
      totalTravelMinutes: payload.line.routeSegments[0].inMotionTravelMinutes
    };

    expectIssue(payload, 'route-segment-total-travel-minutes-mismatch');
  });

  it('fails on metadata stop count mismatch', () => {
    const payload = readFixturePayload();
    payload.metadata.stopCount = payload.metadata.stopCount + 1;

    expectIssue(payload, 'invalid-metadata-counts');
  });

  it('fails on metadata route segment count mismatch', () => {
    const payload = readFixturePayload();
    payload.metadata.routeSegmentCount = payload.metadata.routeSegmentCount + 1;

    expectIssue(payload, 'invalid-metadata-counts');
  });

  it('accepts includedTimeBandIds that match non-null frequencies in canonical order', () => {
    const payload = readFixturePayload();

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
  });

  it('allows empty includedTimeBandIds when all frequencies are null', () => {
    const payload = readFixturePayload();

    payload.line.frequencyByTimeBand = {
      'morning-rush': null,
      'late-morning': null,
      midday: null,
      afternoon: null,
      'evening-rush': null,
      evening: null,
      night: null
    };
    payload.metadata.includedTimeBandIds = [];

    const result = validateSelectedLineExportPayload(payload);

    expect(result.ok).toBe(true);
  });
});
