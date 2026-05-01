import { describe, it, expect } from 'vitest';
import { projectServedDemand } from './servedDemandProjection';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { Stop } from '../types/stop';
import type { Line } from '../types/line';
import { createLineId, createLineFrequencyMinutes, createNoServiceLineServiceByTimeBand } from '../types/line';

describe('servedDemandProjection', () => {
  const activeTimeBandId = 'morning-rush' as any;

  const createMockNode = (id: string, lng: number, lat: number, role: 'origin' | 'destination', nodeClass: 'residential' | 'workplace', weight: number, timeBandWeights?: Record<string, number>): ScenarioDemandNode => ({
    id,
    position: { lng, lat },
    role,
    class: nodeClass,
    baseWeight: weight,
    timeBandWeights: (timeBandWeights || { 'morning-rush': 1.0 }) as any,
  });

  const createMockStop = (id: string, lng: number, lat: number): Stop => ({
    id: id as any,
    label: `Stop ${id}`,
    position: { lng, lat }
  });

  const createMockLine = (id: string, stopIds: string[], topology: 'linear' | 'loop' = 'linear', servicePattern: 'one-way' | 'bidirectional' = 'one-way'): Line => {
    const frequencyByTimeBand = createNoServiceLineServiceByTimeBand();
    (frequencyByTimeBand as any)['morning-rush'] = { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) };
    (frequencyByTimeBand as any)['midday'] = { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(15) };

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
    schemaVersion: 1,
    scenarioId: 'test',
    generatedAt: '',
    sourceMetadata: {
      generatedFrom: [],
      generatorName: 'test',
      generatorVersion: '0.1.0'
    },
    nodes: [
      createMockNode('res1', 0, 0, 'origin', 'residential', 100, { 'morning-rush': 1.5, 'midday': 0.5 }),
      createMockNode('work1', 0.01, 0, 'destination', 'workplace', 50, { 'morning-rush': 2.0, 'midday': 1.0 }),
    ],
    attractors: [],
    gateways: []
  };

  it('projects zero served demand when no stops exist', () => {
    const result = projectServedDemand(artifact, [], [], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(0);
    expect(result.capturedResidentialActiveWeight).toBe(0);
  });

  it('projects served demand for a linear one-way line with active weights (morning-rush)', () => {
    const stop1 = createMockStop('s1', 0, 0); // captures res1 (active weight 150)
    const stop2 = createMockStop('s2', 0.01, 0); // captures work1 (active weight 100)
    const line = createMockLine('l1', ['s1', 's2']);
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], 'morning-rush' as any);
    expect(result.capturedResidentialActiveWeight).toBe(150);
    expect(result.servedResidentialActiveWeight).toBe(150);
    expect(result.reachableWorkplaceActiveWeight).toBe(100);
  });

  it('projects served demand with different weights for midday', () => {
    const stop1 = createMockStop('s1', 0, 0); // captures res1 (active weight 50)
    const stop2 = createMockStop('s2', 0.01, 0); // captures work1 (active weight 50)
    const line = createMockLine('l1', ['s1', 's2']);
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], 'midday' as any);
    expect(result.capturedResidentialActiveWeight).toBe(50);
    expect(result.servedResidentialActiveWeight).toBe(50);
    expect(result.reachableWorkplaceActiveWeight).toBe(50);
  });

  it('projects zero served demand for a linear one-way line when residential is after workplace', () => {
    const stop1 = createMockStop('s1', 0, 0); // captures res1
    const stop2 = createMockStop('s2', 0.01, 0); // captures work1
    // Reversed order: residential is at s1 (index 1), workplace is at s2 (index 0)
    const line = createMockLine('l1', ['s2', 's1']);
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.capturedResidentialActiveWeight).toBe(150);
    expect(result.servedResidentialActiveWeight).toBe(0);
  });

  it('projects served demand for a bidirectional line regardless of order', () => {
    const stop1 = createMockStop('s1', 0, 0); // captures res1
    const stop2 = createMockStop('s2', 0.01, 0); // captures work1
    const line = createMockLine('l1', ['s2', 's1'], 'linear', 'bidirectional');
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });

  it('projects served demand for a loop line regardless of order', () => {
    const stop1 = createMockStop('s1', 0, 0); // captures res1
    const stop2 = createMockStop('s2', 0.01, 0); // captures work1
    const line = createMockLine('l1', ['s2', 's1'], 'loop', 'one-way');
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });

  it('does not serve demand when line has no service in active band', () => {
    const stop1 = createMockStop('s1', 0, 0);
    const stop2 = createMockStop('s2', 0.01, 0);
    const line = createMockLine('l1', ['s1', 's2']);
    (line.frequencyByTimeBand as any)['morning-rush'] = { kind: 'no-service' };

    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(0);
    expect(result.inactiveOrNoServiceLineCount).toBe(1);
  });

  it('deduplicates weight when multiple stops capture the same node', () => {
    const stop1 = createMockStop('s1', 0, 0);
    const stop1b = createMockStop('s1b', 0.0001, 0); // also captures res1
    const stop2 = createMockStop('s2', 0.01, 0);
    const line = createMockLine('l1', ['s1', 's1b', 's2']);

    const result = projectServedDemand(artifact, [stop1, stop1b, stop2], [line], activeTimeBandId);
    expect(result.capturedResidentialActiveWeight).toBe(150);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });

  it('deduplicates weight when multiple lines serve the same node', () => {
    const stop1 = createMockStop('s1', 0, 0);
    const stop2 = createMockStop('s2', 0.01, 0);
    const line1 = createMockLine('l1', ['s1', 's2']);
    const line2 = createMockLine('l2', ['s1', 's2']);

    const result = projectServedDemand(artifact, [stop1, stop2], [line1, line2], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });
});
