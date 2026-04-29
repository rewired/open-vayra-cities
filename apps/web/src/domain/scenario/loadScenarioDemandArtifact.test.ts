import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadScenarioDemandArtifact } from './loadScenarioDemandArtifact';

const validArtifactFixture = {
  schemaVersion: 1,
  scenarioId: 'hamburg-core-mvp',
  generatedAt: '2026-04-29T10:00:00.000Z',
  sourceMetadata: {
    generatedFrom: [
      {
        sourceKind: 'census',
        label: 'Demo Source'
      }
    ],
    generatorName: 'scenario-demand-builder',
    generatorVersion: '1.0.0'
  },
  nodes: [
    {
      id: 'node-1',
      position: { lng: 10.0, lat: 53.5 },
      role: 'origin',
      class: 'residential',
      baseWeight: 100,
      timeBandWeights: { 'morning-rush': 1, 'late-morning': 0.6, midday: 0.5, afternoon: 0.7, 'evening-rush': 0.8, evening: 0.4, night: 0.2 }
    }
  ],
  attractors: [
    {
      id: 'attractor-1',
      position: { lng: 10.1, lat: 53.6 },
      category: 'workplace',
      scale: 'district',
      sourceWeight: 30,
      sinkWeight: 120
    }
  ],
  gateways: [
    {
      id: 'gateway-1',
      position: { lng: 10.2, lat: 53.7 },
      kind: 'rail-station',
      scale: 'major',
      sourceWeight: 50,
      sinkWeight: 50,
      transferWeight: 20,
      timeBandWeights: { 'morning-rush': 1, 'late-morning': 0.7, midday: 0.6, afternoon: 0.8, 'evening-rush': 0.9, evening: 0.5, night: 0.3 }
    }
  ]
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadScenarioDemandArtifact', () => {
  it('loads and parses a valid scenario demand artifact', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(validArtifactFixture), { status: 200 })
    );

    const result = await loadScenarioDemandArtifact('/generated/scenarios/hamburg-core-mvp.demand.json', 'hamburg-core-mvp');

    expect(fetchMock).toHaveBeenCalledWith('/generated/scenarios/hamburg-core-mvp.demand.json');
    expect(result.status).toBe('loaded');
  });

  it('normalizes a generated path without a leading slash', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(validArtifactFixture), { status: 200 })
    );

    await loadScenarioDemandArtifact('generated/scenarios/hamburg-core-mvp.demand.json', 'hamburg-core-mvp');

    expect(fetchMock).toHaveBeenCalledWith('/generated/scenarios/hamburg-core-mvp.demand.json');
  });

  it('returns actionable failure message on HTTP 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

    const result = await loadScenarioDemandArtifact('generated/scenarios/missing.demand.json', 'hamburg-core-mvp');

    expect(result.status).toBe('failed');
    expect(result).toMatchObject({ status: 'failed' });
    if (result.status === 'failed') {
      expect(result.message).toContain('Generated scenario demand artifact not found');
      expect(result.message).toContain('generation pipeline');
    }
  });

  it('returns HTTP status details on non-OK responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500, statusText: 'Server Error' }));

    const result = await loadScenarioDemandArtifact('generated/scenarios/hamburg-core-mvp.demand.json', 'hamburg-core-mvp');

    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.message).toContain('HTTP 500 (Server Error)');
    }
  });

  it('returns parser-path failure for malformed artifact payloads', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ schemaVersion: 'wrong' }), { status: 200 }));

    const result = await loadScenarioDemandArtifact('generated/scenarios/hamburg-core-mvp.demand.json', 'hamburg-core-mvp');

    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.message).toContain('validation failed');
      expect(result.message).toContain('schemaVersion');
    }
  });

  it('rejects scenario-id mismatches', async () => {
    const mismatchedArtifact = {
      ...validArtifactFixture,
      scenarioId: 'other-scenario'
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(mismatchedArtifact), { status: 200 }));

    const result = await loadScenarioDemandArtifact('generated/scenarios/hamburg-core-mvp.demand.json', 'hamburg-core-mvp');

    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.message).toContain('scenarioId mismatch');
      expect(result.message).toContain('expected "hamburg-core-mvp"');
    }
  });
});
