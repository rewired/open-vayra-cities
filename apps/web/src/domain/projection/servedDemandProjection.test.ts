import { describe, it, expect } from 'vitest';
import { projectServedDemand } from './servedDemandProjection';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { Stop } from '../types/stop';
import type { Line } from '../types/line';
import { createLineId, createLineFrequencyMinutes, createNoServiceLineServiceByTimeBand } from '../types/line';

describe('servedDemandProjection', () => {
  const activeTimeBandId = 'morning-rush' as any;

  const createMockNode = (id: string, lng: number, lat: number, role: 'origin' | 'destination', nodeClass: 'residential' | 'workplace', weight: number): ScenarioDemandNode => ({
    id,
    position: { lng, lat },
    role,
    class: nodeClass,
    baseWeight: weight,
    source: { kind: 'census', key: 'test' } as any
  });

  const createMockStop = (id: string, lng: number, lat: number): Stop => ({
    id: id as any,
    label: `Stop ${id}`,
    position: { lng, lat }
  });

  const createMockLine = (id: string, stopIds: string[], topology: 'linear' | 'loop' = 'linear', servicePattern: 'one-way' | 'bidirectional' = 'one-way'): Line => {
    const frequencyByTimeBand = createNoServiceLineServiceByTimeBand();
    (frequencyByTimeBand as any)['morning-rush'] = { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) };

    const routeSegments = stopIds.slice(0, topology === 'loop' ? undefined : -1).map((_, i) => {
      const fromStopId = stopIds[i];
      const toStopId = stopIds[(i + 1) % stopIds.length];
      return {
        id: `s${i}` as any,
        lineId: createLineId(id),
        fromStopId: fromStopId as any,
        toStopId: toStopId as any,
        inMotionTravelMinutes: 5,
        dwellMinutes: 1,
        totalTravelMinutes: 6,
        status: 'routed' as const,
        warnings: []
      };
    });

    return {
      id: createLineId(id),
      label: `Line ${id}`,
      stopIds: stopIds as any[],
      topology,
      servicePattern,
      routeSegments,
      frequencyByTimeBand
    };
  };

  const artifact: ScenarioDemandArtifact = {
    metadata: { scenarioId: 'test', areaKey: 'test', createdAtIsoUtc: '' },
    nodes: [
      createMockNode('res1', 0, 0, 'origin', 'residential', 100),
      createMockNode('work1', 0.01, 0, 'destination', 'workplace', 50),
    ],
    attractors: [],
    gateways: []
  };

  it('projects zero served demand when no stops exist', () => {
    const result = projectServedDemand(artifact, [], [], activeTimeBandId);
    expect(result.servedResidentialWeight).toBe(0);
    expect(result.capturedResidentialWeight).toBe(0);
  });

  it('projects served demand for a linear one-way line when residential is before workplace', () => {
    const stop1 = createMockMockStop('s1', 0, 0); // captures res1
    const stop2 = createMockMockStop('s2', 0.01, 0); // captures work1
    const line = createMockLine('l1', ['s1', 's2']);
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.capturedResidentialWeight).toBe(100);
    expect(result.servedResidentialWeight).toBe(100);
    expect(result.reachableWorkplaceWeight).toBe(50);
  });

  it('projects zero served demand for a linear one-way line when residential is after workplace', () => {
    const stop1 = createMockMockStop('s1', 0, 0); // captures res1
    const stop2 = createMockMockStop('s2', 0.01, 0); // captures work1
    // Reversed order: residential is at s1 (index 1), workplace is at s2 (index 0)
    const line = createMockLine('l1', ['s2', 's1']);
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.capturedResidentialWeight).toBe(100);
    expect(result.servedResidentialWeight).toBe(0);
  });

  it('projects served demand for a bidirectional line regardless of order', () => {
    const stop1 = createMockMockStop('s1', 0, 0); // captures res1
    const stop2 = createMockMockStop('s2', 0.01, 0); // captures work1
    const line = createMockLine('l1', ['s2', 's1'], 'linear', 'bidirectional');
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialWeight).toBe(100);
  });

  it('projects served demand for a loop line regardless of order', () => {
    const stop1 = createMockMockStop('s1', 0, 0); // captures res1
    const stop2 = createMockMockStop('s2', 0.01, 0); // captures work1
    const line = createMockLine('l1', ['s2', 's1'], 'loop', 'one-way');
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialWeight).toBe(100);
  });

  it('does not serve demand when line has no service in active band', () => {
    const stop1 = createMockMockStop('s1', 0, 0);
    const stop2 = createMockMockStop('s2', 0.01, 0);
    const line = createMockLine('l1', ['s1', 's2']);
    (line.frequencyByTimeBand as any)['morning-rush'] = { kind: 'no-service' };

    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialWeight).toBe(0);
    expect(result.inactiveOrNoServiceLineCount).toBe(1);
  });

  it('deduplicates weight when multiple stops capture the same node', () => {
    const stop1 = createMockMockStop('s1', 0, 0);
    const stop1b = createMockMockStop('s1b', 0.0001, 0); // also captures res1
    const stop2 = createMockMockStop('s2', 0.01, 0);
    const line = createMockLine('l1', ['s1', 's1b', 's2']);

    const result = projectServedDemand(artifact, [stop1, stop1b, stop2], [line], activeTimeBandId);
    expect(result.capturedResidentialWeight).toBe(100);
    expect(result.servedResidentialWeight).toBe(100);
  });

  it('deduplicates weight when multiple lines serve the same node', () => {
    const stop1 = createMockMockStop('s1', 0, 0);
    const stop2 = createMockMockStop('s2', 0.01, 0);
    const line1 = createMockLine('l1', ['s1', 's2']);
    const line2 = createMockLine('l2', ['s1', 's2']);

    const result = projectServedDemand(artifact, [stop1, stop2], [line1, line2], activeTimeBandId);
    expect(result.servedResidentialWeight).toBe(100);
  });
});

function createMockMockStop(id: string, lng: number, lat: number): Stop {
  return {
    id: id as any,
    label: `Stop ${id}`,
    position: { lng, lat }
  };
}
