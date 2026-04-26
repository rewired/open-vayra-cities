import { describe, expect, it } from 'vitest';
import { projectNetworkDemand } from './demandCatchmentProjection';
import { createDemandNodeId, createDemandWeight, type DemandNode } from '../types/demandNode';
import { createStopId, type Stop } from '../types/stop';
import { createLineId, type Line } from '../types/line';
import type { LineServicePlanProjection } from '../types/lineServicePlanProjection';

describe('demandCatchmentProjection', () => {
  const activeTimeBandId = 'morning-rush';

  const resNode: DemandNode = {
    id: createDemandNodeId('res-1'),
    label: 'Res',
    position: { lng: 10, lat: 50 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: { [activeTimeBandId]: createDemandWeight(100) } as any
  };

  const workNode: DemandNode = {
    id: createDemandNodeId('work-1'),
    label: 'Work',
    position: { lng: 10.01, lat: 50.01 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: { [activeTimeBandId]: createDemandWeight(200) } as any
  };

  const stop1: Stop = { id: createStopId('stop-1'), position: { lng: 10, lat: 50 } };
  const stop2: Stop = { id: createStopId('stop-2'), position: { lng: 10.01, lat: 50.01 } };

  const createMockProjectionResult = (lineId: string, activeBandState: 'frequency' | 'no-service' = 'frequency'): any => ({
    lineId: createLineId(lineId),
    activeBandState,
    lineLabel: `Line ${lineId}`,
    activeTimeBandId,
    currentBandHeadwayMinutes: 10,
    theoreticalDeparturesPerHour: 6,
    routeSegmentCount: 2,
    totalRouteTravelMinutes: 10,
    status: 'configured',
    readiness: { status: 'ready', summary: { errorIssueCount: 0, warningIssueCount: 0 } as any, issues: [] }
  });

  const mockServicePlan: LineServicePlanProjection = {
    summary: { 
      activeTimeBandId, 
      degradedLineCount: 0, 
      blockedLineCount: 0,
      totalCompletedLineCount: 1,
      totalLineCount: 1,
      configuredLineCount: 1,
      totalRouteSegmentCount: 2,
      totalRouteTravelMinutes: 10,
      totalTheoreticalDeparturesPerHour: 6
    },
    lines: [createMockProjectionResult('line-1')]
  };

  it('calculates capture correctly', () => {
    const projection = projectNetworkDemand(
      [resNode, workNode],
      [stop1], // only stop1, so only resNode is captured
      [],
      mockServicePlan,
      activeTimeBandId
    );

    expect(projection.residential.capturedWeight).toBe(100);
    expect(projection.residential.totalWeight).toBe(100);
    expect(projection.residential.capturedNodeCount).toBe(1);

    expect(projection.workplace.capturedWeight).toBe(0);
    expect(projection.workplace.totalWeight).toBe(200);
    expect(projection.workplace.capturedNodeCount).toBe(0);
  });

  it('calculates served demand correctly', () => {
    const line: Line = {
      id: createLineId('line-1'),
      label: 'Line 1',
      stopIds: [stop1.id, stop2.id],
      routeSegments: [],
      topology: 'linear',
      servicePattern: 'one-way',
      frequencyByTimeBand: {} as any
    };

    const projection = projectNetworkDemand(
      [resNode, workNode],
      [stop1, stop2],
      [line],
      mockServicePlan,
      activeTimeBandId
    );

    expect(projection.activelyServedResidentialWeight).toBe(100);
  });

  it('does not serve demand if workplace is before residential on one-way line', () => {
    const line: Line = {
      id: createLineId('line-1'),
      label: 'Line 1',
      stopIds: [stop2.id, stop1.id], // reversed
      routeSegments: [],
      topology: 'linear',
      servicePattern: 'one-way',
      frequencyByTimeBand: {} as any
    };

    const projection = projectNetworkDemand(
      [resNode, workNode],
      [stop1, stop2],
      [line],
      mockServicePlan,
      activeTimeBandId
    );

    expect(projection.activelyServedResidentialWeight).toBe(0);
  });

  it('serves demand regardless of order for loop lines', () => {
    const line: Line = {
      id: createLineId('line-1'),
      label: 'Line 1',
      stopIds: [stop2.id, stop1.id], // reversed
      routeSegments: [],
      topology: 'loop',
      servicePattern: 'one-way',
      frequencyByTimeBand: {} as any
    };

    const projection = projectNetworkDemand(
      [resNode, workNode],
      [stop1, stop2],
      [line],
      mockServicePlan,
      activeTimeBandId
    );

    expect(projection.activelyServedResidentialWeight).toBe(100);
  });

  it('serves demand regardless of order for bidirectional linear lines', () => {
    const line: Line = {
      id: createLineId('line-1'),
      label: 'Line 1',
      stopIds: [stop2.id, stop1.id], // reversed
      routeSegments: [],
      topology: 'linear',
      servicePattern: 'bidirectional',
      frequencyByTimeBand: {} as any
    };

    const projection = projectNetworkDemand(
      [resNode, workNode],
      [stop1, stop2],
      [line],
      mockServicePlan,
      activeTimeBandId
    );

    expect(projection.activelyServedResidentialWeight).toBe(100);
  });

  it('does not double count served residential nodes across overlapping lines', () => {
    const line1: Line = {
      id: createLineId('line-1'),
      label: 'Line 1',
      stopIds: [stop1.id, stop2.id],
      routeSegments: [],
      topology: 'linear',
      servicePattern: 'one-way',
      frequencyByTimeBand: {} as any
    };
    const line2: Line = {
      id: createLineId('line-2'),
      label: 'Line 2',
      stopIds: [stop1.id, stop2.id],
      routeSegments: [],
      topology: 'linear',
      servicePattern: 'one-way',
      frequencyByTimeBand: {} as any
    };

    const servicePlan: LineServicePlanProjection = {
      ...mockServicePlan,
      lines: [
        createMockProjectionResult('line-1'),
        createMockProjectionResult('line-2')
      ]
    };

    const projection = projectNetworkDemand(
      [resNode, workNode],
      [stop1, stop2],
      [line1, line2],
      servicePlan,
      activeTimeBandId
    );

    expect(projection.activelyServedResidentialWeight).toBe(100); // should be 100, not 200
  });
});
