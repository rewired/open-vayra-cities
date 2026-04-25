import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MVP_TIME_BAND_IDS } from '../domain/constants/timeBands';
import type {
  LineFrequencyControlByTimeBand,
  LineFrequencyInputByTimeBand,
  LineFrequencyValidationByTimeBand
} from '../session/useNetworkSessionState';
import { FrequencyEditorDialog } from './FrequencyEditorDialog';

const createInputState = (value: string): LineFrequencyInputByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, value])) as LineFrequencyInputByTimeBand;

const createValidationState = (value: string | null): LineFrequencyValidationByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, value])) as LineFrequencyValidationByTimeBand;

const createControlState = (value: 'frequency' | 'no-service'): LineFrequencyControlByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, value])) as LineFrequencyControlByTimeBand;

describe('FrequencyEditorDialog', () => {
  it('renders compact service plan copy with required column order and no legacy third-state wording', () => {
    const markup = renderToStaticMarkup(
      <FrequencyEditorDialog
        open
        onClose={() => {}}
        lineFrequencyInputByTimeBand={createInputState('')}
        lineFrequencyControlByTimeBand={createControlState('no-service')}
        lineFrequencyValidationByTimeBand={createValidationState(null)}
        onFrequencyChange={() => {}}
      />
    );

    expect(markup).toContain('Edit service plan');
    expect(markup).toContain('Set an interval for bands that operate, or choose no service for bands without departures.');
    expect(markup).toContain('WINDOW');
    expect(markup).toContain('TIME BAND');
    expect(markup).toContain('SERVICE');
    expect(markup).toContain('Interval');
    expect(markup).toContain('No service');
    expect(markup).not.toContain('Unset');
    expect(markup).not.toContain('Minutes');
  });

  it('renders frequency rows with editable minute value and active interval control', () => {
    const markup = renderToStaticMarkup(
      <FrequencyEditorDialog
        open
        onClose={() => {}}
        lineFrequencyInputByTimeBand={createInputState('10')}
        lineFrequencyControlByTimeBand={createControlState('frequency')}
        lineFrequencyValidationByTimeBand={createValidationState(null)}
        onFrequencyChange={() => {}}
      />
    );

    expect(markup).toContain('value="10"');
    expect(markup).toContain('data-active="true">Interval');
    expect(markup).not.toContain('disabled=""');
  });

  it('renders no-service rows with active no-service control and muted dash interval display', () => {
    const markup = renderToStaticMarkup(
      <FrequencyEditorDialog
        open
        onClose={() => {}}
        lineFrequencyInputByTimeBand={createInputState('12')}
        lineFrequencyControlByTimeBand={createControlState('no-service')}
        lineFrequencyValidationByTimeBand={createValidationState(null)}
        onFrequencyChange={() => {}}
      />
    );

    expect(markup).toContain('value="–"');
    expect(markup).toContain('data-active="true">No service');
    expect(markup).toContain('disabled=""');
  });
});
