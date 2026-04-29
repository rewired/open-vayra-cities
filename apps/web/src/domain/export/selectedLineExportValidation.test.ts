import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { validateSelectedLineExportPayload, UNSUPPORTED_LEGACY_V3_MESSAGE } from './selectedLineExportValidation';
import { NETWORK_SAVE_SCHEMA, NETWORK_SAVE_SCHEMA_VERSION } from '../types/networkSave';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const getFixturePath = (version: 'v4' | 'v4.raw-legacy'): string => 
  resolve(currentDirPath, `../../../../../data/fixtures/selected-line-exports/hamburg-line-1.${version}.json`);

/**
 * Loose JSON-compatible helper type for intentional invalid-payload construction in tests.
 * Used only to mutate fixture clones in negative-case test assertions.
 */
type MutableJsonObject = Record<string, unknown>;

/**
 * Reads the raw v4 fixture file as an `unknown` candidate for use in validation tests.
 */
const readFixtureCandidate = (): unknown =>
  JSON.parse(readFileSync(getFixturePath('v4'), 'utf-8'));

/**
 * Clones the v4 fixture's inner payload into a mutable JSON object helper type for invalid-case construction.
 */
const cloneFixturePayload = (): MutableJsonObject => {
  const candidate = readFixtureCandidate() as MutableJsonObject;
  const payload = candidate.payload;
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Fixture payload must be a JSON object for clone-based test setup.');
  }
  return structuredClone(payload) as MutableJsonObject;
};

/**
 * Wraps a payload in a valid NetworkSaveEnvelope.
 */
const wrapInEnvelope = (payload: unknown): MutableJsonObject => ({
  schema: NETWORK_SAVE_SCHEMA,
  schemaVersion: NETWORK_SAVE_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  app: { name: 'OpenVayra - Cities' },
  payload
});

const expectIssueInEnvelope = (payload: unknown, expectedCode: string): void => {
  const result = validateSelectedLineExportPayload(wrapInEnvelope(payload));

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.issues.map((issue) => issue.code)).toContain(expectedCode);
  }
};

