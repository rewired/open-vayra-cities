import { describe, it, expect } from 'vitest';
import { projectDemandGapRanking } from './demandGapProjection';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { Stop } from '../types/stop';
import type { Line } from '../types/line';
import { createStopId } from '../types/stop';
import { createLineId } from '../types/line';

describe('demandGapProjection', () => {
  const mockStops: readonly Stop[] = [
    { id: createStopId('stop-1'), position: { lng: 0, lat: 0 }, label: 'Stop 1' },
    { id: createStopId('stop-2'), position: { lng: 0.1, lat: 0.1 }, label: 'Stop 2' }
  ];

  const mockArtifact: ScenarioDemandArtifact = {
    nodes: [
      {
        id: 'res-uncaptured',
        role: 'origin',
        class: 'residential',
        position: { lng: 1, lat: 1 }, // Far from stops
        baseWeight: 10,
        timeBandWeights: { 'morning-rush': 1.0, midday: 1.0, 'evening-rush': 1.0, night: 1.0 }
      },
      {
        id: 'res-captured-unserved',
        role: 'origin',
        class: 'residential',
        position: { lng: 0.001, lat: 0.001 }, // Near stop-1
        baseWeight: 5,
        timeBandWeights: { 'morning-rush': 1.0, midday: 1.0, 'evening-rush': 1.0, night: 1.0 }
      },
      {
        id: 'work-captured-unreachable',
        role: 'destination',
        class: 'workplace',
        position: { lng: 0.1001, lat: 0.1001 }, // Near stop-2
        baseWeight: 8,
        timeBandWeights: { 'morning-rush': 1.0, midday: 1.0, 'evening-rush': 1.0, night: 1.0 }
      }
    ],
    attractors: [],
    gateways: [],
    metadata: {
      scenarioId: 'test',
      generatedAtIsoUtc: '',
      bounds: { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 }
    }
  };

  const createMockLine = (id: string, stopIds: string[], servicePattern: 'one-way' | 'bidirectional'): Line => ({
    id: createLineId(id),
    label: `Line ${id}`,
    stopIds: stopIds.map(createStopId),
    topology: 'linear',
    servicePattern,
    frequencyByTimeBand: {
      'morning-rush': { kind: 'frequency', headwayMinutes: 10 as any },
      'late-morning': { kind: 'no-service' },
      midday: { kind: 'frequency', headwayMinutes: 10 as any },
      afternoon: { kind: 'no-service' },
      'evening-rush': { kind: 'frequency', headwayMinutes: 10 as any },
      evening: { kind: 'no-service' },
      night: { kind: 'frequency', headwayMinutes: 10 as any }
    },
    routeSegments: stopIds.slice(0, -1).map((fromId, i) => ({
      id: `seg-${fromId}-${stopIds[i+1]}` as any,
      lineId: createLineId(id),
      fromStopId: createStopId(fromId),
      toStopId: createStopId(stopIds[i+1]),
      status: 'routed',
      distanceMeters: 1000,
      inMotionTravelMinutes: 2,
      dwellMinutes: 0.5,
      totalTravelMinutes: 2.5,
      orderedGeometry: [],
      warnings: []
    }))
  });

  it('identifies uncaptured residential gaps', () => {
    const result = projectDemandGapRanking(mockArtifact, mockStops, [], 'midday');
    expect(result.uncapturedResidentialGaps).toHaveLength(1);
    expect(result.uncapturedResidentialGaps[0].id).toBe('res-uncaptured');
  });

  it('identifies captured but unserved residential gaps when no lines exist', () => {
    const result = projectDemandGapRanking(mockArtifact, mockStops, [], 'midday');
    expect(result.capturedButUnservedResidentialGaps).toHaveLength(1);
    expect(result.capturedButUnservedResidentialGaps[0].id).toBe('res-captured-unserved');
  });

  it('identifies captured but unreachable workplace gaps when no lines exist', () => {
    const result = projectDemandGapRanking(mockArtifact, mockStops, [], 'midday');
    expect(result.capturedButUnreachableWorkplaceGaps).toHaveLength(1);
    expect(result.capturedButUnreachableWorkplaceGaps[0].id).toBe('work-captured-unreachable');
  });

  it('resolves gaps when a connecting line is added', () => {
    const mockLines: readonly Line[] = [
      createMockLine('line-1', ['stop-1', 'stop-2'], 'bidirectional')
    ];

    const result = projectDemandGapRanking(mockArtifact, mockStops, mockLines, 'midday');
    // residential at stop-1 can reach workplace at stop-2 via bidirectional line
    expect(result.capturedButUnservedResidentialGaps).toHaveLength(0);
    expect(result.capturedButUnreachableWorkplaceGaps).toHaveLength(0);
    // Uncaptured remains uncaptured
    expect(result.uncapturedResidentialGaps).toHaveLength(1);
  });

  it('respects linear one-way reachability', () => {
    const mockLines: readonly Line[] = [
      createMockLine('line-1', ['stop-2', 'stop-1'], 'one-way') // Workplace (stop-2) is BEFORE residential (stop-1)
    ];

    const result = projectDemandGapRanking(mockArtifact, mockStops, mockLines, 'midday');
    // Residential (stop-1) cannot reach workplace (stop-2) because it's one-way 2->1
    expect(result.capturedButUnservedResidentialGaps).toHaveLength(1);
    expect(result.capturedButUnservedResidentialGaps[0].id).toBe('res-captured-unserved');
    expect(result.capturedButUnreachableWorkplaceGaps).toHaveLength(1);
  });

  it('ranks gaps by active weight descending', () => {
    const heavyArtifact: ScenarioDemandArtifact = {
      ...mockArtifact,
      nodes: [
        { ...mockArtifact.nodes[0], id: 'res-light', baseWeight: 1 },
        { ...mockArtifact.nodes[0], id: 'res-heavy', baseWeight: 100 }
      ]
    };

    const result = projectDemandGapRanking(heavyArtifact, [], [], 'midday');
    expect(result.uncapturedResidentialGaps[0].id).toBe('res-heavy');
    expect(result.uncapturedResidentialGaps[1].id).toBe('res-light');
  });

  it('caps results based on constant', () => {
    const manyNodes: ScenarioDemandNode[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `res-${i}`,
      role: 'origin',
      class: 'residential',
      position: { lng: 1, lat: 1 },
      baseWeight: 10 + i,
      timeBandWeights: { 'morning-rush': 1.0, midday: 1.0, 'evening-rush': 1.0, night: 1.0 }
    }));

    const bigArtifact: ScenarioDemandArtifact = {
      ...mockArtifact,
      nodes: manyNodes
    };

    const result = projectDemandGapRanking(bigArtifact, [], [], 'midday');
    expect(result.uncapturedResidentialGaps).toHaveLength(5); // Default constant is 5
    expect(result.uncapturedResidentialGaps[0].id).toBe('res-9'); // Heaviest first
  });

  it('returns unavailable if no artifact', () => {
    const result = projectDemandGapRanking(null, [], [], 'midday');
    expect(result.status).toBe('unavailable');
  });
});
