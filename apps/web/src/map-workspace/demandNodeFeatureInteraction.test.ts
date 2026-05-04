import { describe, expect, it } from 'vitest';
import { 
  decodeDemandNodeIdFromFeature, 
  decodeDemandNodeIdFromFeatureProperties 
} from './demandNodeFeatureInteraction';

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
    const properties = {
      entityKind: 'node',
      label: 'Node 123'
    };

    expect(decodeDemandNodeIdFromFeatureProperties(properties as Record<string, unknown>)).toBeNull();
  });

  it('returns null for non-string entityId', () => {
    const properties = {
      entityId: 123,
      entityKind: 'node'
    };

    expect(decodeDemandNodeIdFromFeatureProperties(properties as Record<string, unknown>)).toBeNull();
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
    expect(decodeDemandNodeIdFromFeature({ type: 'Feature' } as unknown as import('./maplibreGlobal').MapLibreGeoJsonFeature<import('./scenarioDemandPreviewGeoJson').ScenarioDemandPreviewFeatureProperties>)).toBeNull();
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