describe('validateSelectedLineExportPayload fixture contract', () => {
  it('validates current enveloped hamburg-line-1.v4 fixture successfully', () => {
    const candidate = readFixtureCandidate();

    const result = validateSelectedLineExportPayload(candidate);

    expect(result.ok).toBe(true);
  });

  it('rejects raw v4 fixture without envelope', () => {
    const rawCandidate = JSON.parse(readFileSync(getFixturePath('v4.raw-legacy'), 'utf-8'));
    const result = validateSelectedLineExportPayload(rawCandidate);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope')).toBe(true);
    }
  });

  it('validates modified payload wrapped in NetworkSaveEnvelope successfully', () => {
    const candidate = wrapInEnvelope(cloneFixturePayload());

    const result = validateSelectedLineExportPayload(candidate);

    expect(result.ok).toBe(true);
  });

  it('explicitly rejects legacy v3 payload with clear message', () => {
    const payload = JSON.parse(readFileSync(getFixturePath('v4.raw-legacy'), 'utf-8')) as MutableJsonObject;
    payload['schemaVersion'] = 'openvayra-cities-selected-line-export-v3';

    const result = validateSelectedLineExportPayload(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const v3Issue = result.issues.find(i => i.code === 'unsupported-legacy-v3');
      expect(v3Issue).toBeDefined();
      expect(v3Issue?.message).toBe(UNSUPPORTED_LEGACY_V3_MESSAGE);
    }
  });

  it('fails on unknown schema version', () => {
    const payload = cloneFixturePayload();
    payload['schemaVersion'] = 'openvayra-cities-selected-line-export-v999';

    expectIssueInEnvelope(payload, 'invalid-schema-version');
  });

  it('fails on unknown export kind', () => {
    const payload = cloneFixturePayload();
    payload['exportKind'] = 'multi-line';

    expectIssueInEnvelope(payload, 'invalid-export-kind');
  });

  it('fails when an ordered stop is missing from exported stops', () => {
    const payload = cloneFixturePayload();
    const stops = payload['stops'];
    if (!Array.isArray(stops)) {
      throw new Error('Fixture stops must be an array.');
    }
    payload['stops'] = stops.filter((stop: unknown) => {
      if (typeof stop === 'object' && stop !== null && 'id' in stop) {
        return (stop as Record<string, unknown>)['id'] !== 'stop-7';
      }
      return true;
    });
    const metadata = payload['metadata'];
    if (typeof metadata === 'object' && metadata !== null) {
      (metadata as MutableJsonObject)['stopCount'] = (payload['stops'] as unknown[]).length;
    }

    expectIssueInEnvelope(payload, 'stop-reference-mismatch');
  });

  it('fails when an exported stop is unreferenced by ordered stops', () => {
    const payload = cloneFixturePayload();
    const stops = payload['stops'];
    if (!Array.isArray(stops)) {
      throw new Error('Fixture stops must be an array.');
    }
    payload['stops'] = [
      ...stops,
      {
        id: 'stop-extra',
        position: { lng: 9.95, lat: 53.55 },
        label: 'Extra Stop'
      }
    ];
    const metadata = payload['metadata'];
    if (typeof metadata === 'object' && metadata !== null) {
      (metadata as MutableJsonObject)['stopCount'] = (payload['stops'] as unknown[]).length;
    }

    expectIssueInEnvelope(payload, 'stop-reference-mismatch');
  });

  it('fails on invalid coordinate range', () => {
    const payload = cloneFixturePayload();
    const stops = payload['stops'];
    if (!Array.isArray(stops) || stops.length === 0) {
      throw new Error('Fixture stops must be a non-empty array.');
    }
    const firstStop = stops[0];
    if (typeof firstStop !== 'object' || firstStop === null) {
      throw new Error('First stop must be an object.');
    }
    stops[0] = { ...(firstStop as Record<string, unknown>), position: { lng: 190, lat: 53.5 } };
    payload['stops'] = stops;

    expectIssueInEnvelope(payload, 'invalid-stop-position');
  });

  it('fails on metadata stop count mismatch', () => {
    const payload = cloneFixturePayload();
    const metadata = payload['metadata'];
    if (typeof metadata !== 'object' || metadata === null) {
      throw new Error('Fixture metadata must be an object.');
    }
    const metaMut = metadata as MutableJsonObject;
    const current = metaMut['stopCount'];
    if (typeof current !== 'number') {
      throw new Error('Fixture metadata.stopCount must be a number.');
    }
    metaMut['stopCount'] = current + 1;

    expectIssueInEnvelope(payload, 'invalid-metadata-counts');
  });

  it('accepts includedTimeBandIds that match configured service plans in canonical order', () => {
    const candidate = readFixtureCandidate();

    const result = validateSelectedLineExportPayload(candidate);

    expect(result.ok).toBe(true);
  });

  it('requires canonical includedTimeBandIds when all service plans are no-service', () => {
    const payload = cloneFixturePayload();
    const line = payload['line'];
    if (typeof line !== 'object' || line === null) {
      throw new Error('Fixture line must be an object.');
    }
    (line as MutableJsonObject)['frequencyByTimeBand'] = {
      'morning-rush': { kind: 'no-service' },
      'late-morning': { kind: 'no-service' },
      midday: { kind: 'no-service' },
      afternoon: { kind: 'no-service' },
      'evening-rush': { kind: 'no-service' },
      evening: { kind: 'no-service' },
      night: { kind: 'no-service' }
    };
    const metadata = payload['metadata'];
    if (typeof metadata !== 'object' || metadata === null) {
      throw new Error('Fixture metadata must be an object.');
    }
    (metadata as MutableJsonObject)['includedTimeBandIds'] = [
      'morning-rush',
      'late-morning',
      'midday',
      'afternoon',
      'evening-rush',
      'evening',
      'night'
    ];

    const result = validateSelectedLineExportPayload(wrapInEnvelope(payload));

    expect(result.ok).toBe(true);
  });

  it('allows no-service plans and counts them as configured in includedTimeBandIds', () => {
    const payload = cloneFixturePayload();
    const line = payload['line'];
    if (typeof line !== 'object' || line === null) {
      throw new Error('Fixture line must be an object.');
    }
    const lineMut = line as MutableJsonObject;
    const existingFreq = lineMut['frequencyByTimeBand'];
    if (typeof existingFreq !== 'object' || existingFreq === null) {
      throw new Error('Fixture frequencyByTimeBand must be an object.');
    }
    lineMut['frequencyByTimeBand'] = {
      ...(existingFreq as Record<string, unknown>),
      evening: { kind: 'no-service' },
      night: { kind: 'no-service' }
    };
    const metadata = payload['metadata'];
    if (typeof metadata !== 'object' || metadata === null) {
      throw new Error('Fixture metadata must be an object.');
    }
    (metadata as MutableJsonObject)['includedTimeBandIds'] = [
      'morning-rush',
      'late-morning',
      'midday',
      'afternoon',
      'evening-rush',
      'evening',
      'night'
    ];

    const result = validateSelectedLineExportPayload(wrapInEnvelope(payload));

    expect(result.ok).toBe(true);
  });

  it('fails when frequency plan headwayMinutes is not positive', () => {
    const payload = cloneFixturePayload();
    const line = payload['line'];
    if (typeof line !== 'object' || line === null) {
      throw new Error('Fixture line must be an object.');
    }
    const lineMut = line as MutableJsonObject;
    const existingFreq = lineMut['frequencyByTimeBand'];
    if (typeof existingFreq !== 'object' || existingFreq === null) {
      throw new Error('Fixture frequencyByTimeBand must be an object.');
    }
    lineMut['frequencyByTimeBand'] = {
      ...(existingFreq as Record<string, unknown>),
      midday: { kind: 'frequency', headwayMinutes: 0 }
    };

    expectIssueInEnvelope(payload, 'invalid-frequency-value');
  });

  it('rejects v4 payload that contains routeSegments', () => {
    const payload = cloneFixturePayload();
    const line = payload['line'] as MutableJsonObject;
    line['routeSegments'] = [];

    expectIssueInEnvelope(payload, 'invalid-route-segments');
  });

  it('rejects v4 payload with non-zero routeSegmentCount', () => {
    const payload = cloneFixturePayload();
    const metadata = payload['metadata'] as MutableJsonObject;
    metadata['routeSegmentCount'] = 1;

    expectIssueInEnvelope(payload, 'invalid-metadata-counts');
  });

  it('rejects envelope with non-object payload', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['payload'] = 'not-an-object';

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope')).toBe(true);
    }
  });

  it('rejects envelope missing exportedAt', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    delete envelope['exportedAt'];

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-exported-at')).toBe(true);
    }
  });

  it('rejects envelope with non-string exportedAt', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['exportedAt'] = 12345;

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-exported-at')).toBe(true);
    }
  });

  it('rejects envelope with unparseable exportedAt', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['exportedAt'] = 'not-a-date';

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-exported-at')).toBe(true);
    }
  });

  it('rejects envelope missing app', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    delete envelope['app'];

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-app')).toBe(true);
    }
  });

  it('rejects envelope with non-object app', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['app'] = 'OpenVayra - Cities';

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-app')).toBe(true);
    }
  });

  it('rejects envelope missing app.name', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['app'] = {};

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-app-name')).toBe(true);
    }
  });

  it('rejects envelope with app.name !== "OpenVayra - Cities"', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['app'] = { name: 'NotOpenVayra - Cities' };

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-app-name')).toBe(true);
    }
  });

  it('rejects envelope with non-string app.build', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['app'] = { name: 'OpenVayra - Cities', build: 123 };

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope-app-build')).toBe(true);
    }
  });

  it('accepts envelope with valid string app.build', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['app'] = { name: 'OpenVayra - Cities', build: 'v1.2.3-abcd' };

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(true);
  });

  it('rejects envelope with unknown schema', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['schema'] = 'unknown-schema';

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope')).toBe(true);
    }
  });

  it('rejects envelope with unsupported schema version', () => {
    const envelope = wrapInEnvelope(cloneFixturePayload());
    envelope['schemaVersion'] = 999;

    const result = validateSelectedLineExportPayload(envelope);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some(i => i.code === 'invalid-envelope')).toBe(true);
    }
  });
});
