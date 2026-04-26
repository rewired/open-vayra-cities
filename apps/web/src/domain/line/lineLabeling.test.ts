import { describe, expect, it } from 'vitest';
import { generateLineLabel, generateUniqueLineLabel, normalizeAcceptedLineLabel } from './lineLabeling';
import { createLineId, createNoServiceLineServiceByTimeBand, type Line } from '../types/line';
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

    it('returns null when first stop label is undefined', () => {
      const stopNoLabel: Stop = { id: createStopId('stop-nolabel'), position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([stopNoLabel, mockStopB], 'linear', 'one-way');
      expect(label).toBeNull();
    });

    it('returns null when last stop label is undefined', () => {
      const stopNoLabel: Stop = { id: createStopId('stop-nolabel'), position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([mockStopA, stopNoLabel], 'linear', 'one-way');
      expect(label).toBeNull();
    });

    it('returns null when last stop label is undefined for bidirectional', () => {
      const stopNoLabel: Stop = { id: createStopId('stop-nolabel'), position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([mockStopA, stopNoLabel], 'linear', 'bidirectional');
      expect(label).toBeNull();
    });

    it('returns null when first stop label is whitespace-only', () => {
      const stopBlankLabel: Stop = { id: createStopId('stop-blank'), label: '   ', position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([stopBlankLabel, mockStopB], 'linear', 'one-way');
      expect(label).toBeNull();
    });

    it('returns null when last stop label is whitespace-only for linear one-way', () => {
      const stopBlankLabel: Stop = { id: createStopId('stop-blank'), label: '   ', position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([mockStopA, stopBlankLabel], 'linear', 'one-way');
      expect(label).toBeNull();
    });

    it('returns null when first stop label is undefined for loop', () => {
      const stopNoLabel: Stop = { id: createStopId('stop-nolabel'), position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([stopNoLabel, mockStopB], 'loop', 'one-way');
      expect(label).toBeNull();
    });

    it('trims and collapses whitespace in generated labels', () => {
      const stopWithPad: Stop = { id: createStopId('stop-pad'), label: '  Millerntorplatz  ', position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([stopWithPad, mockStopB], 'linear', 'one-way');
      expect(label).toBe('Millerntorplatz → Reeperbahn');
    });

    it('trims and collapses inner whitespace in generated labels', () => {
      const stopWithInnerSpace: Stop = { id: createStopId('stop-inner'), label: 'Millerntor  platz', position: { lng: 0, lat: 0 } };
      const label = generateLineLabel([stopWithInnerSpace, mockStopB], 'linear', 'one-way');
      expect(label).toBe('Millerntor platz → Reeperbahn');
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
        frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
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

describe('normalizeAcceptedLineLabel', () => {
  it('normalizes bidirectional and directional tokens in the required order', () => {
    expect(normalizeAcceptedLineLabel('Hbf <-> Altona')).toBe('Hbf ↔ Altona');
    expect(normalizeAcceptedLineLabel('Hbf <> Altona')).toBe('Hbf ↔ Altona');
    expect(normalizeAcceptedLineLabel('Hbf -> HafenCity')).toBe('Hbf → HafenCity');
    expect(normalizeAcceptedLineLabel('Hbf > HafenCity')).toBe('Hbf → HafenCity');
  });

  it('trims the final label after normalization', () => {
    expect(normalizeAcceptedLineLabel('  Hbf -> HafenCity  ')).toBe('Hbf → HafenCity');
  });
});
