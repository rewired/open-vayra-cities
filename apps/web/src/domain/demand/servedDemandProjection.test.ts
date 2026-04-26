import { describe, expect, it } from 'vitest';
import { projectLineBandDemand } from './servedDemandProjection';
import { createLineId } from '../types/line';
import { createStopId, type StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';
import type { StopDemandCatchment } from './demandCatchment';
import { createDemandNodeId, createDemandWeight, createZeroDemandWeightByTimeBand, type DemandNode, type DemandNodeId, type DemandWeight } from '../types/demandNode';

describe('servedDemandProjection', () => {
  const lineId = createLineId('line-1');
  const band: TimeBandId = 'morning-rush';
  
  const createWeights = (overrides: Partial<Record<TimeBandId, number>>): Record<TimeBandId, DemandWeight> => {
    const weights = createZeroDemandWeightByTimeBand();
    for (const [bandId, weight] of Object.entries(overrides)) {
      weights[bandId as TimeBandId] = createDemandWeight(weight);
    }
    return weights;
  };

  const createMockNode = (id: string, role: 'origin' | 'destination', weight: number): DemandNode => ({
    id: createDemandNodeId(id),
    label: id,
    position: { lng: 0, lat: 0 },
    role,
    demandClass: role === 'origin' ? 'residential' : 'workplace',
    weightByTimeBand: createWeights({ [band]: weight })
  });

  const createCatchment = (stopId: string, nodeIds: string[]): StopDemandCatchment => ({
    stopId: createStopId(stopId),
    capturedDemandNodeIds: nodeIds.map(id => createDemandNodeId(id)),
    residentialOriginWeightByTimeBand: createZeroDemandWeightByTimeBand(), // Not used in refactored version
    workplaceDestinationWeightByTimeBand: createZeroDemandWeightByTimeBand(), // Not used in refactored version
  });

  const emptyMaps = {
    residentialNodeMap: new Map<DemandNodeId, DemandNode>(),
    workplaceNodeMap: new Map<DemandNodeId, DemandNode>()
  };

  it('returns zero and unconfigured status for unset service', () => {
    const result = projectLineBandDemand(lineId, [], 'linear', 'one-way', band, 'unset', new Map(), emptyMaps.residentialNodeMap, emptyMaps.workplaceNodeMap);
    expect(result.status).toBe('unconfigured');
    expect(result.servedDemandWeight).toBe(0);
    expect(result.warnings[0]!.type).toBe('no-service-configured');
  });

  it('returns zero and no-service status for no-service', () => {
    const result = projectLineBandDemand(lineId, [], 'linear', 'one-way', band, 'no-service', new Map(), emptyMaps.residentialNodeMap, emptyMaps.workplaceNodeMap);
    expect(result.status).toBe('no-service');
    expect(result.servedDemandWeight).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('correctly pairs valid directional demand', () => {
    const orderedStopIds = [createStopId('s1'), createStopId('s2')];
    const resNode = createMockNode('res-1', 'origin', 10);
    const workNode = createMockNode('work-1', 'destination', 20);

    const catchments = new Map<StopId, StopDemandCatchment>([
      [createStopId('s1'), createCatchment('s1', ['res-1'])],
      [createStopId('s2'), createCatchment('s2', ['work-1'])]
    ]);

    const residentialNodeMap = new Map([[resNode.id, resNode]]);
    const workplaceNodeMap = new Map([[workNode.id, workNode]]);

    const result = projectLineBandDemand(lineId, orderedStopIds, 'linear', 'one-way', band, 'frequency', catchments, residentialNodeMap, workplaceNodeMap);
    expect(result.status).toBe('served');
    expect(result.capturedOriginWeight).toBe(10);
    expect(result.capturedDestinationWeight).toBe(20);
    expect(result.servedDemandWeight).toBe(10); // min(10, 20)
  });

  it('does not pair wrong-directional demand on one-way linear line', () => {
    const orderedStopIds = [createStopId('s1'), createStopId('s2')];
    const resNode = createMockNode('res-1', 'origin', 10);
    const workNode = createMockNode('work-1', 'destination', 20);

    const catchments = new Map<StopId, StopDemandCatchment>([
      [createStopId('s1'), createCatchment('s1', ['work-1'])], // Destination before origin
      [createStopId('s2'), createCatchment('s2', ['res-1'])]
    ]);

    const residentialNodeMap = new Map([[resNode.id, resNode]]);
    const workplaceNodeMap = new Map([[workNode.id, workNode]]);

    const result = projectLineBandDemand(lineId, orderedStopIds, 'linear', 'one-way', band, 'frequency', catchments, residentialNodeMap, workplaceNodeMap);
    expect(result.status).toBe('no-demand');
    expect(result.servedDemandWeight).toBe(0);
    expect(result.warnings[0]!.type).toBe('wrong-direction');
  });

  it('pairs regardless of order for bidirectional linear lines', () => {
    const orderedStopIds = [createStopId('s1'), createStopId('s2')];
    const resNode = createMockNode('res-1', 'origin', 10);
    const workNode = createMockNode('work-1', 'destination', 20);

    const catchments = new Map<StopId, StopDemandCatchment>([
      [createStopId('s1'), createCatchment('s1', ['work-1'])], // Destination before origin
      [createStopId('s2'), createCatchment('s2', ['res-1'])]
    ]);

    const residentialNodeMap = new Map([[resNode.id, resNode]]);
    const workplaceNodeMap = new Map([[workNode.id, workNode]]);

    const result = projectLineBandDemand(lineId, orderedStopIds, 'linear', 'bidirectional', band, 'frequency', catchments, residentialNodeMap, workplaceNodeMap);
    expect(result.status).toBe('served');
    expect(result.servedDemandWeight).toBe(10);
  });

  it('pairs regardless of order for loop lines', () => {
    const orderedStopIds = [createStopId('s1'), createStopId('s2')];
    const resNode = createMockNode('res-1', 'origin', 10);
    const workNode = createMockNode('work-1', 'destination', 20);

    const catchments = new Map<StopId, StopDemandCatchment>([
      [createStopId('s1'), createCatchment('s1', ['work-1'])], // Destination before origin
      [createStopId('s2'), createCatchment('s2', ['res-1'])]
    ]);

    const residentialNodeMap = new Map([[resNode.id, resNode]]);
    const workplaceNodeMap = new Map([[workNode.id, workNode]]);

    const result = projectLineBandDemand(lineId, orderedStopIds, 'loop', 'one-way', band, 'frequency', catchments, residentialNodeMap, workplaceNodeMap);
    expect(result.status).toBe('served');
    expect(result.servedDemandWeight).toBe(10);
  });

  it('deduplicates a residential node captured by multiple stops on the same line', () => {
    const orderedStopIds = [createStopId('s1'), createStopId('s2'), createStopId('s3')];
    const resNode = createMockNode('res-1', 'origin', 10);
    const workNode = createMockNode('work-1', 'destination', 20);

    const catchments = new Map<StopId, StopDemandCatchment>([
      [createStopId('s1'), createCatchment('s1', ['res-1'])],
      [createStopId('s2'), createCatchment('s2', ['res-1'])], // Double capture
      [createStopId('s3'), createCatchment('s3', ['work-1'])]
    ]);

    const residentialNodeMap = new Map([[resNode.id, resNode]]);
    const workplaceNodeMap = new Map([[workNode.id, workNode]]);

    const result = projectLineBandDemand(lineId, orderedStopIds, 'linear', 'one-way', band, 'frequency', catchments, residentialNodeMap, workplaceNodeMap);
    expect(result.capturedOriginWeight).toBe(10); // Not 20
    expect(result.servedDemandWeight).toBe(10);
  });

  it('identifies incomplete pairing when destination is missing', () => {
    const orderedStopIds = [createStopId('s1'), createStopId('s2')];
    const resNode = createMockNode('res-1', 'origin', 10);

    const catchments = new Map<StopId, StopDemandCatchment>([
      [createStopId('s1'), createCatchment('s1', ['res-1'])],
      [createStopId('s2'), createCatchment('s2', [])]
    ]);

    const residentialNodeMap = new Map([[resNode.id, resNode]]);

    const result = projectLineBandDemand(lineId, orderedStopIds, 'linear', 'one-way', band, 'frequency', catchments, residentialNodeMap, emptyMaps.workplaceNodeMap);
    expect(result.status).toBe('incomplete-pairing');
    expect(result.warnings[0]!.type).toBe('missing-destination');
  });
});
