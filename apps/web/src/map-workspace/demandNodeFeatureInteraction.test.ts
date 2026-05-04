import { describe, expect, it } from 'vitest';
import { 
  decodeDemandNodeIdFromFeature, 
  decodeDemandNodeIdFromFeatureProperties 
} from './demandNodeFeatureInteraction';
import type { DemandNodeFeatureInteractionFeature } from './demandNodeFeatureInteraction';

const createMockFeature = (
  properties?: Record<string, unknown>
): DemandNodeFeatureInteractionFeature => (
  properties ? { properties } : {}
);

describe('decodeDemandNodeIdFromFeatureProperties', () => {
  it('returns null for undefined properties', () => {
    expect(decodeDemandNodeIdFromFeatureProperties(undefined)).toBeNull();
  });

  it('returns entityId for valid properties', () => {
    const properties = {
      entityId: 'node-123',
      entityKind: 'node',
      label: 'Node 123'
    };

    expect(decodeDemandNodeIdFromFeatureProperties(properties)).toBe('node-123');
  });

  it('returns null for missing entityId', () => {
    const properties: Record<string, unknown> = {
      entityKind: 'node',
      label: 'Node 123'
    };

    expect(decodeDemandNodeIdFromFeatureProperties(properties)).toBeNull();
  });

  it('returns null for non-string entityId', () => {
    const properties: Record<string, unknown> = {
      entityId: 123,
      entityKind: 'node'
    };

    expect(decodeDemandNodeIdFromFeatureProperties(properties)).toBeNull();
  });

  it('returns null for empty entityId', () => {
    const properties = {
      entityId: '',
      entityKind: 'node'
    };

    expect(decodeDemandNodeIdFromFeatureProperties(properties)).toBeNull();
  });
});

describe('decodeDemandNodeIdFromFeature', () => {
  it('returns null for undefined feature', () => {
    expect(decodeDemandNodeIdFromFeature(undefined)).toBeNull();
  });

  it('returns null for feature without properties', () => {
    expect(decodeDemandNodeIdFromFeature(createMockFeature(undefined))).toBeNull();
  });

  it('returns entityId for valid scenario demand node feature', () => {
    const mockFeature = {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [0, 0] as [number, number] },
      properties: {
        entityId: 'node-123',
        entityKind: 'node' as const,
        label: 'Node 123',
        roleOrCategory: 'origin',
        scale: 'n/a',
        weight: 1.0
      }
    };

    expect(decodeDemandNodeIdFromFeature(mockFeature)).toBe('node-123');
  });

  it('returns null for malformed entityId', () => {
    const mockFeature = {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [0, 0] as [number, number] },
      properties: {
        entityId: '',
        entityKind: 'node' as const,
        label: 'Node 123',
        roleOrCategory: 'origin',
        scale: 'n/a',
        weight: 1.0
      }
    };

    expect(decodeDemandNodeIdFromFeature(mockFeature)).toBeNull();
  });
});
