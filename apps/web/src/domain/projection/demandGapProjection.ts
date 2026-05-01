import {
  DEMAND_GAP_RANKING_MAX_ITEMS_PER_CATEGORY,
  DEMAND_GAP_RANKING_MIN_ACTIVE_WEIGHT,
  SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS
} from '../constants/scenarioDemand';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { Stop, StopId } from '../types/stop';
import type { Line } from '../types/line';
import type { TimeBandId } from '../types/timeBand';
import { calculateGreatCircleDistanceMeters } from '../../lib/geometry';
import { projectLineServicePlanForLine } from './lineServicePlanProjection';
import { calculateActiveDemandWeight } from './demandWeight';

/**
 * Kind of demand gap identified in the projection.
 */
export type DemandGapKind =
  | 'uncaptured-residential'
  | 'captured-unserved-residential'
  | 'captured-unreachable-workplace';

/**
 * A single ranked demand gap item for display.
 */
export interface DemandGapRankingItem {
  readonly id: string;
  readonly kind: DemandGapKind;
  readonly position: { readonly lng: number; readonly lat: number };
  readonly activeWeight: number;
  readonly baseWeight: number;
  readonly nearestStopDistanceMeters: number | null;
  readonly capturingStopCount: number;
  readonly note: string;
}

/**
 * Result of the demand gap ranking projection.
 */
export interface DemandGapRankingProjection {
  readonly status: 'unavailable' | 'ready';
  readonly activeTimeBandId: TimeBandId;
  readonly uncapturedResidentialGaps: readonly DemandGapRankingItem[];
  readonly capturedButUnservedResidentialGaps: readonly DemandGapRankingItem[];
  readonly capturedButUnreachableWorkplaceGaps: readonly DemandGapRankingItem[];
  readonly summary: {
    readonly totalGapCount: number;
  };
}

/**
 * Projects a ranked list of demand gaps for the active time band.
 * 
 * Classifies nodes as uncaptured, captured-but-unserved, or captured-but-unreachable
 * based on stop proximity and line connectivity.
 */
