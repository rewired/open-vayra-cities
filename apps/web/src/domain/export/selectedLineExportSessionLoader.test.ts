import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { convertSelectedLineExportPayloadToSession } from './selectedLineExportSessionLoader';
import { validateSelectedLineExportPayload } from './selectedLineExportValidation';
import type { SelectedLineExportPayload } from '../types/selectedLineExport';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const fixturePath = resolve(currentDirPath, '../../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json');

const readFixturePayload = (): SelectedLineExportPayload => {
  const payload = JSON.parse(readFileSync(fixturePath, 'utf-8')) as any;
  // Patch old v2 fixture to satisfy v3 validation during migration
  payload.schemaVersion = 'cityops-selected-line-export-v3';
  payload.line.topology = payload.line.topology ?? 'linear';
  payload.line.servicePattern = payload.line.servicePattern ?? 'one-way';
  return payload as SelectedLineExportPayload;
};

const getValidatedFixturePayload = (): SelectedLineExportPayload => {
  const fixturePayload = readFixturePayload();
  const validationResult = validateSelectedLineExportPayload(fixturePayload);
  expect(validationResult.ok).toBe(true);
  if (!validationResult.ok) {
    throw new Error('Expected committed fixture to validate.');
  }

  return validationResult.payload;
};

describe('convertSelectedLineExportPayloadToSession', () => {
  it('converts a validated payload into one completed line and mapped stops', () => {
    const conversionResult = convertSelectedLineExportPayloadToSession(getValidatedFixturePayload());

    expect(conversionResult.ok).toBe(true);
    if (!conversionResult.ok) {
      return;
    }

    expect(conversionResult.session.sessionLines).toHaveLength(1);
    expect(conversionResult.session.placedStops.length).toBeGreaterThan(0);
  });

  it('preserves explicit no-service plans during conversion', () => {
    const validatedPayload = getValidatedFixturePayload();
    const noServicePayload: SelectedLineExportPayload = {
      ...validatedPayload,
      line: {
        ...validatedPayload.line,
        frequencyByTimeBand: Object.fromEntries(
          Object.keys(validatedPayload.line.frequencyByTimeBand).map((timeBandId) => [timeBandId, { kind: 'no-service' }])
        ) as SelectedLineExportPayload['line']['frequencyByTimeBand']
      },
      metadata: {
        ...validatedPayload.metadata,
        includedTimeBandIds: Object.keys(validatedPayload.line.frequencyByTimeBand) as SelectedLineExportPayload['metadata']['includedTimeBandIds']
      }
    };

    const validationResult = validateSelectedLineExportPayload(noServicePayload);
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
