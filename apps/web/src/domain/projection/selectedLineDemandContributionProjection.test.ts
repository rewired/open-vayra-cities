import { describe, it, expect } from 'vitest';
import { projectSelectedLineDemandContribution } from './selectedLineDemandContributionProjection';
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

describe('selectedLineDemandContributionProjection', () => {
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
        timeBandWeights: { 'morning-rush': 1.5 }
      }),
      createTestScenarioDemandNode({
        id: 'work1',
        lng: 0.01,
        lat: 0,
        role: 'destination',
        class: 'workplace',
        baseWeight: 50,
        timeBandWeights: { 'morning-rush': 2.0 }
      }),
    ]
  });

  it('returns null when no line or artifact is provided', () => {
    expect(projectSelectedLineDemandContribution(null, [], null, activeTimeBandId)).toBeNull();
  });

  it('projects demand contribution for a linear one-way line', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1 (active weight 150)
    const stop2 = createTestStop('s2', 0.01, 0); // captures work1 (active weight 100)
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    
    const result = projectSelectedLineDemandContribution(line, [stop1, stop2], artifact, 'morning-rush');
    expect(result?.status).toBe('serving');
    expect(result?.capturedResidentialActiveWeight).toBe(150);
    expect(result?.servedResidentialActiveWeight).toBe(150);
    expect(result?.reachableWorkplaceActiveWeight).toBe(100);
    expect(result?.activeDeparturesPerHourEstimate).toBe(6);
    expect(result?.servicePressureStatus).toBe('balanced'); // 150 / 6 = 25 (balanced is <= 50)
  });

  it('returns captures-only when residential is after workplace in one-way line', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1
    const stop2 = createTestStop('s2', 0.01, 0); // captures work1
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s2', 's1'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    }); // Reversed
    
    const result = projectSelectedLineDemandContribution(line, [stop1, stop2], artifact, activeTimeBandId);
    expect(result?.status).toBe('captures-only');
    expect(result?.servedResidentialActiveWeight).toBe(0);
    expect(result?.notes).toContain('Captures demand but cannot structurally connect it.');
  });

  it('serves both directions for a bidirectional line', () => {
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
    
    const result = projectSelectedLineDemandContribution(line, [stop1, stop2], artifact, activeTimeBandId);
    expect(result?.status).toBe('serving');
    expect(result?.servedResidentialActiveWeight).toBe(150);
  });

  it('serves any connection for a loop line', () => {
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
    
    const result = projectSelectedLineDemandContribution(line, [stop1, stop2], artifact, activeTimeBandId);
    expect(result?.status).toBe('serving');
    expect(result?.servedResidentialActiveWeight).toBe(150);
  });

  it('returns no-service when line is inactive', () => {
    const stop1 = createTestStop('s1', 0, 0);
    const stop2 = createTestStop('s2', 0.01, 0);
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'no-service' }
      }
    });

    const result = projectSelectedLineDemandContribution(line, [stop1, stop2], artifact, activeTimeBandId);
    expect(result?.status).toBe('no-service');
    expect(result?.servedResidentialActiveWeight).toBe(0);
    expect(result?.notes).toContain('No active service in this time band.');
  });

  it('deduplicates nodes captured by multiple stops on the same line', () => {
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

    const result = projectSelectedLineDemandContribution(line, [stop1, stop1b, stop2], artifact, activeTimeBandId);
    expect(result?.capturedResidentialActiveWeight).toBe(150);
    expect(result?.capturedResidentialNodeCount).toBe(1);
    expect(result?.servedResidentialActiveWeight).toBe(150);
  });

  it('returns captures-only when only one type of demand is captured', () => {
    const stop1 = createTestStop('s1', 0, 0); // captures res1
    const stop2 = createTestStop('s2', 1, 1); // captures nothing
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    
    const result = projectSelectedLineDemandContribution(line, [stop1, stop2], artifact, activeTimeBandId);
    expect(result?.status).toBe('captures-only');
    expect(result?.notes).toContain('Captures homes but no reachable workplace destinations.');
  });

  it('calculates service pressure correctly', () => {
    const stop1 = createTestStop('s1', 0, 0); // res1: 150
    const stop2 = createTestStop('s2', 0.01, 0); // work1: 100
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    // Ratio = 150 / 6 = 25 -> balanced
    
    let result = projectSelectedLineDemandContribution(line, [stop1, stop2], artifact, activeTimeBandId);
    expect(result?.servicePressureStatus).toBe('balanced');

    // Make it overloaded: demand 450 (3 * 150), frequency 0.5 departures/hr (headway 120min)
    // Floor of 4.0 deps/hr applies: 450 / 4.0 = 112.5 -> overloaded (> 100)
    const heavyArtifact = createTestScenarioDemandArtifact({
      nodes: [
        createTestScenarioDemandNode({
          id: 'res1',
          lng: 0,
          lat: 0,
          role: 'origin',
          class: 'residential',
          baseWeight: 450,
          timeBandWeights: { 'morning-rush': 1.0 }
        }),
        createTestScenarioDemandNode({
          id: 'work1',
          lng: 0.01,
          lat: 0,
          role: 'destination',
          class: 'workplace',
          baseWeight: 100,
          timeBandWeights: { 'morning-rush': 1.0 }
        })
      ]
    });

    const lineOverloaded = {
      ...line,
      frequencyByTimeBand: {
        ...line.frequencyByTimeBand,
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(120) } as const
      }
    };
    result = projectSelectedLineDemandContribution(lineOverloaded, [stop1, stop2], heavyArtifact, activeTimeBandId);
    expect(result?.servicePressureStatus).toBe('overloaded');
    expect(result?.status).toBe('degraded');
  });

  it('does not mutate inputs', () => {
    const line = createTestLine({
      id: 'l1',
      stopIds: ['s1', 's2'],
      frequencyOverrides: {
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    });
    const lineJson = JSON.stringify(line);
    const artifactJson = JSON.stringify(artifact);
    
    projectSelectedLineDemandContribution(line, [], artifact, activeTimeBandId);
    
    expect(JSON.stringify(line)).toBe(lineJson);
    expect(JSON.stringify(artifact)).toBe(artifactJson);
  });
});
