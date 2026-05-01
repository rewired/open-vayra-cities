import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { TimeBandId } from '../types/timeBand';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { Stop, StopId } from '../types/stop';
import { 
  createLineId, 
  createLineFrequencyMinutes, 
  createNoServiceLineServiceByTimeBand, 
  type Line, 
  type LineTopology, 
  type LineServicePattern, 
  type LineServiceByTimeBand,
  type LineId
} from '../types/line';
import { createStopId } from '../types/stop';
import { 
  createLineSegmentId, 
  createRouteDistanceMeters, 
  createRouteTravelMinutes, 
  type LineRouteSegment 
} from '../types/lineRoute';

/**
 * Creates a complete time-band weight record for all canonical MVP bands.
 */
export const createTestTimeBandWeights = (
  defaultWeight: number,
  overrides: Partial<Record<TimeBandId, number>> = {}
): Readonly<Record<TimeBandId, number>> => {
  const weights: Record<TimeBandId, number> = {} as Record<TimeBandId, number>;
  for (const id of MVP_TIME_BAND_IDS) {
    weights[id] = overrides[id] ?? defaultWeight;
  }
  return weights as Readonly<Record<TimeBandId, number>>;
};

/**
 * Creates a valid ScenarioDemandNode fixture.
 */
export const createTestScenarioDemandNode = (params: {
  id: string;
  lng: number;
  lat: number;
  role: ScenarioDemandNode['role'];
  class: ScenarioDemandNode['class'];
  baseWeight: number;
  timeBandWeights?: Partial<Record<TimeBandId, number>>;
}): ScenarioDemandNode => {
  const node: ScenarioDemandNode = {
    id: params.id,
    position: { lng: params.lng, lat: params.lat },
    role: params.role,
    class: params.class,
    baseWeight: params.baseWeight,
    timeBandWeights: createTestTimeBandWeights(1.0, params.timeBandWeights || {})
  };
  return node;
};

/**
 * Creates a valid ScenarioDemandArtifact fixture matching the current schema.
 */
export const createTestScenarioDemandArtifact = (params: Partial<ScenarioDemandArtifact> = {}): ScenarioDemandArtifact => ({
  schemaVersion: 1,
  scenarioId: params.scenarioId || 'test-scenario',
  generatedAt: params.generatedAt || new Date().toISOString(),
  sourceMetadata: params.sourceMetadata || {
    generatedFrom: [],
    generatorName: 'test-fixtures',
    generatorVersion: '1.0.0'
  },
  nodes: params.nodes || [],
  attractors: params.attractors || [],
  gateways: params.gateways || []
});

/**
 * Creates a valid Stop fixture.
 */
export const createTestStop = (id: string, lng: number, lat: number): Stop => ({
  id: createStopId(id),
  label: `Stop ${id}`,
  position: { lng, lat }
});

/**
 * Creates a valid LineRouteSegment fixture using canonical constructors.
 */
export const createTestLineRouteSegment = (params: {
  id: string;
  lineId: LineId;
  fromStopId: StopId;
  toStopId: StopId;
  distanceMeters?: number;
  inMotionMinutes?: number;
  dwellMinutes?: number;
}): LineRouteSegment => ({
  id: createLineSegmentId(params.id),
  lineId: params.lineId,
  fromStopId: params.fromStopId,
  toStopId: params.toStopId,
  orderedGeometry: [],
  distanceMeters: createRouteDistanceMeters(params.distanceMeters ?? 1000),
  inMotionTravelMinutes: createRouteTravelMinutes(params.inMotionMinutes ?? 2),
  dwellMinutes: createRouteTravelMinutes(params.dwellMinutes ?? 0.5),
  totalTravelMinutes: createRouteTravelMinutes((params.inMotionMinutes ?? 2) + (params.dwellMinutes ?? 0.5)),
  status: 'routed'
});

/**
 * Creates a valid Line fixture with a complete service plan.
 */
export const createTestLine = (params: {
  id: string;
  stopIds: string[];
  topology?: LineTopology;
  servicePattern?: LineServicePattern;
  frequencyOverrides?: Partial<LineServiceByTimeBand>;
}): Line => {
  const lineId = createLineId(params.id);
  const stopIds = params.stopIds.map(createStopId);
  const topology = params.topology || 'linear';
  const servicePattern = params.servicePattern || 'one-way';
  
  const baseFrequency = createNoServiceLineServiceByTimeBand();
  const frequencyByTimeBand: LineServiceByTimeBand = {
    ...baseFrequency,
    ...(params.frequencyOverrides || {})
  };

  const routeSegments: LineRouteSegment[] = [];
  const segmentCount = topology === 'loop' ? stopIds.length : stopIds.length - 1;
  
  for (let i = 0; i < segmentCount; i++) {
    const fromStopId = stopIds[i]!;
    const toStopId = stopIds[(i + 1) % stopIds.length]!;
    routeSegments.push(createTestLineRouteSegment({
      id: `seg-${params.id}-${i}`,
      lineId,
      fromStopId,
      toStopId
    }));
  }

  return {
    id: lineId,
    label: `Line ${params.id}`,
    stopIds,
    topology,
    servicePattern,
    routeSegments,
    frequencyByTimeBand
  };
};
