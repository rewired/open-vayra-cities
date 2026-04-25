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

const readFixturePayload = (): SelectedLineExportPayload =>
  JSON.parse(readFileSync(fixturePath, 'utf-8')) as SelectedLineExportPayload;

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
  it('validates the committed Hamburg fixture through the existing validator', () => {
    const fixturePayload = readFixturePayload();

    const validationResult = validateSelectedLineExportPayload(fixturePayload);

    expect(validationResult.ok).toBe(true);
  });

  it('converts a valid selected-line export into exactly one completed line and mapped stops', () => {
    const validatedPayload = getValidatedFixturePayload();

    const conversionResult = convertSelectedLineExportPayloadToSession(validatedPayload);

    expect(conversionResult.ok).toBe(true);
    if (!conversionResult.ok) {
      return;
    }

    expect(conversionResult.session.sessionLines).toHaveLength(1);
    expect(conversionResult.session.placedStops).toHaveLength(validatedPayload.stops.length);
  });

  it('preserves stop ids, line id, ordered stop ids, frequency map, route segments, and stop labels', () => {
    const validatedPayload = getValidatedFixturePayload();

    const conversionResult = convertSelectedLineExportPayloadToSession(validatedPayload);

    expect(conversionResult.ok).toBe(true);
    if (!conversionResult.ok) {
      return;
    }

    const convertedLine = conversionResult.session.sessionLines[0];

    expect(conversionResult.session.placedStops.map((stop) => stop.id)).toEqual(
      validatedPayload.stops.map((stop) => stop.id)
    );
    expect(conversionResult.session.placedStops.map((stop) => stop.label ?? null)).toEqual(
      validatedPayload.stops.map((stop) => stop.label ?? null)
    );
    expect(convertedLine.id).toBe(validatedPayload.line.id);
    expect(convertedLine.stopIds).toEqual(validatedPayload.line.orderedStopIds);
    expect(convertedLine.frequencyByTimeBand).toEqual(
      Object.fromEntries(
        Object.entries(validatedPayload.line.frequencyByTimeBand).map(([timeBandId, frequency]) => [
          timeBandId,
          frequency === null ? { kind: 'unset' } : { kind: 'frequency', headwayMinutes: frequency }
        ])
      )
    );
    expect(convertedLine.routeSegments).toEqual(validatedPayload.line.routeSegments);
  });

  it('returns deterministic conversion results', () => {
    const validatedPayload = getValidatedFixturePayload();

    const firstConversionResult = convertSelectedLineExportPayloadToSession(validatedPayload);
    const secondConversionResult = convertSelectedLineExportPayloadToSession(validatedPayload);

    expect(firstConversionResult).toEqual(secondConversionResult);
  });

  it('preserves all-null frequency values when the validated payload provides null frequencies', () => {
    const validatedPayload = getValidatedFixturePayload();
    const allNullFrequencyPayload: SelectedLineExportPayload = {
      ...validatedPayload,
      line: {
        ...validatedPayload.line,
        frequencyByTimeBand: {
          'morning-rush': null,
          'late-morning': null,
          midday: null,
          afternoon: null,
          'evening-rush': null,
          evening: null,
          night: null
        }
      },
      metadata: {
        ...validatedPayload.metadata,
        includedTimeBandIds: []
      }
    };
    const allNullValidationResult = validateSelectedLineExportPayload(allNullFrequencyPayload);
    expect(allNullValidationResult.ok).toBe(true);
    if (!allNullValidationResult.ok) {
      return;
    }

    const conversionResult = convertSelectedLineExportPayloadToSession(allNullValidationResult.payload);

    expect(conversionResult.ok).toBe(true);
    if (!conversionResult.ok) {
      return;
    }

    const convertedLine = conversionResult.session.sessionLines[0];
    expect(Object.values(convertedLine.frequencyByTimeBand).every((bandPlan) => bandPlan.kind === 'unset')).toBe(true);
  });

  it('does not convert invalid validation results into session state', () => {
    const fixturePayload = readFixturePayload();
    const invalidPayload: SelectedLineExportPayload = {
      ...fixturePayload,
      line: {
        ...fixturePayload.line,
        orderedStopIds: [
          ...fixturePayload.line.orderedStopIds,
          'stop-missing' as SelectedLineExportPayload['line']['orderedStopIds'][number]
        ]
      }
    };

    const validationResult = validateSelectedLineExportPayload(invalidPayload);

    expect(validationResult.ok).toBe(false);
    if (validationResult.ok) {
      return;
    }

    expect(validationResult.issues[0]?.message.length).toBeGreaterThan(0);
  });

  it('fails conversion when referenced ordered stops are missing even if a payload was forced as validated', () => {
    const validatedPayload = getValidatedFixturePayload();
    const forcedInvalidPayload = {
      ...validatedPayload,
      stops: validatedPayload.stops.slice(1)
    } as SelectedLineExportPayload;

    const conversionResult = convertSelectedLineExportPayloadToSession(forcedInvalidPayload);

    expect(conversionResult.ok).toBe(false);
    if (!conversionResult.ok) {
      expect(conversionResult.issue.code).toBe('missing-referenced-stop');
    }
  });
});
