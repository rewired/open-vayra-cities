import { describe, expect, it } from 'vitest';
import {
  createLineFrequencyMinutes,
  createLineId,
  createNoServiceLineServiceByTimeBand,
  type Line,
  type LineServiceByTimeBand
} from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import { createStopId, type Stop, type StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';
import { createSimulationMinuteOfDay, createSimulationSecondOfDay } from '../simulation/simulationClock';
import { useNetworkPlanningProjections } from './useNetworkPlanningProjections';

const allTimeBandWeights = (): Record<TimeBandId, number> => ({
  'morning-rush': 1,
  'late-morning': 1,
  midday: 1,
  afternoon: 1,
  'evening-rush': 1,
  evening: 1,
  night: 1
});

const residentialNode: ScenarioDemandNode = {
  id: 'node-res',
  role: 'origin',
  class: 'residential',
  position: { lng: 0, lat: 0 },
  baseWeight: 10,
  timeBandWeights: allTimeBandWeights()
};

const workplaceNode: ScenarioDemandNode = {
  id: 'node-work',
  role: 'destination',
  class: 'workplace',
  position: { lng: 0.01, lat: 0 },
  baseWeight: 10,
  timeBandWeights: allTimeBandWeights()
};

const artifact: ScenarioDemandArtifact = {
  schemaVersion: 1,
  scenarioId: 'test-scenario',
  generatedAt: '2026-05-04T00:00:00.000Z',
  sourceMetadata: {
    generatedFrom: [],
    generatorName: 'test-generator',
    generatorVersion: '1.0.0'
  },
  nodes: [residentialNode, workplaceNode],
  attractors: [],
  gateways: []
};

const originStop: Stop = {
  id: createStopId('stop-origin'),
  label: 'Origin Stop',
  position: { lng: 0, lat: 0 }
};

const workplaceStop: Stop = {
  id: createStopId('stop-work'),
  label: 'Work Stop',
  position: { lng: 0.01, lat: 0 }
};

const makeSegment = (lineId: Line['id'], fromStopId: StopId, toStopId: StopId): LineRouteSegment => ({
  id: createLineSegmentId(`${lineId}-segment-0`),
  lineId,
  fromStopId,
  toStopId,
  orderedGeometry: [
    [0, 0],
    [0.01, 0]
  ],
  distanceMeters: createRouteDistanceMeters(1000),
  inMotionTravelMinutes: createRouteTravelMinutes(4),
  dwellMinutes: createRouteTravelMinutes(1),
  totalTravelMinutes: createRouteTravelMinutes(5),
  status: 'routed'
});

const serviceOnlyInNight = (): LineServiceByTimeBand => ({
  ...createNoServiceLineServiceByTimeBand(),
  night: {
    kind: 'frequency',
    headwayMinutes: createLineFrequencyMinutes(15)
  }
});

const makeNightLine = (): Line => {
  const lineId = createLineId('line-night');
  return {
    id: lineId,
    label: 'Night Line',
    stopIds: [originStop.id, workplaceStop.id],
    topology: 'linear',
    servicePattern: 'one-way',
    routeSegments: [makeSegment(lineId, originStop.id, workplaceStop.id)],
    frequencyByTimeBand: serviceOnlyInNight()
  };
};

describe('useNetworkPlanningProjections', () => {
  it('passes the selected demand inspection time band into service coverage without mutating simulation service truth', () => {
    const line = makeNightLine();
    const originalNightPlan = line.frequencyByTimeBand.night;
    const projections = useNetworkPlanningProjections(
      [line],
      [originStop, workplaceStop],
      null,
      null,
      'morning-rush',
      createSimulationMinuteOfDay(7 * 60),
      createSimulationSecondOfDay(7 * 60 * 60),
      artifact,
      null,
      residentialNode.id,
      'night'
    );

    expect(projections.demandNodeInspectionProjection.inspectedTimeBandId).toBe('night');
    expect(projections.selectedDemandNodeServiceCoverageProjection.inspectedTimeBandId).toBe('night');
    expect(projections.selectedDemandNodeServiceCoverageProjection.status).toBe('served-by-active-line');
    expect(projections.servedDemandProjection.activeTimeBandId).toBe('morning-rush');
    expect(projections.servedDemandProjection.activeServiceLineCount).toBe(0);
    expect(line.frequencyByTimeBand.night).toBe(originalNightPlan);
  });
});
