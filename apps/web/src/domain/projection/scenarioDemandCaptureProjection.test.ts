import { describe, it, expect } from 'vitest';
import { projectScenarioDemandCapture } from './scenarioDemandCaptureProjection';
import type { ScenarioDemandArtifact } from '../types/scenarioDemand';
import type { Stop, StopId } from '../types/stop';

describe('projectScenarioDemandCapture', () => {
  const mockTimeBandWeights = {
    'morning-rush': 1,
    'late-morning': 1,
    'midday': 1,
    'afternoon': 1,
    'evening-rush': 1,
    'evening': 1,
    'night': 1
  };

  const mockNode = {
    id: 'node-1',
    position: { lng: 10.0, lat: 53.5 },
    role: 'bidirectional' as const,
    class: 'residential' as const,
    baseWeight: 10,
    timeBandWeights: mockTimeBandWeights
  };

  const mockAttractor = {
    id: 'attractor-1',
    position: { lng: 10.01, lat: 53.5 },
    category: 'workplace' as const,
    scale: 'local' as const,
    sourceWeight: 5,
    sinkWeight: 20,
    timeBandWeights: mockTimeBandWeights
  };

  const mockGateway = {
    id: 'gateway-1',
    position: { lng: 10.0, lat: 53.51 },
    kind: 'rail-station' as const,
    scale: 'major' as const,
    sourceWeight: 10,
    sinkWeight: 10,
    transferWeight: 30,
    timeBandWeights: mockTimeBandWeights
  };

  const mockArtifact: ScenarioDemandArtifact = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    generatedAt: '2026-04-29T00:00:00Z',
    sourceMetadata: {
      generatedFrom: [],
      generatorName: 'test',
      generatorVersion: '1.0.0'
    },
    nodes: [mockNode],
    attractors: [mockAttractor],
    gateways: [mockGateway]
  };

  it('should return unavailable when artifact is null', () => {
    const result = projectScenarioDemandCapture({ artifact: null, stops: [] });
    expect(result.status).toBe('unavailable');
    expect(result.nodeSummary.totalCount).toBe(0);
  });

  it('should return ready with zero captured entities when no stops are placed', () => {
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [] });
    expect(result.status).toBe('ready');
    expect(result.nodeSummary.totalCount).toBe(1);
    expect(result.nodeSummary.capturedCount).toBe(0);
    expect(result.attractorSummary.capturedCount).toBe(0);
    expect(result.gatewaySummary.capturedCount).toBe(0);
  });

  it('should capture a demand node within radius', () => {
    const stop: Stop = {
      id: 'stop-1' as StopId,
      position: { lng: 10.0, lat: 53.5 }
    };
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop] });
    expect(result.nodeSummary.capturedCount).toBe(1);
    expect(result.nodeSummary.capturedWeight).toBe(10);
    expect(result.nearestStopByEntityId.get('node-1')?.stopId).toBe('stop-1');
  });

  it('should not capture a demand node outside radius', () => {
    const stop: Stop = {
      id: 'stop-1' as StopId,
      position: { lng: 11.0, lat: 54.0 } // Far away
    };
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop] });
    expect(result.nodeSummary.capturedCount).toBe(0);
    expect(result.nodeSummary.capturedWeight).toBe(0);
    expect(result.nearestStopByEntityId.has('node-1')).toBe(false);
  });

  it('should not double-count an entity when multiple stops are in range', () => {
    const stop1: Stop = {
      id: 'stop-1' as StopId,
      position: { lng: 10.0, lat: 53.5 }
    };
    const stop2: Stop = {
      id: 'stop-2' as StopId,
      position: { lng: 10.0001, lat: 53.5 }
    };
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop1, stop2] });
    expect(result.nodeSummary.capturedCount).toBe(1);
  });

  it('should select nearest capturing stop deterministically by shortest distance', () => {
    const stopFar: Stop = {
      id: 'stop-far' as StopId,
      position: { lng: 10.002, lat: 53.5 }
    };
    const stopNear: Stop = {
      id: 'stop-near' as StopId,
      position: { lng: 10.0001, lat: 53.5 }
    };
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stopFar, stopNear] });
    expect(result.nearestStopByEntityId.get('node-1')?.stopId).toBe('stop-near');
  });

  it('should use attractor sinkWeight', () => {
    const stop: Stop = {
      id: 'stop-1' as StopId,
      position: { lng: 10.01, lat: 53.5 }
    };
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop] });
    expect(result.attractorSummary.capturedCount).toBe(1);
    expect(result.attractorSummary.capturedWeight).toBe(20); // sinkWeight is 20
  });

  it('should use gateway transferWeight', () => {
    const stop: Stop = {
      id: 'stop-1' as StopId,
      position: { lng: 10.0, lat: 53.51 }
    };
    const result = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop] });
    expect(result.gatewaySummary.capturedCount).toBe(1);
    expect(result.gatewaySummary.capturedWeight).toBe(30); // transferWeight is 30
  });

  it('should allow overriding access radius', () => {
    const stop: Stop = {
      id: 'stop-1' as StopId,
      position: { lng: 10.005, lat: 53.5 } // ~350m away from node-1
    };
    // Default is 400m, should capture
    const resultDefault = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop] });
    expect(resultDefault.nodeSummary.capturedCount).toBe(1);

    // Override to 100m, should not capture
    const resultOverride = projectScenarioDemandCapture({ artifact: mockArtifact, stops: [stop], accessRadiusMeters: 100 });
    expect(resultOverride.nodeSummary.capturedCount).toBe(0);
  });

  it('should throw error for non-positive access radius', () => {
    expect(() => projectScenarioDemandCapture({ artifact: mockArtifact, stops: [], accessRadiusMeters: 0 })).toThrow(
      'Access radius must be a positive number.'
    );
    expect(() => projectScenarioDemandCapture({ artifact: mockArtifact, stops: [], accessRadiusMeters: -1 })).toThrow(
      'Access radius must be a positive number.'
    );
  });
});
