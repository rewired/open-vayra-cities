import { describe, it, expect } from 'vitest';
import { projectServedDemand } from './servedDemandProjection';
import type { TimeBandId } from '../types/timeBand';
import { 
  createLineFrequencyMinutes, 
} from '../types/line';
import { 
  createTestStop, 
  createTestLine, 
  createTestScenarioDemandNode, 
  createTestScenarioDemandArtifact 
} from './testFixtures';

describe('servedDemandProjection', () => {
  const activeTimeBandId: TimeBandId = 'morning-rush';

  const artifact = createTestScenarioDemandArtifact({
    nodes: [
      createTestScenarioDemandNode({
        id: 'res1',
        lng: 0,
        lat: 0,
        role: 'origin',
        class: 'residential',
        baseWeight: 100,
        timeBandWeights: { 'morning-rush': 1.5, 'midday': 0.5 }
      }),
      createTestScenarioDemandNode({
        id: 'work1',
        lng: 0.01,
        lat: 0,
        role: 'destination',
        class: 'workplace',
        baseWeight: 50,
        timeBandWeights: { 'morning-rush': 2.0, 'midday': 1.0 }
      }),
    ]
  });

  it('projects zero served demand when no stops exist', () => {
    const result = projectServedDemand(artifact, [], [], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(0);
    expect(result.capturedResidentialActiveWeight).toBe(0);
  });

  it('projects served demand for a linear one-way line with active weights (morning-rush)', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1 (active weight 150)
    const stop2 = createTestStop('s2', 0.01, 0); // captures work1 (active weight 100)
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], 'morning-rush');
    expect(result.capturedResidentialActiveWeight).toBe(150);
    expect(result.servedResidentialActiveWeight).toBe(150);
    expect(result.reachableWorkplaceActiveWeight).toBe(100);
  });

  it('projects served demand with different weights for midday', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1 (active weight 50)
    const stop2 = createTestStop('s2', 0.01, 0); // captures work1 (active weight 50)
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        midday: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(15) }
      }
    });
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], 'midday');
    expect(result.capturedResidentialActiveWeight).toBe(50);
    expect(result.servedResidentialActiveWeight).toBe(50);
    expect(result.reachableWorkplaceActiveWeight).toBe(50);
  });

  it('projects zero served demand for a linear one-way line when residential is after workplace', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1
    const stop2 = createTestStop('s2', 0.01, 0); // captures work1
    // Reversed order: residential is at s1 (index 1), workplace is at s2 (index 0)
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s2', 's1'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.capturedResidentialActiveWeight).toBe(150);
    expect(result.servedResidentialActiveWeight).toBe(0);
  });

  it('projects served demand for a bidirectional line regardless of order', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1
    const stop2 = createTestStop('s2', 0.01, 0); // captures work1
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s2', 's1'],
      topology: 'linear',
      servicePattern: 'bidirectional',
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });

  it('projects served demand for a loop line regardless of order', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1
    const stop2 = createTestStop('s2', 0.01, 0); // captures work1
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s2', 's1'],
      topology: 'loop',
      servicePattern: 'one-way',
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    
    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });

  it('does not serve demand when line has no service in active band', () => {
    const stop1 = createTestStop('s1', 0, 0);
    const stop2 = createTestStop('s2', 0.01, 0);
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'no-service' }
      }
    });

    const result = projectServedDemand(artifact, [stop1, stop2], [line], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(0);
    expect(result.inactiveOrNoServiceLineCount).toBe(1);
  });

  it('deduplicates weight when multiple stops capture the same node', () => {
    const stop1 = createTestStop('s1', 0, 0);
    const stop1b = createTestStop('s1b', 0.0001, 0); // also captures res1
    const stop2 = createTestStop('s2', 0.01, 0);
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's1b', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });

    const result = projectServedDemand(artifact, [stop1, stop1b, stop2], [line], activeTimeBandId);
    expect(result.capturedResidentialActiveWeight).toBe(150);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });

  it('deduplicates weight when multiple lines serve the same node', () => {
    const stop1 = createTestStop('s1', 0, 0);
    const stop2 = createTestStop('s2', 0.01, 0);
    const line1 = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    const line2 = createTestLine({
      id: 'l2',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });

    const result = projectServedDemand(artifact, [stop1, stop2], [line1, line2], activeTimeBandId);
    expect(result.servedResidentialActiveWeight).toBe(150);
  });
});
