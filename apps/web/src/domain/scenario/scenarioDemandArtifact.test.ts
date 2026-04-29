import { describe, expect, test } from 'vitest';
import { parseScenarioDemandArtifact } from './scenarioDemandArtifact';

describe('parseScenarioDemandArtifact', () => {
  const validTimeBandWeights = {
    'morning-rush': 1.0,
    'late-morning': 0.8,
    'midday': 0.9,
    'afternoon': 1.1,
    'evening-rush': 1.2,
    'evening': 0.7,
    'night': 0.3
  };

  const validArtifact = {
    schemaVersion: 1,
    scenarioId: 'hamburg-core-mvp',
    generatedAt: '2026-04-29T12:00:00Z',
    sourceMetadata: {
      generatedFrom: [
        {
          sourceKind: 'census',
          label: 'Zensus 2022',
          datasetYear: 2022
        }
      ],
      generatorName: 'DemandGen',
      generatorVersion: '1.0.0'
    },
    nodes: [
      {
        id: 'node-1',
        position: { lng: 10.0, lat: 53.5 },
        role: 'origin',
        class: 'residential',
        baseWeight: 100,
        timeBandWeights: validTimeBandWeights
      }
    ],
    attractors: [
      {
        id: 'attractor-1',
        position: { lng: 10.1, lat: 53.6 },
        category: 'workplace',
        scale: 'major',
        sourceWeight: 50,
        sinkWeight: 200
      }
    ],
    gateways: [
      {
        id: 'gateway-1',
        position: { lng: 9.9, lat: 53.4 },
        kind: 'rail-station',
        scale: 'metropolitan',
        sourceWeight: 500,
        sinkWeight: 400,
        transferWeight: 300,
        timeBandWeights: validTimeBandWeights
      }
    ]
  };

  test('parses valid minimal artifact correctly', () => {
    const parsed = parseScenarioDemandArtifact(validArtifact);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.nodes.length).toBe(1);
    expect(parsed.attractors.length).toBe(1);
    expect(parsed.gateways.length).toBe(1);
  });

  test('requires all canonical MVP time bands in time-band weights', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    delete invalidArtifact.nodes[0].timeBandWeights['night'];
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('missing or invalid non-negative weight for time band night');
  });

  test('rejects invalid node role', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].role = 'invalid-role';
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('holds invalid role');
  });

  test('rejects invalid node class', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].class = 'invalid-class';
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('holds invalid class');
  });

  test('rejects missing arrays', () => {
    const invalidArtifact = { ...validArtifact, nodes: undefined };
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('Demand artifact missing nodes array');
  });

  test('rejects negative weights', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].baseWeight = -1;
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('requires non-negative numeric baseWeight');
  });

  test('rejects non-finite weights', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].baseWeight = Infinity;
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('requires non-negative numeric baseWeight');
  });

  test('rejects invalid coordinates', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].position.lng = 'string';
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('position lng must be a finite number');
  });

  test('rejects duplicate ids across entities', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.attractors[0].id = 'node-1'; // Same as node-1 id
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('Duplicate entity ID detected: node-1');
  });

  test('rejects NaN weights', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].baseWeight = NaN;
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('requires non-negative numeric baseWeight');
  });

  test('rejects -Infinity weights', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].baseWeight = -Infinity;
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('requires non-negative numeric baseWeight');
  });

  test('rejects invalid sourceTrace (non-object)', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].sourceTrace = 'invalid';
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('holds invalid sourceTrace');
  });

  test('rejects invalid sourceTrace (non-JSON value)', () => {
    const invalidArtifact = JSON.parse(JSON.stringify(validArtifact));
    invalidArtifact.nodes[0].sourceTrace = { invalidFunc: () => {} };
    expect(() => parseScenarioDemandArtifact(invalidArtifact)).toThrow('holds invalid sourceTrace');
  });

  test('parses optional source metadata correctly', () => {
    const artifactWithOptional = JSON.parse(JSON.stringify(validArtifact));
    artifactWithOptional.sourceMetadata.notes = 'Generated for testing';
    artifactWithOptional.sourceMetadata.generatedFrom[0].licenseHint = 'ODbL';
    const parsed = parseScenarioDemandArtifact(artifactWithOptional);
    expect(parsed.sourceMetadata.notes).toBe('Generated for testing');
    expect(parsed.sourceMetadata.generatedFrom[0]?.licenseHint).toBe('ODbL');
  });
});
