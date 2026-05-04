import { describe, expect, it } from 'vitest';
import {
  SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES,
  SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_STOPS
} from '../constants/scenarioDemand';
import {
  createLineFrequencyMinutes,
  createLineId,
  createNoServiceLineServiceByTimeBand,
  type Line,
  type LineServiceByTimeBand,
  type LineServicePattern,
  type LineTopology
} from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import { createStopId, type Stop, type StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';
import type { DemandNodeInspectionProjection } from './demandNodeInspectionProjection';
import {
  projectSelectedDemandNodeServiceCoverage,
  type SelectedDemandNodeServiceCoverageProjection
} from './selectedDemandNodeServiceCoverageProjection';

const SELECTED_BAND: TimeBandId = 'morning-rush';
const OTHER_BAND: TimeBandId = 'night';

const selectedOriginPosition = { lng: 0, lat: 0 };
const workplaceCandidatePosition = { lng: 0.01, lat: 0 };
const residentialCandidatePosition = { lng: -0.01, lat: 0 };

const requireFirst = <T>(items: readonly T[], message: string): T => {
  const [first] = items;
  if (first === undefined) {
    throw new Error(message);
  }

  return first;
};

const makeStop = (id: string, lng: number, lat: number, label = id): Stop => ({
  id: createStopId(id),
  label,
  position: { lng, lat }
});

const stopOrigin = makeStop('stop-origin', 0, 0, 'Origin Stop');
const stopWork = makeStop('stop-work', 0.01, 0, 'Work Stop');
const stopResidential = makeStop('stop-residential', -0.01, 0, 'Residential Stop');
const stopFar = makeStop('stop-far', 0.1, 0, 'Far Stop');

const makeSegment = (lineId: Line['id'], fromStopId: StopId, toStopId: StopId, index: number): LineRouteSegment => ({
  id: createLineSegmentId(`${lineId}-segment-${index}`),
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

const makeService = (
  activeBand: TimeBandId,
  kind: 'frequency' | 'no-service' = 'frequency'
): LineServiceByTimeBand => {
  const base = createNoServiceLineServiceByTimeBand();
  if (kind === 'no-service') {
    return base;
  }

  return {
    ...base,
    [activeBand]: {
      kind: 'frequency',
      headwayMinutes: createLineFrequencyMinutes(12)
    }
  };
};

const makeLine = (input: {
  readonly id: string;
  readonly stopIds: readonly StopId[];
  readonly servicePattern?: LineServicePattern;
  readonly topology?: LineTopology;
  readonly activeBand?: TimeBandId;
  readonly serviceKind?: 'frequency' | 'no-service';
}): Line => {
  const lineId = createLineId(input.id);
  const stopIds = input.stopIds;
  const topology = input.topology ?? 'linear';
  const segmentPairs: Array<readonly [StopId, StopId]> = [];

  for (let index = 0; index < stopIds.length - 1; index += 1) {
    const fromStopId = stopIds[index];
    const toStopId = stopIds[index + 1];
    if (fromStopId !== undefined && toStopId !== undefined) {
      segmentPairs.push([fromStopId, toStopId]);
    }
  }

  if (topology === 'loop') {
    const lastStopId = stopIds[stopIds.length - 1];
    const firstStopId = stopIds[0];
    if (lastStopId !== undefined && firstStopId !== undefined) {
      segmentPairs.push([lastStopId, firstStopId]);
    }
  }

  return {
    id: lineId,
    label: input.id,
    stopIds,
    topology,
    servicePattern: input.servicePattern ?? 'one-way',
    routeSegments: segmentPairs.map(([fromStopId, toStopId], index) =>
      makeSegment(lineId, fromStopId, toStopId, index)
    ),
    frequencyByTimeBand: makeService(input.activeBand ?? SELECTED_BAND, input.serviceKind ?? 'frequency')
  };
};

const makeInspection = (
  overrides: Partial<DemandNodeInspectionProjection> = {}
): DemandNodeInspectionProjection => ({
  status: 'ready',
  selectedNodeId: 'node-origin',
  inspectedTimeBandId: SELECTED_BAND,
  inspectedTimeBandLabel: 'Morning rush',
  followsSimulationTimeBand: true,
  title: 'Residential demand node',
  summary: 'Residential demand node.',
  problemStatus: 'context-only',
  primaryAction: null,
  caveat: null,
  evidence: [],
  contextCandidates: [
    {
      ordinal: 1,
      candidateId: 'node-work',
      label: 'node-work',
      roleLabel: 'Destination',
      demandClassLabel: 'workplace',
      activeWeightLabel: '10.0',
      distanceLabel: '1.1km',
      position: workplaceCandidatePosition
    }
  ],
  selectedNodePosition: selectedOriginPosition,
  selectedNodeRole: 'origin',
  ...overrides
});

const project = (input: {
  readonly inspection?: DemandNodeInspectionProjection;
  readonly stops?: readonly Stop[];
  readonly lines?: readonly Line[];
}): SelectedDemandNodeServiceCoverageProjection =>
  projectSelectedDemandNodeServiceCoverage({
    demandNodeInspectionProjection: input.inspection ?? makeInspection(),
    placedStops: input.stops ?? [stopOrigin, stopWork],
    completedLines: input.lines ?? []
  });

describe('projectSelectedDemandNodeServiceCoverage', () => {
  it('returns an empty no-selected-node status when demand inspection is unavailable without selection', () => {
    const result = project({
      inspection: makeInspection({
        status: 'unavailable',
        selectedNodeId: null,
        inspectedTimeBandId: null,
        inspectedTimeBandLabel: null,
        selectedNodePosition: null,
        selectedNodeRole: null,
        contextCandidates: []
      })
    });

    expect(result.status).toBe('no-selected-node');
    expect(result.coveringStops).toEqual([]);
    expect(result.summaryLabel).toBe('No demand node selected');
  });

  it('returns unavailable when demand inspection has a selected node but no usable inspection context', () => {
    const result = project({
      inspection: makeInspection({
        status: 'unavailable',
        selectedNodeId: 'node-origin',
        selectedNodePosition: null,
        selectedNodeRole: null,
        contextCandidates: []
      })
    });

    expect(result.status).toBe('unavailable');
    expect(result.selectedNodeId).toBe('node-origin');
  });

  it('returns no-stop-coverage when no placed stop is inside the selected node access radius', () => {
    const result = project({ stops: [stopFar] });

    expect(result.status).toBe('no-stop-coverage');
    expect(result.summaryLabel).toBe('No nearby stop coverage');
    expect(result.reason).toContain('400m');
  });

  it('returns covered-no-line when selected-side stop coverage exists but no completed line includes it', () => {
    const result = project({ stops: [stopOrigin, stopWork], lines: [] });

    expect(result.status).toBe('covered-no-line');
    expect(result.coveringStops.map((stop) => stop.stopId)).toEqual([stopOrigin.id]);
    expect(result.diagnostics.selectedSideCoveringStopCount).toBe(1);
  });

  it('returns line-no-opposite-context when a line includes selected-side stops but no candidate-side stop', () => {
    const line = makeLine({ id: 'line-selected-only', stopIds: [stopOrigin.id, stopFar.id] });
    const result = project({ stops: [stopOrigin, stopFar], lines: [line] });

    expect(result.status).toBe('line-no-opposite-context');
    expect(result.diagnostics.lineWithSelectedSideStopCount).toBe(1);
    expect(result.diagnostics.structurallyConnectingLineCount).toBe(0);
  });

  it('returns served-by-active-line when an origin-side selection can reach a workplace candidate on active service', () => {
    const line = makeLine({ id: 'line-active', stopIds: [stopOrigin.id, stopWork.id] });
    const result = project({ lines: [line] });

    expect(result.status).toBe('served-by-active-line');
    expect(result.summaryLabel).toBe('Active structural service available');
    expect(requireFirst(result.activeLines, 'Expected an active line').serviceLabel).toBe('12 min headway');
  });

  it('returns line-no-active-service when a structural line has explicit no-service in the inspected band', () => {
    const line = makeLine({
      id: 'line-no-service',
      stopIds: [stopOrigin.id, stopWork.id],
      serviceKind: 'no-service'
    });
    const result = project({ lines: [line] });

    expect(result.status).toBe('line-no-active-service');
    expect(result.activeLines).toEqual([]);
    expect(requireFirst(result.connectingLines, 'Expected a connecting line').serviceLabel).toBe('No service');
  });

  it('does not count a one-way line that travels in the wrong direction', () => {
    const wrongWayLine = makeLine({ id: 'line-wrong-way', stopIds: [stopWork.id, stopOrigin.id] });
    const result = project({ lines: [wrongWayLine] });

    expect(result.status).toBe('line-no-opposite-context');
    expect(result.diagnostics.lineWithSelectedSideStopCount).toBe(1);
    expect(result.diagnostics.structurallyConnectingLineCount).toBe(0);
  });

  it('counts bidirectional and loop line topology according to existing structural semantics', () => {
    const bidirectionalLine = makeLine({
      id: 'line-bidirectional',
      stopIds: [stopWork.id, stopOrigin.id],
      servicePattern: 'bidirectional'
    });
    const loopLine = makeLine({
      id: 'line-loop',
      stopIds: [stopWork.id, stopOrigin.id],
      topology: 'loop'
    });

    const bidirectionalResult = project({ lines: [bidirectionalLine] });
    const loopResult = project({ lines: [loopLine] });

    expect(bidirectionalResult.status).toBe('served-by-active-line');
    expect(loopResult.status).toBe('served-by-active-line');
  });

  it('evaluates selected workplace inspection from residential candidate side to selected workplace side', () => {
    const inspection = makeInspection({
      selectedNodeId: 'node-work',
      selectedNodePosition: workplaceCandidatePosition,
      selectedNodeRole: 'destination',
      title: 'Workplace demand node',
      contextCandidates: [
        {
          ordinal: 1,
          candidateId: 'node-res',
          label: 'node-res',
          roleLabel: 'Origin',
          demandClassLabel: 'residential',
          activeWeightLabel: '12.0',
          distanceLabel: '2.2km',
          position: residentialCandidatePosition
        }
      ]
    });
    const rightWayLine = makeLine({ id: 'line-to-work', stopIds: [stopResidential.id, stopWork.id] });
    const wrongWayLine = makeLine({ id: 'line-from-work', stopIds: [stopWork.id, stopResidential.id] });

    expect(project({ inspection, stops: [stopResidential, stopWork], lines: [rightWayLine] }).status).toBe(
      'served-by-active-line'
    );
    expect(project({ inspection, stops: [stopResidential, stopWork], lines: [wrongWayLine] }).status).toBe(
      'line-no-opposite-context'
    );
  });

  it('evaluates selected residential inspection from selected origin side to workplace candidate side', () => {
    const rightWayLine = makeLine({ id: 'line-from-origin', stopIds: [stopOrigin.id, stopWork.id] });
    const wrongWayLine = makeLine({ id: 'line-to-origin', stopIds: [stopWork.id, stopOrigin.id] });

    expect(project({ lines: [rightWayLine] }).status).toBe('served-by-active-line');
    expect(project({ lines: [wrongWayLine] }).status).toBe('line-no-opposite-context');
  });

  it('sorts coverage details deterministically and caps them after calculation', () => {
    const stops = [
      makeStop('stop-z', 0.0004, 0, 'Z Stop'),
      makeStop('stop-a', 0.0001, 0, 'A Stop'),
      makeStop('stop-b', 0.0002, 0, 'B Stop'),
      makeStop('stop-c', 0.0003, 0, 'C Stop'),
      makeStop('stop-d', 0.00035, 0, 'D Stop'),
      makeStop('stop-e', 0.00039, 0, 'E Stop'),
      stopWork
    ];
    const result = project({ stops });

    expect(result.coveringStops).toHaveLength(SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_STOPS);
    expect(result.coveringStops.map((stop) => stop.label)).toEqual(['A Stop', 'B Stop', 'C Stop', 'D Stop', 'E Stop']);
    expect(result.diagnostics.selectedSideCoveringStopCount).toBe(6);
    expect(result.diagnostics.hiddenSelectedSideCoveringStopCount).toBe(1);
  });

  it('caps active line details after calculating the full active line count', () => {
    const lines = Array.from({ length: SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES + 2 }).map((_, index) =>
      makeLine({ id: `line-${String(index).padStart(2, '0')}`, stopIds: [stopOrigin.id, stopWork.id] })
    );
    const result = project({ lines });

    expect(result.status).toBe('served-by-active-line');
    expect(result.activeLines).toHaveLength(SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES);
    expect(result.diagnostics.activeConnectingLineCount).toBe(SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES + 2);
    expect(result.diagnostics.hiddenActiveConnectingLineCount).toBe(2);
  });

  it('uses the selected inspection time band instead of a hardcoded current band', () => {
    const line = makeLine({
      id: 'line-night-only',
      stopIds: [stopOrigin.id, stopWork.id],
      activeBand: OTHER_BAND
    });
    const result = project({
      inspection: makeInspection({
        inspectedTimeBandId: OTHER_BAND,
        inspectedTimeBandLabel: 'Night',
        followsSimulationTimeBand: false
      }),
      lines: [line]
    });

    expect(result.status).toBe('served-by-active-line');
    expect(result.inspectedTimeBandId).toBe(OTHER_BAND);
    expect(result.inspectedTimeBandLabel).toBe('Night');
  });
});
