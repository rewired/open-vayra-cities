import { describe, expect, it } from 'vitest';

import { createMinuteOfDay } from '../types/timeBand';
import { resolveTimeBandIdForMinuteOfDay, TIME_BAND_DEFINITIONS } from './timeBands';

describe('TIME_BAND_DEFINITIONS', () => {
  it('uses canonical ordered ids and labels with exact minute windows', () => {
    expect(TIME_BAND_DEFINITIONS).toEqual([
      {
        id: 'morning-rush',
        label: 'Morning rush',
        startMinuteOfDay: createMinuteOfDay(360),
        endMinuteOfDay: createMinuteOfDay(540)
      },
      {
        id: 'late-morning',
        label: 'Late morning',
        startMinuteOfDay: createMinuteOfDay(540),
        endMinuteOfDay: createMinuteOfDay(660)
      },
      {
        id: 'midday',
        label: 'Midday',
        startMinuteOfDay: createMinuteOfDay(660),
        endMinuteOfDay: createMinuteOfDay(840)
      },
      {
        id: 'afternoon',
        label: 'Afternoon',
        startMinuteOfDay: createMinuteOfDay(840),
        endMinuteOfDay: createMinuteOfDay(960)
      },
      {
        id: 'evening-rush',
        label: 'Evening rush',
        startMinuteOfDay: createMinuteOfDay(960),
        endMinuteOfDay: createMinuteOfDay(1140)
      },
      {
        id: 'evening',
        label: 'Evening',
        startMinuteOfDay: createMinuteOfDay(1140),
        endMinuteOfDay: createMinuteOfDay(1380)
      },
      {
        id: 'night',
        label: 'Night',
        startMinuteOfDay: createMinuteOfDay(1380),
        endMinuteOfDay: createMinuteOfDay(360)
      }
    ]);
  });
});

describe('resolveTimeBandIdForMinuteOfDay', () => {
  it('resolves midnight-crossing night boundaries using start-inclusive end-exclusive windows', () => {
    expect(resolveTimeBandIdForMinuteOfDay(createMinuteOfDay(22 * 60 + 59), TIME_BAND_DEFINITIONS)).toBe('evening');
    expect(resolveTimeBandIdForMinuteOfDay(createMinuteOfDay(23 * 60), TIME_BAND_DEFINITIONS)).toBe('night');
    expect(resolveTimeBandIdForMinuteOfDay(createMinuteOfDay(0), TIME_BAND_DEFINITIONS)).toBe('night');
    expect(resolveTimeBandIdForMinuteOfDay(createMinuteOfDay(5 * 60 + 59), TIME_BAND_DEFINITIONS)).toBe('night');
    expect(resolveTimeBandIdForMinuteOfDay(createMinuteOfDay(6 * 60), TIME_BAND_DEFINITIONS)).toBe('morning-rush');
  });
});
