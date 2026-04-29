import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { convertSelectedLineExportPayloadToSession } from './selectedLineExportSessionLoader';
import { validateSelectedLineExportPayload } from './selectedLineExportValidation';
import { NETWORK_SAVE_SCHEMA, NETWORK_SAVE_SCHEMA_VERSION } from '../types/networkSave';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const getFixturePath = (version: 'v4'): string => 
  resolve(currentDirPath, `../../../../../data/fixtures/selected-line-exports/hamburg-line-1.${version}.json`);

/**
 * Reads the raw v4 fixture file as an `unknown` candidate without any typed assumption.
 */
const readFixtureCandidate = (): unknown =>
  JSON.parse(readFileSync(getFixturePath('v4'), 'utf-8'));

const getValidatedFixturePayload = () => {
  const candidate = readFixtureCandidate();
  const validationResult = validateSelectedLineExportPayload(candidate);
  expect(validationResult.ok).toBe(true);
  if (!validationResult.ok) {
    throw new Error('Expected committed fixture to validate.');
  }

  return validationResult.payload;
};

describe('convertSelectedLineExportPayloadToSession', () => {
  it('converts a validated v4 payload into one completed line and mapped stops', () => {
    const conversionResult = convertSelectedLineExportPayloadToSession(getValidatedFixturePayload());

    expect(conversionResult.ok).toBe(true);
    if (!conversionResult.ok) {
      return;
    }

    expect(conversionResult.session.sessionLines).toHaveLength(1);
    expect(conversionResult.session.placedStops.length).toBeGreaterThan(0);
    expect(conversionResult.session.sessionLines[0].routeSegments).toEqual([]);
  });

  it('preserves explicit no-service plans during conversion', () => {
    const validatedPayload = getValidatedFixturePayload();
    const noServicePayload = {
      ...validatedPayload,
      line: {
        ...validatedPayload.line,
        frequencyByTimeBand: Object.fromEntries(
          Object.keys(validatedPayload.line.frequencyByTimeBand).map((timeBandId) => [timeBandId, { kind: 'no-service' }])
        ) as typeof validatedPayload.line.frequencyByTimeBand
      },
      metadata: {
        ...validatedPayload.metadata,
        includedTimeBandIds: Object.keys(validatedPayload.line.frequencyByTimeBand) as typeof validatedPayload.metadata.includedTimeBandIds
      }
    };

    const validationResult = validateSelectedLineExportPayload({
      schema: NETWORK_SAVE_SCHEMA,
      schemaVersion: NETWORK_SAVE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      app: { name: 'OpenVayra - Cities' },
      payload: noServicePayload
    });
    expect(validationResult.ok).toBe(true);
    if (!validationResult.ok) {
      return;
    }

    const conversionResult = convertSelectedLineExportPayloadToSession(validationResult.payload);
    expect(conversionResult.ok).toBe(true);
    if (!conversionResult.ok) {
      return;
    }

    expect(Object.values(conversionResult.session.sessionLines[0].frequencyByTimeBand).every((plan) => plan.kind === 'no-service')).toBe(true);
  });
});
