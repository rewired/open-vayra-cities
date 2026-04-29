import { SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS } from '../constants/scenarioDemand';
import type { ScenarioDemandArtifact, ScenarioDemandNode, ScenarioDemandAttractor, ScenarioDemandGateway } from '../types/scenarioDemand';
import type { Stop } from '../types/stop';
import { calculateGreatCircleDistanceMeters } from '../../lib/geometry';

/**
 * Input payload for the scenario demand capture projection.
 */
export interface ScenarioDemandCaptureProjectionInput {
  /** The optional loaded scenario demand artifact. */
  readonly artifact: ScenarioDemandArtifact | null;
  /** The currently placed player stops. */
  readonly stops: readonly Stop[];
  /** Optional access radius override in meters. Defaults to 400m. */
  readonly accessRadiusMeters?: number;
}

/**
 * Compact summary of demand entities captured by stops.
 */
export interface CapturedEntitySummary {
  /** Total number of entities in the artifact. */
  readonly totalCount: number;
  /** Number of entities within range of at least one stop. */
  readonly capturedCount: number;
  /** Number of entities outside the access radius of all stops. */
  readonly uncapturedCount: number;
  /** Total cumulative weight of all entities. */
  readonly totalWeight: number;
  /** Cumulative weight of captured entities. */
  readonly capturedWeight: number;
  /** Cumulative weight of uncaptured entities. */
  readonly uncapturedWeight: number;
  /** Percentage of entities captured by count (0-100). */
  readonly capturedPercentageByCount: number;
  /** Percentage of entities captured by weight (0-100). */
  readonly capturedPercentageByWeight: number;
}

/**
 * Reference to the nearest capturing stop for a demand entity.
 */
export interface CapturingStopReference {
  /** The unique identifier of the closest stop. */
  readonly stopId: string;
  /** The great-circle distance to the stop in meters. */
  readonly distanceMeters: number;
}

/**
 * Output result of the demand capture projection.
 */
export interface ScenarioDemandCaptureProjection {
  /** Availability status of the projection. */
  readonly status: 'unavailable' | 'ready';
  /** The effective access radius used for evaluation. */
  readonly accessRadiusMeters: number;
  /** The number of stops evaluated. */
  readonly stopCount: number;
  /** Capture breakdown for demand nodes (residential/source). */
  readonly nodeSummary: CapturedEntitySummary;
  /** Capture breakdown for workplace/destination attractors. */
  readonly attractorSummary: CapturedEntitySummary;
  /** Capture breakdown for transfer gateways. */
  readonly gatewaySummary: CapturedEntitySummary;
  /** Capture breakdown for residential origin nodes. */
  readonly residentialSummary: CapturedEntitySummary;
  /** Capture breakdown for workplace destination nodes. */
  readonly workplaceSummary: CapturedEntitySummary;
  /** Map of entity ID to its single closest capturing stop. */
  readonly nearestStopByEntityId: ReadonlyMap<string, CapturingStopReference>;
}

/**
 * Projects demand capture state by evaluating stop-radius containment for scenario entities.
 * 
 * Computes pure geospatial reachability without routing assignments or capacity constraints.
 * Deduplicates entities so each counts at most once.
 */
export function projectScenarioDemandCapture(
  input: ScenarioDemandCaptureProjectionInput
): ScenarioDemandCaptureProjection {
  const { artifact, stops, accessRadiusMeters = SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS } = input;

  if (accessRadiusMeters <= 0) {
    throw new Error('Access radius must be a positive number.');
  }

  if (!artifact) {
    return {
      status: 'unavailable',
      accessRadiusMeters,
      stopCount: stops.length,
      nodeSummary: createEmptySummary(),
      attractorSummary: createEmptySummary(),
      gatewaySummary: createEmptySummary(),
      residentialSummary: createEmptySummary(),
      workplaceSummary: createEmptySummary(),
      nearestStopByEntityId: new Map()
    };
  }

  const nearestStopByEntityId = new Map<string, CapturingStopReference>();

  const processEntities = <T extends { id: string; position: { lng: number; lat: number } }>(
    entities: readonly T[],
    getWeight: (entity: T) => number
  ): CapturedEntitySummary => {
    let totalCount = 0;
    let capturedCount = 0;
    let totalWeight = 0;
    let capturedWeight = 0;

    for (const entity of entities) {
      totalCount++;
      const weight = getWeight(entity);
      totalWeight += weight;

      let nearestStop: CapturingStopReference | null = null;

      for (const stop of stops) {
        const distance = calculateGreatCircleDistanceMeters(
          [entity.position.lng, entity.position.lat],
          [stop.position.lng, stop.position.lat]
        );

        if (distance <= accessRadiusMeters) {
          if (!nearestStop || distance < nearestStop.distanceMeters) {
            nearestStop = { stopId: stop.id, distanceMeters: distance };
          }
        }
      }

      if (nearestStop) {
        capturedCount++;
        capturedWeight += weight;
        nearestStopByEntityId.set(entity.id, nearestStop);
      }
    }

    const uncapturedCount = totalCount - capturedCount;
    const uncapturedWeight = totalWeight - capturedWeight;

    return {
      totalCount,
      capturedCount,
      uncapturedCount,
      totalWeight,
      capturedWeight,
      uncapturedWeight,
      capturedPercentageByCount: totalCount > 0 ? (capturedCount / totalCount) * 100 : 0,
      capturedPercentageByWeight: totalWeight > 0 ? (capturedWeight / totalWeight) * 100 : 0
    };
  };

  const nodeSummary = processEntities(artifact.nodes, (n: ScenarioDemandNode) => n.baseWeight);
  const attractorSummary = processEntities(artifact.attractors, (a: ScenarioDemandAttractor) => a.sinkWeight);
  const gatewaySummary = processEntities(artifact.gateways, (g: ScenarioDemandGateway) => g.transferWeight);

  const residentialNodes = artifact.nodes.filter(n => n.role === 'origin' && n.class === 'residential');
  const workplaceNodes = artifact.nodes.filter(n => n.role === 'destination' && n.class === 'workplace');

  const residentialSummary = processEntities(residentialNodes, (n: ScenarioDemandNode) => n.baseWeight);
  const workplaceSummary = processEntities(workplaceNodes, (n: ScenarioDemandNode) => n.baseWeight);

  return {
    status: 'ready',
    accessRadiusMeters,
    stopCount: stops.length,
    nodeSummary,
    attractorSummary,
    gatewaySummary,
    residentialSummary,
    workplaceSummary,
    nearestStopByEntityId
  };
}

function createEmptySummary(): CapturedEntitySummary {
  return {
    totalCount: 0,
    capturedCount: 0,
    uncapturedCount: 0,
    totalWeight: 0,
    capturedWeight: 0,
    uncapturedWeight: 0,
    capturedPercentageByCount: 0,
    capturedPercentageByWeight: 0
  };
}
