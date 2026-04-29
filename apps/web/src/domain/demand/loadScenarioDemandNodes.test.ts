import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadScenarioDemandNodes } from './loadScenarioDemandNodes';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import * as fs from 'fs';
import * as path from 'path';

describe('loadScenarioDemandNodes', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn<typeof fetch>();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  interface DemandNodePayloadFixture {
    readonly id: string;
    readonly label: string;
    readonly position: {
      readonly lng: unknown;
      readonly lat: unknown;
    };
    readonly role: unknown;
    readonly demandClass: unknown;
    readonly weightByTimeBand: Readonly<Record<string, unknown>>;
  }

  type DemandNodePayloadFixtureOverrides = Partial<DemandNodePayloadFixture>;

  const jsonResponse = (payload: unknown, init?: ResponseInit): Response =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      ...init
    });

  const emptyResponse = (status: number): Response =>
    new Response(null, { status });

  const createValidWeightByTimeBand = () => {
    const weights: Record<string, number> = {};
    for (const id of MVP_TIME_BAND_IDS) {
      weights[id] = 10;
    }
    return weights;
  };

  const createValidMockNode = (overrides: DemandNodePayloadFixtureOverrides = {}): DemandNodePayloadFixture => ({
    id: 'node-1',
    label: 'Origin Node',
    position: { lng: 10.0, lat: 53.5 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createValidWeightByTimeBand(),
    ...overrides,
  });

  it('returns missing status on 404', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(emptyResponse(404));

    const result = await loadScenarioDemandNodes('unknown-scenario');
    expect(result.status).toBe('missing');
    expect(result.nodes).toEqual([]);
  });

  it('returns failed status on non-OK non-404 response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(emptyResponse(500));

    const result = await loadScenarioDemandNodes('broken-scenario');
    expect(result.status).toBe('failed');
    expect(result.nodes).toEqual([]);
  });

  it('loads valid Hamburg-shaped payload as canonical DemandNode[]', async () => {
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode()],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('loaded');
    expect(result.nodes.length).toBe(1);
    const node = result.nodes[0];
    expect(node).toBeDefined();
    expect(node?.id).toBe('node-1');
    expect(node?.weightByTimeBand['morning-rush']).toBe(10);
  });

  it('fails if nodes array is missing', async () => {
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('Payload "nodes" field must be an array');
  });

  it('fails if coordinate is invalid', async () => {
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ position: { lng: 'invalid', lat: 53.5 } })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('has invalid spatial coordinates');
  });

  it('fails if missing canonical MVP time-band weight', async () => {
    const incompleteWeights = { 'morning-rush': 10 };
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ weightByTimeBand: incompleteWeights })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('missing/invalid weight for mandatory band');
  });

  it('fails if unknown time-band key is present', async () => {
    const weights = createValidWeightByTimeBand();
    weights['unknown-band'] = 5;
    
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ weightByTimeBand: weights })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('contains forbidden custom band key');
  });

  it('fails if weight is negative', async () => {
    const weights = createValidWeightByTimeBand();
    weights['morning-rush'] = -10;

    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ weightByTimeBand: weights })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('missing/invalid weight for mandatory band');
  });

  it('fails if weight is non-finite', async () => {
    const weights = createValidWeightByTimeBand();
    weights['morning-rush'] = Infinity;

    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ weightByTimeBand: weights })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('missing/invalid weight for mandatory band');
  });

  it('fails if role is invalid', async () => {
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ role: 'invalid-role' })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('role "invalid-role" is unsupported');
  });

  it('fails if demand class is invalid', async () => {
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ demandClass: 'invalid-class' })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('demandClass "invalid-class" is unsupported');
  });

  it('fails if residential pairs with non-origin role', async () => {
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ role: 'destination', demandClass: 'residential' })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('pairs residential class with non-origin role');
  });

  it('fails if workplace pairs with non-destination role', async () => {
    const mockPayload = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      nodes: [createValidMockNode({ role: 'origin', demandClass: 'workplace' })],
    };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(mockPayload));

    const result = await loadScenarioDemandNodes('test-scenario');
    expect(result.status).toBe('failed');
    expect(result.message).toContain('pairs workplace class with non-destination role');
  });

  it('validates data/scenarios/hamburg-core-mvp.demand.json fixture', () => {
    function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    function isNodeArray(value: unknown): value is readonly unknown[] {
      return Array.isArray(value);
    }

    const fixturePath = path.resolve(__dirname, '../../../../../data/scenarios/hamburg-core-mvp.demand.json');
    
    expect(fs.existsSync(fixturePath)).toBe(true);
    
    const rawData = fs.readFileSync(fixturePath, 'utf-8');
    const payload: unknown = JSON.parse(rawData);

    if (!isRecord(payload)) {
      throw new Error('Payload is not an object');
    }

    expect(payload.schemaVersion).toBe(1);
    expect(payload.scenarioId).toBe('hamburg-core-mvp');
    
    const nodes = payload.nodes;
    if (!isNodeArray(nodes)) {
      throw new Error('nodes is not an array');
    }
    expect(nodes.length).toBeGreaterThan(0);

    let hasResidentialOrigin = false;
    let hasWorkplaceDestination = false;
    const seenIds = new Set<string>();

    for (const node of nodes) {
      if (!isRecord(node)) {
        throw new Error('Node is not an object');
      }

      const id = node.id;
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      if (typeof id === 'string') {
        expect(id.trim().length).toBeGreaterThan(0);
        expect(seenIds.has(id)).toBe(false);
        seenIds.add(id);
      }

      expect(node.label).toBeDefined();
      expect(typeof node.label).toBe('string');

      const position = node.position;
      if (!isRecord(position)) {
        throw new Error('position is not an object');
      }
      expect(typeof position.lng).toBe('number');
      expect(Number.isFinite(position.lng)).toBe(true);
      expect(typeof position.lat).toBe('number');
      expect(Number.isFinite(position.lat)).toBe(true);

      expect(['origin', 'destination']).toContain(node.role);
      expect(['residential', 'workplace']).toContain(node.demandClass);

      if (node.demandClass === 'residential') {
        expect(node.role).toBe('origin');
        hasResidentialOrigin = true;
      }
      if (node.demandClass === 'workplace') {
        expect(node.role).toBe('destination');
        hasWorkplaceDestination = true;
      }

      const weightByTimeBand = node.weightByTimeBand;
      if (!isRecord(weightByTimeBand)) {
        throw new Error('weightByTimeBand is not an object');
      }

      const weightKeys = Object.keys(weightByTimeBand);
      
      for (const timeBandId of MVP_TIME_BAND_IDS) {
        expect(weightKeys).toContain(timeBandId);
        const weight = weightByTimeBand[timeBandId];
        expect(typeof weight).toBe('number');
        expect(Number.isFinite(weight)).toBe(true);
        if (typeof weight === 'number') {
          expect(weight).toBeGreaterThanOrEqual(0);
        }
      }

      for (const key of weightKeys) {
        expect(MVP_TIME_BAND_IDS).toContain(key);
      }
    }

    expect(hasResidentialOrigin).toBe(true);
    expect(hasWorkplaceDestination).toBe(true);
  });
});