export function projectDemandGapRanking(
  artifact: ScenarioDemandArtifact | null,
  stops: readonly Stop[],
  lines: readonly Line[],
  activeTimeBandId: TimeBandId,
  accessRadiusMeters: number = SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS
): DemandGapRankingProjection {
  if (!artifact) {
    return createEmptyProjection(activeTimeBandId);
  }

  // 1. Filter nodes by active weight and class
  const residentialNodes = artifact.nodes.filter(
    (n) => n.role === 'origin' && n.class === 'residential' && calculateActiveDemandWeight(n, activeTimeBandId) >= DEMAND_GAP_RANKING_MIN_ACTIVE_WEIGHT
  );
  const workplaceNodes = artifact.nodes.filter(
    (n) => n.role === 'destination' && n.class === 'workplace' && calculateActiveDemandWeight(n, activeTimeBandId) >= DEMAND_GAP_RANKING_MIN_ACTIVE_WEIGHT
  );

  // 2. Identify capture per stop and nearest stop per node
  const capturePerStop = new Map<StopId, { residentialNodeIds: string[]; workplaceNodeIds: string[] }>();
  const nearestStopPerNode = new Map<string, { stopId: StopId; distance: number }>();
  const capturingStopsPerNode = new Map<string, Set<StopId>>();

  for (const stop of stops) {
    const resIds: string[] = [];
    const workIds: string[] = [];

    for (const node of [...residentialNodes, ...workplaceNodes]) {
      const distance = calculateGreatCircleDistanceMeters(
        [node.position.lng, node.position.lat],
        [stop.position.lng, stop.position.lat]
      );

      if (distance <= accessRadiusMeters) {
        if (node.class === 'residential') resIds.push(node.id);
        if (node.class === 'workplace') workIds.push(node.id);

        if (!capturingStopsPerNode.has(node.id)) {
          capturingStopsPerNode.set(node.id, new Set());
        }
        capturingStopsPerNode.get(node.id)!.add(stop.id);

        const currentNearest = nearestStopPerNode.get(node.id);
        if (!currentNearest || distance < currentNearest.distance) {
          nearestStopPerNode.set(node.id, { stopId: stop.id, distance });
        }
      }
    }
    capturePerStop.set(stop.id, { residentialNodeIds: resIds, workplaceNodeIds: workIds });
  }

  // 3. Evaluate connectivity for served/reachable status
  const servedResidentialNodeIds = new Set<string>();
  const reachableWorkplaceNodeIds = new Set<string>();

  for (const line of lines) {
    const projection = projectLineServicePlanForLine(line, stops, activeTimeBandId);
    if (projection.status === 'blocked' || projection.activeBandState !== 'frequency') {
      continue;
    }

    const { topology, servicePattern, stopIds } = line;
    const lineStopIndices = stopIds.map((id, index) => ({ id, index }));
    
    const residentialStopIndices = lineStopIndices.filter(s => (capturePerStop.get(s.id)?.residentialNodeIds.length ?? 0) > 0);
    const workplaceStopIndices = lineStopIndices.filter(s => (capturePerStop.get(s.id)?.workplaceNodeIds.length ?? 0) > 0);

    if (residentialStopIndices.length === 0 || workplaceStopIndices.length === 0) {
      continue;
    }

    if (topology === 'loop' || servicePattern === 'bidirectional') {
      // Loop or Bidirectional: all residential can reach all workplace if both exist on line
      if (topology === 'loop' || stopIds.length >= 2) {
        residentialStopIndices.forEach(s => {
          capturePerStop.get(s.id)?.residentialNodeIds.forEach(id => servedResidentialNodeIds.add(id));
        });
        workplaceStopIndices.forEach(s => {
          capturePerStop.get(s.id)?.workplaceNodeIds.forEach(id => reachableWorkplaceNodeIds.add(id));
        });
      }
    } else {
      // Linear One-way: Si can reach Sj if i < j
      for (const resStop of residentialStopIndices) {
        if (workplaceStopIndices.some(workStop => workStop.index > resStop.index)) {
          capturePerStop.get(resStop.id)?.residentialNodeIds.forEach(id => servedResidentialNodeIds.add(id));
        }
      }
      for (const workStop of workplaceStopIndices) {
        if (residentialStopIndices.some(resStop => resStop.index < workStop.index)) {
          capturePerStop.get(workStop.id)?.workplaceNodeIds.forEach(id => reachableWorkplaceNodeIds.add(id));
        }
      }
    }
  }

  // 4. Classify and Rank Gaps
  const uncapturedResidentialGaps: DemandGapRankingItem[] = [];
  const capturedButUnservedResidentialGaps: DemandGapRankingItem[] = [];
  const capturedButUnreachableWorkplaceGaps: DemandGapRankingItem[] = [];

  for (const node of residentialNodes) {
    const activeWeight = calculateActiveDemandWeight(node, activeTimeBandId);
    const nearest = nearestStopPerNode.get(node.id);
    
    if (!nearest) {
      uncapturedResidentialGaps.push({
        id: node.id,
        kind: 'uncaptured-residential',
        position: node.position,
        activeWeight,
        baseWeight: node.baseWeight,
        nearestStopDistanceMeters: null,
        capturingStopCount: 0,
        note: 'Not within range of any stop'
      });
    } else if (!servedResidentialNodeIds.has(node.id)) {
      capturedButUnservedResidentialGaps.push({
        id: node.id,
        kind: 'captured-unserved-residential',
        position: node.position,
        activeWeight,
        baseWeight: node.baseWeight,
        nearestStopDistanceMeters: nearest.distance,
        capturingStopCount: capturingStopsPerNode.get(node.id)?.size ?? 0,
        note: 'Captured but cannot reach any workplace'
      });
    }
  }

  for (const node of workplaceNodes) {
    const activeWeight = calculateActiveDemandWeight(node, activeTimeBandId);
    const nearest = nearestStopPerNode.get(node.id);
    
    if (nearest && !reachableWorkplaceNodeIds.has(node.id)) {
      capturedButUnreachableWorkplaceGaps.push({
        id: node.id,
        kind: 'captured-unreachable-workplace',
        position: node.position,
        activeWeight,
        baseWeight: node.baseWeight,
        nearestStopDistanceMeters: nearest.distance,
        capturingStopCount: capturingStopsPerNode.get(node.id)?.size ?? 0,
        note: 'Captured but unreachable from any home'
      });
    }
  }

  const sortGaps = (gaps: DemandGapRankingItem[]) => 
    gaps.sort((a, b) => {
      // 1. Descending active weight
      if (b.activeWeight !== a.activeWeight) return b.activeWeight - a.activeWeight;
      // 2. Ascending nearest stop distance
      const distA = a.nearestStopDistanceMeters ?? Infinity;
      const distB = b.nearestStopDistanceMeters ?? Infinity;
      if (distA !== distB) return distA - distB;
      // 3. Stable ID
      return a.id.localeCompare(b.id);
    });

  const cappedUncaptured = sortGaps(uncapturedResidentialGaps).slice(0, DEMAND_GAP_RANKING_MAX_ITEMS_PER_CATEGORY);
  const cappedUnserved = sortGaps(capturedButUnservedResidentialGaps).slice(0, DEMAND_GAP_RANKING_MAX_ITEMS_PER_CATEGORY);
  const cappedUnreachable = sortGaps(capturedButUnreachableWorkplaceGaps).slice(0, DEMAND_GAP_RANKING_MAX_ITEMS_PER_CATEGORY);

  return {
    status: 'ready',
    activeTimeBandId,
    uncapturedResidentialGaps: cappedUncaptured,
    capturedButUnservedResidentialGaps: cappedUnserved,
    capturedButUnreachableWorkplaceGaps: cappedUnreachable,
    summary: {
      totalGapCount: uncapturedResidentialGaps.length + capturedButUnservedResidentialGaps.length + capturedButUnreachableWorkplaceGaps.length
    }
  };
}

function createEmptyProjection(activeTimeBandId: TimeBandId): DemandGapRankingProjection {
  return {
    status: 'unavailable',
    activeTimeBandId,
    uncapturedResidentialGaps: [],
    capturedButUnservedResidentialGaps: [],
    capturedButUnreachableWorkplaceGaps: [],
    summary: {
      totalGapCount: 0
    }
  };
}
