import { describe, it, expect } from 'vitest';
import { buildScenarioDemandPreviewFeatureCollection } from './scenarioDemandPreviewGeoJson';
import type { ScenarioDemandArtifact } from '../domain/types/scenarioDemand';

describe('buildScenarioDemandPreviewFeatureCollection', () => {
  it('returns an empty feature collection when artifact is null', () => {
    const result = buildScenarioDemandPreviewFeatureCollection(null);
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(0);
  });

  it('returns deterministic point features for nodes, attractors, and gateways', () => {
    const mockArtifact: ScenarioDemandArtifact = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      generatedAt: '2026-04-29T00:00:00Z',
      sourceMetadata: {
        generatedFrom: [],
        generatorName: 'test-gen',
        generatorVersion: '1.0.0'
      },
      nodes: [
        {
          id: 'node-1',
          position: { lng: 10.0, lat: 53.5 },
          role: 'origin',
          class: 'residential',
          baseWeight: 10,
          timeBandWeights: { 'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1 }
        },
        {
          id: 'attractor-1',
          position: { lng: 10.1, lat: 53.6 },
          role: 'destination',
          class: 'workplace',
          baseWeight: 20,
          timeBandWeights: { 'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1 }
        },
        {
          id: 'gateway-1',
          position: { lng: 10.2, lat: 53.7 },
          role: 'bidirectional',
          class: 'gateway',
          baseWeight: 30,
          timeBandWeights: { 'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1 }
        }
      ],
      attractors: [],
      gateways: []
    };

    const result = buildScenarioDemandPreviewFeatureCollection(mockArtifact);

    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(3);

    // Order Check: nodes, attractors, gateways
    expect(result.features[0]!.properties.entityKind).toBe('node');
    expect(result.features[1]!.properties.entityKind).toBe('attractor');
    expect(result.features[2]!.properties.entityKind).toBe('gateway');

    // Node Check
    const nodeFeature = result.features[0]!;
    expect(nodeFeature.geometry.type).toBe('Point');
    expect(nodeFeature.geometry.coordinates).toEqual([10.0, 53.5]);
    expect(nodeFeature.properties.entityId).toBe('node-1');
    expect(nodeFeature.properties.roleOrCategory).toBe('origin');
    expect(nodeFeature.properties.weight).toBe(10);
    expect(nodeFeature.properties.isOriginNode).toBe(true);
    expect(nodeFeature.properties.isDestinationNode).toBe(false);

    // Attractor Check
    const attractorFeature = result.features[1]!;
    expect(attractorFeature.geometry.coordinates).toEqual([10.1, 53.6]);
    expect(attractorFeature.properties.entityId).toBe('attractor-1');
    expect(attractorFeature.properties.attractorCategory).toBe('workplace');
    expect(attractorFeature.properties.scale).toBe('n/a');
    expect(attractorFeature.properties.weight).toBe(20);

    // Gateway Check
    const gatewayFeature = result.features[2]!;
    expect(gatewayFeature.geometry.coordinates).toEqual([10.2, 53.7]);
    expect(gatewayFeature.properties.entityId).toBe('gateway-1');
    expect(gatewayFeature.properties.gatewayKind).toBe('other');
    expect(gatewayFeature.properties.scale).toBe('n/a');
    expect(gatewayFeature.properties.weight).toBe(30);
  });

  it('caps feature collection size using deterministic thinning', () => {
    const mockArtifact: ScenarioDemandArtifact = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      generatedAt: '2026-04-29T00:00:00Z',
      sourceMetadata: {
        generatedFrom: [],
        generatorName: 'test-gen',
        generatorVersion: '1.0.0'
      },
      nodes: Array.from({ length: 3000 }, (_, i) => ({
        id: `node-${i}`,
        position: { lng: 10.0, lat: 53.5 },
        role: 'origin',
        class: 'residential',
        baseWeight: 10,
        timeBandWeights: { 'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1 }
      })),
      attractors: [],
      gateways: []
    };

    const result = buildScenarioDemandPreviewFeatureCollection(mockArtifact);
    expect(result.features).toHaveLength(2000);
  });
});
