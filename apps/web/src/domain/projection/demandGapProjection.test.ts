import { describe, it, expect } from 'vitest';
import { projectDemandGapRanking } from './demandGapProjection';
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

describe('demandGapProjection', () => {
  const mockStops = [
    createTestStop('stop-1', 0, 0),
    createTestStop('stop-2', 0.1, 0.1)
  ];

  const mockArtifact = createTestScenarioDemandArtifact({
    nodes: [
      createTestScenarioDemandNode({
        id: 'res-uncaptured',
        role: 'origin',
        class: 'residential',
        lng: 1,
        lat: 1,
        baseWeight: 10
      }),
      createTestScenarioDemandNode({
        id: 'res-captured-unserved',
        role: 'origin',
        class: 'residential',
        lng: 0.001,
        lat: 0.001,
        baseWeight: 5
      }),
      createTestScenarioDemandNode({
        id: 'work-captured-unreachable',
        role: 'destination',
        class: 'workplace',
        lng: 0.1001,
        lat: 0.1001,
        baseWeight: 8
      })
    ]
  });

  const activeTimeBandId: TimeBandId = 'midday';

  it('identifies uncaptured residential gaps', () => {
    const result = projectDemandGapRanking(mockArtifact, mockStops, [], activeTimeBandId);
    expect(result.uncapturedResidentialGaps).toHaveLength(1);
    expect(result.uncapturedResidentialGaps[0]?.id).toBe('res-uncaptured');
  });

  it('identifies captured but unserved residential gaps when no lines exist', () => {
    const result = projectDemandGapRanking(mockArtifact, mockStops, [], activeTimeBandId);
    expect(result.capturedButUnservedResidentialGaps).toHaveLength(1);
    expect(result.capturedButUnservedResidentialGaps[0]?.id).toBe('res-captured-unserved');
  });

  it('identifies captured but unreachable workplace gaps when no lines exist', () => {
    const result = projectDemandGapRanking(mockArtifact, mockStops, [], activeTimeBandId);
    expect(result.capturedButUnreachableWorkplaceGaps).toHaveLength(1);
    expect(result.capturedButUnreachableWorkplaceGaps[0]?.id).toBe('work-captured-unreachable');
  });

  it('resolves gaps when a connecting line is added', () => {
    const mockLines = [
      createTestLine({
        id: 'line-1',
        stopIds: ['stop-1', 'stop-2'],
        servicePattern: 'bidirectional',
        frequencyOverrides: {
          midday: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
        }
      })
    ];

    const result = projectDemandGapRanking(mockArtifact, mockStops, mockLines, activeTimeBandId);
    // residential at stop-1 can reach workplace at stop-2 via bidirectional line
    expect(result.capturedButUnservedResidentialGaps).toHaveLength(0);
    expect(result.capturedButUnreachableWorkplaceGaps).toHaveLength(0);
    // Uncaptured remains uncaptured
    expect(result.uncapturedResidentialGaps).toHaveLength(1);
  });

  it('respects linear one-way reachability', () => {
    const mockLines = [
      createTestLine({
        id: 'line-1',
        stopIds: ['stop-2', 'stop-1'],
        servicePattern: 'one-way',
        frequencyOverrides: {
          midday: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
        }
      }) // Workplace (stop-2) is BEFORE residential (stop-1)
    ];

    const result = projectDemandGapRanking(mockArtifact, mockStops, mockLines, activeTimeBandId);
    // Residential (stop-1) cannot reach workplace (stop-2) because it's one-way 2->1
    expect(result.capturedButUnservedResidentialGaps).toHaveLength(1);
    expect(result.capturedButUnservedResidentialGaps[0]?.id).toBe('res-captured-unserved');
    expect(result.capturedButUnreachableWorkplaceGaps).toHaveLength(1);
  });

  it('ranks gaps by active weight descending', () => {
    const heavyArtifact = createTestScenarioDemandArtifact({
      nodes: [
        createTestScenarioDemandNode({
          id: 'res-light',
          role: 'origin',
          class: 'residential',
          lng: 1,
          lat: 1,
          baseWeight: 1
        }),
        createTestScenarioDemandNode({
          id: 'res-heavy',
          role: 'origin',
          class: 'residential',
          lng: 1,
          lat: 1,
          baseWeight: 100
        })
      ]
    });

    const result = projectDemandGapRanking(heavyArtifact, [], [], activeTimeBandId);
    expect(result.uncapturedResidentialGaps[0]?.id).toBe('res-heavy');
    expect(result.uncapturedResidentialGaps[1]?.id).toBe('res-light');
  });

  it('caps results based on constant', () => {
    const manyNodes = Array.from({ length: 10 }).map((_, i) => createTestScenarioDemandNode({
      id: `res-${i}`,
      role: 'origin',
      class: 'residential',
      lng: 1,
      lat: 1,
      baseWeight: 10 + i
    }));

    const bigArtifact = createTestScenarioDemandArtifact({
      nodes: manyNodes
    });

    const result = projectDemandGapRanking(bigArtifact, [], [], activeTimeBandId);
    expect(result.uncapturedResidentialGaps).toHaveLength(5); // Default constant is 5
    expect(result.uncapturedResidentialGaps[0]?.id).toBe('res-9'); // Heaviest first
  });

  it('returns unavailable if no artifact', () => {
    const result = projectDemandGapRanking(null, [], [], activeTimeBandId);
    expect(result.status).toBe('unavailable');
  });
});
