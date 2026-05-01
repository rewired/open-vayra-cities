import { describe, it, expect } from 'vitest';
import { projectScenarioDemandCapture } from './scenarioDemandCaptureProjection';
import type { ScenarioDemandArtifact, ScenarioDemandNode, ScenarioDemandAttractor, ScenarioDemandGateway } from '../types/scenarioDemand';
import type { Stop } from '../types/stop';
import { 
  createTestStop, 
  createTestScenarioDemandNode, 
  createTestScenarioDemandArtifact,
  createTestTimeBandWeights
} from './testFixtures';

describe('projectScenarioDemandCapture', () => {
  const mockTimeBandWeights = createTestTimeBandWeights(1.0, {
    'morning-rush': 1.5,
    'midday': 0.5,
    'night': 0
  });

  const mockNode: ScenarioDemandNode = {
    id: 'node-1',
    position: { lng: 10.0, lat: 53.5 },
    role: 'bidirectional',
    class: 'residential',
    baseWeight: 10,
    timeBandWeights: mockTimeBandWeights
  };

  const mockAttractor: ScenarioDemandAttractor = {
    id: 'attractor-1',
    position: { lng: 10.01, lat: 53.5 },
    category: 'workplace',
    scale: 'local',
    sourceWeight: 5,
    sinkWeight: 20,
    timeBandWeights: mockTimeBandWeights
  };

  const mockGateway: ScenarioDemandGateway = {
    id: 'gateway-1',
    position: { lng: 10.0, lat: 53.51 },
    kind: 'rail-station',
    scale: 'major',
    sourceWeight: 10,
    sinkWeight: 10,
    transferWeight: 30,
    timeBandWeights: mockTimeBandWeights
  };

  const mockArtifact: ScenarioDemandArtifact = createTestScenarioDemandArtifact({
    nodes: [mockNode],
    attractors: [mockAttractor],
    gateways: [mockGateway]
  });

  it('should return unavailable when artifact is null', () => {
    const result = projectScenarioDemandCapture({ artifact: null, stops: [], activeTimeBandId: null });
    expect(result.status).toBe('unavailable');
    expect(result.nodeSummary.totalCount).toBe(0);
  });

  it('should return ready with zero captured entities when no stops are placed', () => {
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [], activeTimeBandId: null });
    expect(result.status).toBe('ready');
    expect(result.nodeSummary.totalCount).toBe(1);
    expect(result.nodeSummary.capturedCount).toBe(0);
  });

  it('should calculate active weights when activeTimeBandId is provided', () => {
    const stop = createTestStop('stop-1', 10.0, 53.5);
    const resultMorning = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop], activeTimeBandId: 'morning-rush' });
    expect(resultMorning.nodeSummary.totalActiveWeight).toBe(15); // 10 * 1.5
    expect(resultMorning.nodeSummary.capturedActiveWeight).toBe(15);

    const resultMidday = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop], activeTimeBandId: 'midday' });
    expect(resultMidday.nodeSummary.totalActiveWeight).toBe(5); // 10 * 0.5
    expect(resultMidday.nodeSummary.capturedActiveWeight).toBe(5);
  });

  it('should use base weights as fallback if activeTimeBandId is null', () => {
    const stop = createTestStop('stop-1', 10.0, 53.5);
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop], activeTimeBandId: null });
    expect(result.nodeSummary.totalActiveWeight).toBe(10); // baseWeight
    expect(result.nodeSummary.capturedActiveWeight).toBe(10);
  });

  it('should capture a demand node within radius', () => {
    const stop = createTestStop('stop-1', 10.0, 53.5);
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop], activeTimeBandId: null });
    expect(result.nodeSummary.capturedCount).toBe(1);
    expect(result.nodeSummary.capturedWeight).toBe(10);
    expect(result.nearestStopByEntityId.get('node-1')?.stopId).toBe('stop-1');
  });

  it('should not double-count an entity when multiple stops are in range', () => {
    const stop1 = createTestStop('stop-1', 10.0, 53.5);
    const stop2 = createTestStop('stop-2', 10.0001, 53.5);
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop1, stop2], activeTimeBandId: null });
    expect(result.nodeSummary.capturedCount).toBe(1);
    expect(result.nodeSummary.capturedActiveWeight).toBe(10);
  });

  it('should use attractor active sinkWeight', () => {
    const stop = createTestStop('stop-1', 10.01, 53.5);
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop], activeTimeBandId: 'morning-rush' });
    expect(result.attractorSummary.capturedCount).toBe(1);
    expect(result.attractorSummary.totalActiveWeight).toBe(30); // 20 * 1.5
    expect(result.attractorSummary.capturedActiveWeight).toBe(30);
  });

  it('should use gateway active transferWeight', () => {
    const stop = createTestStop('stop-1', 10.0, 53.51);
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop], activeTimeBandId: 'morning-rush' });
    expect(result.gatewaySummary.capturedCount).toBe(1);
    expect(result.gatewaySummary.totalActiveWeight).toBe(45); // 30 * 1.5
    expect(result.gatewaySummary.capturedActiveWeight).toBe(45);
  });

  it('should throw error for non-positive access radius', () => {
    expect(() => projectScenarioDemandCapture({ artifact: mockArtifact, stops: [], activeTimeBandId: null, accessRadiusMeters: 0 })).toThrow(
      'Access radius must be a positive number.'
    );
  });
});
