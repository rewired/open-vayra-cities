import { describe, expect, it } from 'vitest';
import { generateLineLabel, generateUniqueLineLabel } from './lineLabeling';
import { createLineId, type Line } from '../types/line';
import { createStopId, type Stop } from '../types/stop';

describe('lineLabeling', () => {
  const mockStopA: Stop = { id: createStopId('stop-1'), label: 'Millerntorplatz', position: { lng: 0, lat: 0 } };
  const mockStopB: Stop = { id: createStopId('stop-2'), label: 'Reeperbahn', position: { lng: 0.1, lat: 0.1 } };

  describe('generateLineLabel', () => {
    it('generates a linear one-way label', () => {
      const label = generateLineLabel([mockStopA, mockStopB], 'linear', 'one-way');
      expect(label).toBe('Millerntorplatz → Reeperbahn');
    });

    it('generates a linear bidirectional label', () => {
      const label = generateLineLabel([mockStopA, mockStopB], 'linear', 'bidirectional');
      expect(label).toBe('Millerntorplatz ↔ Reeperbahn');
    });

    it('generates a loop label from the first stop', () => {
      const label = generateLineLabel([mockStopA, mockStopB], 'loop', 'one-way');
      expect(label).toBe('Millerntorplatz Loop');
    });

    it('returns null for insufficient stops', () => {
      const label = generateLineLabel([mockStopA], 'linear', 'one-way');
      expect(label).toBeNull();
    });
  });

  describe('generateUniqueLineLabel', () => {
    const existingLines: Line[] = [
      {
        id: createLineId('line-1'),
        label: 'Millerntorplatz ↔ Reeperbahn',
        stopIds: [],
        topology: 'linear',
        servicePattern: 'bidirectional',
        routeSegments: [],
        frequencyByTimeBand: {} as any
      }
    ];

    it('returns base label when no collision exists', () => {
      const label = generateUniqueLineLabel({
        baseLabel: 'Other Line',
        existingLines
      });
      expect(label).toBe('Other Line');
    });

    it('adds a numeric suffix on collision', () => {
      const label = generateUniqueLineLabel({
        baseLabel: 'Millerntorplatz ↔ Reeperbahn',
        existingLines
      });
      expect(label).toBe('Millerntorplatz ↔ Reeperbahn 1');
    });

    it('increments suffix for multiple collisions', () => {
      const linesWithSuffix: Line[] = [
        ...existingLines,
        { ...existingLines[0], label: 'Millerntorplatz ↔ Reeperbahn 1' } as Line
      ];
      const label = generateUniqueLineLabel({
        baseLabel: 'Millerntorplatz ↔ Reeperbahn',
        existingLines: linesWithSuffix
      });
      expect(label).toBe('Millerntorplatz ↔ Reeperbahn 2');
    });
  });
});
