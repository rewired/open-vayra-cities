import { describe, expect, it } from 'vitest';
import { projectDemandNodeInspection } from './demandNodeInspectionProjection';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { TimeBandId } from '../types/timeBand';
import type { ScenarioDemandCaptureProjection } from './scenarioDemandCaptureProjection';
import type { ServedDemandProjection } from './servedDemandProjection';
import { createEmptyCapturedEntitySummary } from './scenarioDemandCaptureProjection';

describe('projectDemandNodeInspection', () => {
  const mockTimeBandId: TimeBandId = 'morning-rush';
  
  const createMockTimeBandWeights = (): Record<TimeBandId, number> => ({
    'morning-rush': 1.0,
    'late-morning': 1.0,
    'midday': 1.0,
    'afternoon': 1.0,
    'evening-rush': 1.0,
    'evening': 1.0,
    'night': 1.0
  });

  const mockNode1: ScenarioDemandNode = {
    id: 'node-res-1',
    role: 'origin',
    class: 'residential',
    position: { lng: 10, lat: 50 },
    baseWeight: 100,
    timeBandWeights: createMockTimeBandWeights()
  };

  const mockNode2: ScenarioDemandNode = {
    id: 'node-work-1',
    role: 'destination',
    class: 'workplace',
    position: { lng: 10.01, lat: 50.01 },
    baseWeight: 150,
    timeBandWeights: createMockTimeBandWeights()
  };

  const artifact: ScenarioDemandArtifact = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    generatedAt: '2026-05-03T00:00:00Z',
    sourceMetadata: {
      generatedFrom: [],
      generatorName: 'test',
      generatorVersion: '1.0.0'
    },
    nodes: [mockNode1, mockNode2],
    attractors: [],
    gateways: []
  };

  const mockCapture: ScenarioDemandCaptureProjection = {
    status: 'ready',
    accessRadiusMeters: 400,
    stopCount: 0,
    activeTimeBandId: mockTimeBandId,
    nodeSummary: createEmptyCapturedEntitySummary(),
    attractorSummary: createEmptyCapturedEntitySummary(),
    residentialSummary: { ...createEmptyCapturedEntitySummary(), totalWeight: 1000, capturedWeight: 500 },
    workplaceSummary: { ...createEmptyCapturedEntitySummary(), totalWeight: 1000, capturedWeight: 500 },
    gatewaySummary: { ...createEmptyCapturedEntitySummary(), totalWeight: 0, capturedWeight: 0 },
    nearestStopByEntityId: new Map([['node-res-1', { stopId: 's1', distanceMeters: 100 }]])
  };

  const mockServed: ServedDemandProjection = {
    status: 'ready',
    activeTimeBandId: mockTimeBandId,
    activeServiceLineCount: 1,
    capturedResidentialActiveWeight: 500,
    servedResidentialActiveWeight: 250,
    unservedResidentialActiveWeight: 250,
    capturedWorkplaceActiveWeight: 500,
    reachableWorkplaceActiveWeight: 250,
    inactiveOrNoServiceLineCount: 0,
    blockedLineCount: 0,
    reasons: {
      residentialCapturedButNoReachableWorkplace: 0,
      residentialCapturedButNoActiveService: 0,
      residentialNotCaptured: 0,
      workplaceCapturedButUnreachable: 0
    },
    servedResidentialNodeIds: new Set(['node-res-1']),
    reachableWorkplaceNodeIds: new Set(['node-work-1'])
  };

  const defaultInput = {
    artifact,
    selectedNodeId: 'node-res-1',
    inspectedTimeBandId: mockTimeBandId,
    followsSimulationTimeBand: true,
    scenarioDemandCaptureProjection: mockCapture,
    servedDemandProjection: mockServed
  };

  it('returns unavailable when artifact is missing', () => {
    const result = projectDemandNodeInspection({ ...defaultInput, artifact: null });
    expect(result.status).toBe('unavailable');
  });

  it('returns unavailable when selectedNodeId is missing or not found', () => {
    expect(projectDemandNodeInspection({ ...defaultInput, selectedNodeId: null }).status).toBe('unavailable');
    expect(projectDemandNodeInspection({ ...defaultInput, selectedNodeId: 'non-existent' }).status).toBe('unavailable');
  });

  it('returns residential inspection context for an origin node', () => {
    const result = projectDemandNodeInspection(defaultInput);
    
    expect(result.status).toBe('ready');
    expect(result.title).toBe('Residential demand node');
    expect(result.problemStatus).toBe('captured-and-served');
    expect(result.contextCandidates.length).toBe(1);
    expect(result.contextCandidates[0]!.candidateId).toBe('node-work-1');
    expect(result.selectedNodePosition).toEqual(mockNode1.position);
    expect(result.selectedNodeRole).toBe('origin');
  });

  it('returns workplace inspection context for a destination node', () => {
    const result = projectDemandNodeInspection({ ...defaultInput, selectedNodeId: 'node-work-1' });
    
    expect(result.status).toBe('ready');
    expect(result.title).toBe('Workplace demand node');
    expect(result.contextCandidates.length).toBe(1);
    expect(result.contextCandidates[0]!.candidateId).toBe('node-res-1');
    expect(result.selectedNodePosition).toEqual(mockNode2.position);
    expect(result.selectedNodeRole).toBe('destination');
  });

  it('derives accurate problem status (not-captured)', () => {
    const uncapturedCapture: ScenarioDemandCaptureProjection = {
      ...mockCapture,
      nearestStopByEntityId: new Map()
    };
    
    const result = projectDemandNodeInspection({ 
      ...defaultInput, 
      scenarioDemandCaptureProjection: uncapturedCapture 
    });
    expect(result.problemStatus).toBe('not-captured');
    expect(result.primaryAction).toContain('Place a stop near this residential demand');
  });

  it('derives accurate problem status (captured-unserved)', () => {
    const unservedServed: ServedDemandProjection = {
      ...mockServed,
      servedResidentialNodeIds: new Set()
    };
    
    const result = projectDemandNodeInspection({ 
      ...defaultInput, 
      servedDemandProjection: unservedServed 
    });
    expect(result.problemStatus).toBe('captured-unserved');
    expect(result.primaryAction).toContain('Connect this captured origin');
  });

  it('works for nodes outside of any ranked lists by using full artifact', () => {
    const extraNode: ScenarioDemandNode = {
      id: 'node-res-hidden',
      role: 'origin',
      class: 'residential',
      position: { lng: 11, lat: 51 },
      baseWeight: 10,
      timeBandWeights: createMockTimeBandWeights()
    };
    
    const result = projectDemandNodeInspection({ 
      ...defaultInput, 
      selectedNodeId: 'node-res-hidden',
      artifact: { ...artifact, nodes: [...artifact.nodes, extraNode] }
    });
    
    expect(result.status).toBe('ready');
    expect(result.selectedNodeId).toBe('node-res-hidden');
    expect(result.title).toBe('Residential demand node');
    // It's not in the capture map, so it should be not-captured
    expect(result.problemStatus).toBe('not-captured');
  });

  it('respects time-band override without changing simulation time input', () => {
    const nightBand: TimeBandId = 'night';
    const result = projectDemandNodeInspection({ 
      ...defaultInput, 
      inspectedTimeBandId: nightBand,
      followsSimulationTimeBand: false 
    });
    
    expect(result.inspectedTimeBandId).toBe(nightBand);
    expect(result.inspectedTimeBandLabel).toBe('Night');
    expect(result.followsSimulationTimeBand).toBe(false);
  });

  it('caps and orders candidates deterministically using full artifact', () => {
    const manyNodes = Array.from({ length: 10 }).map((_, i): ScenarioDemandNode => ({
      id: `node-work-many-${i}`,
      role: 'destination',
      class: 'workplace',
      position: { lng: 10.01 + i * 0.001, lat: 50.01 },
      baseWeight: 100,
      timeBandWeights: createMockTimeBandWeights()
    }));
    
    const result = projectDemandNodeInspection({ 
      ...defaultInput, 
      artifact: { ...artifact, nodes: [mockNode1, ...manyNodes] } 
    });
    
    expect(result.contextCandidates.length).toBe(5);
    expect(result.contextCandidates[0]!.candidateId).toBe('node-work-many-0');
    expect(result.contextCandidates[4]!.candidateId).toBe('node-work-many-4');
  });
});
