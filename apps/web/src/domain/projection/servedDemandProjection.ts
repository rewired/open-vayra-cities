import { SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS } from '../constants/scenarioDemand';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { Stop, StopId } from '../types/stop';
import type { Line } from '../types/line';
import type { TimeBandId } from '../types/timeBand';
import { calculateGreatCircleDistanceMeters } from '../../lib/geometry';
import { projectLineServicePlanForLine } from './lineServicePlanProjection';

/**
 * Result of the served demand projection.
 */
export interface ServedDemandProjection {
  readonly status: 'unavailable' | 'ready';
  readonly activeTimeBandId: TimeBandId;
  
  /** Total weight of residential origin nodes captured by at least one stop. */
  readonly capturedResidentialWeight: number;
  /** Total weight of workplace destination nodes captured by at least one stop. */
  readonly capturedWorkplaceWeight: number;
  
  /** Total weight of residential origin nodes served by active service. */
  readonly servedResidentialWeight: number;
  /** Total weight of residential origin nodes not served despite being captured. */
  readonly unservedResidentialWeight: number;
  /** Total weight of workplace destination nodes reachable by active service. */
  readonly reachableWorkplaceWeight: number;
  
  /** Number of lines with active service in the current time band. */
  readonly activeServiceLineCount: number;
  /** Number of lines with no service or inactive in the current time band. */
  readonly inactiveOrNoServiceLineCount: number;
  /** Number of lines blocked by configuration/readiness issues. */
  readonly blockedLineCount: number;

  /** Diagnostic reason counts. */
  readonly reasons: {
    readonly residentialCapturedButNoReachableWorkplace: number;
    readonly residentialCapturedButNoActiveService: number;
    readonly residentialNotCaptured: number;
    readonly workplaceCapturedButUnreachable: number;
  };
}

/**
 * Projects served demand for the active time band based on line connectivity.
 */
export function projectServedDemand(
  artifact: ScenarioDemandArtifact | null,
  stops: readonly Stop[],
  lines: readonly Line[],
  activeTimeBandId: TimeBandId,
  accessRadiusMeters: number = SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS
): ServedDemandProjection {
  if (!artifact) {
    return createEmptyProjection(activeTimeBandId);
  }

  // 1. Identify residential and workplace nodes
  const residentialNodes = artifact.nodes.filter(n => n.role === 'origin' && n.class === 'residential');
  const workplaceNodes = artifact.nodes.filter(n => n.role === 'destination' && n.class === 'workplace');

  // 2. Precompute demand captured per stop
  // Map<StopId, { residentialNodeIds: string[], workplaceNodeIds: string[] }>
  const capturePerStop = new Map<StopId, { residentialNodeIds: string[]; workplaceNodeIds: string[] }>();
  
  // Track which nodes are captured at all for summary metrics
  const capturedResidentialNodeIds = new Set<string>();
  const capturedWorkplaceNodeIds = new Set<string>();

  for (const stop of stops) {
    const resIds: string[] = [];
    const workIds: string[] = [];

    // Scale-safe: O(Stops * Nodes) is acceptable for thousands of nodes
    for (const node of residentialNodes) {
      const distance = calculateGreatCircleDistanceMeters(
        [node.position.lng, node.position.lat],
        [stop.position.lng, stop.position.lat]
      );
      if (distance <= accessRadiusMeters) {
        resIds.push(node.id);
        capturedResidentialNodeIds.add(node.id);
      }
    }

    for (const node of workplaceNodes) {
      const distance = calculateGreatCircleDistanceMeters(
        [node.position.lng, node.position.lat],
        [stop.position.lng, stop.position.lat]
      );
      if (distance <= accessRadiusMeters) {
        workIds.push(node.id);
        capturedWorkplaceNodeIds.add(node.id);
      }
    }

    capturePerStop.set(stop.id, { residentialNodeIds: resIds, workplaceNodeIds: workIds });
  }

  // 3. Filter active lines and evaluate connectivity
  const servedResidentialNodeIds = new Set<string>();
  const reachableWorkplaceNodeIds = new Set<string>();
  
  let activeServiceLineCount = 0;
  let inactiveOrNoServiceLineCount = 0;
  let blockedLineCount = 0;

  for (const line of lines) {
    const projection = projectLineServicePlanForLine(line, stops, activeTimeBandId);
    
    if (projection.status === 'blocked') {
      blockedLineCount++;
      continue;
    }

    if (projection.activeBandState !== 'frequency') {
      inactiveOrNoServiceLineCount++;
      continue;
    }

    activeServiceLineCount++;

    // Connectivity logic
    const { topology, servicePattern, stopIds } = line;
    const lineStopIndices = stopIds.map((id, index) => ({ id, index }));
    
    const residentialStopIndices = lineStopIndices.filter(s => (capturePerStop.get(s.id)?.residentialNodeIds.length ?? 0) > 0);
    const workplaceStopIndices = lineStopIndices.filter(s => (capturePerStop.get(s.id)?.workplaceNodeIds.length ?? 0) > 0);

    if (residentialStopIndices.length === 0 || workplaceStopIndices.length === 0) {
      continue;
    }

    if (topology === 'loop') {
      // Loop: all residential can reach all workplace if both exist on line
      residentialStopIndices.forEach(s => {
        capturePerStop.get(s.id)?.residentialNodeIds.forEach(id => servedResidentialNodeIds.add(id));
      });
      workplaceStopIndices.forEach(s => {
        capturePerStop.get(s.id)?.workplaceNodeIds.forEach(id => reachableWorkplaceNodeIds.add(id));
      });
    } else if (servicePattern === 'bidirectional') {
      // Bidirectional: all residential can reach all workplace if both exist on line and at least 2 stops
      if (stopIds.length >= 2) {
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
        const canReachAnyWorkplace = workplaceStopIndices.some(workStop => workStop.index > resStop.index);
        if (canReachAnyWorkplace) {
          capturePerStop.get(resStop.id)?.residentialNodeIds.forEach(id => servedResidentialNodeIds.add(id));
        }
      }
      for (const workStop of workplaceStopIndices) {
        const canBeReachedByAnyResidential = residentialStopIndices.some(resStop => resStop.index < workStop.index);
        if (canBeReachedByAnyResidential) {
          capturePerStop.get(workStop.id)?.workplaceNodeIds.forEach(id => reachableWorkplaceNodeIds.add(id));
        }
      }
    }
  }

  // 4. Final Aggregation
  const calculateWeight = (nodes: readonly ScenarioDemandNode[], ids: Set<string>): number =>
    nodes.filter(n => ids.has(n.id)).reduce((sum, n) => sum + n.baseWeight, 0);

  const capturedResidentialWeight = calculateWeight(residentialNodes, capturedResidentialNodeIds);
  const capturedWorkplaceWeight = calculateWeight(workplaceNodes, capturedWorkplaceNodeIds);
  const servedResidentialWeight = calculateWeight(residentialNodes, servedResidentialNodeIds);
  const reachableWorkplaceWeight = calculateWeight(workplaceNodes, reachableWorkplaceNodeIds);

  const unservedResidentialWeight = capturedResidentialWeight - servedResidentialWeight;

  // Reason counts (by node count, as requested "compact reason counts")
  const residentialCapturedButNoReachableWorkplace = Array.from(capturedResidentialNodeIds).filter(id => !servedResidentialNodeIds.has(id)).length;
  
  // Invert capturePerStop to find which stops capture which node
  const stopsPerResidentialNode = new Map<string, Set<StopId>>();
  for (const [stopId, data] of capturePerStop.entries()) {
    for (const nodeId of data.residentialNodeIds) {
      if (!stopsPerResidentialNode.has(nodeId)) {
        stopsPerResidentialNode.set(nodeId, new Set());
      }
      stopsPerResidentialNode.get(nodeId)!.add(stopId);
    }
  }

  // Identify stops on active lines
  const stopsOnActiveLines = new Set<StopId>();
  for (const line of lines) {
    const projection = projectLineServicePlanForLine(line, stops, activeTimeBandId);
    if (projection.status !== 'blocked' && projection.activeBandState === 'frequency') {
      line.stopIds.forEach(id => stopsOnActiveLines.add(id));
    }
  }
  
  const residentialCapturedButNoActiveService = Array.from(capturedResidentialNodeIds).filter(id => {
    const capturingStops = stopsPerResidentialNode.get(id);
    return !capturingStops || !Array.from(capturingStops).some(sId => stopsOnActiveLines.has(sId));
  }).length;

  const residentialNotCaptured = residentialNodes.length - capturedResidentialNodeIds.size;
  const workplaceCapturedButUnreachable = capturedWorkplaceNodeIds.size - reachableWorkplaceNodeIds.size;

  return {
    status: 'ready',
    activeTimeBandId,
    capturedResidentialWeight,
    capturedWorkplaceWeight,
    servedResidentialWeight,
    unservedResidentialWeight,
    reachableWorkplaceWeight,
    activeServiceLineCount,
    inactiveOrNoServiceLineCount,
    blockedLineCount,
    reasons: {
      residentialCapturedButNoReachableWorkplace,
      residentialCapturedButNoActiveService,
      residentialNotCaptured,
      workplaceCapturedButUnreachable
    }
  };
}

function createEmptyProjection(activeTimeBandId: TimeBandId): ServedDemandProjection {
  return {
    status: 'unavailable',
    activeTimeBandId,
    capturedResidentialWeight: 0,
    capturedWorkplaceWeight: 0,
    servedResidentialWeight: 0,
    unservedResidentialWeight: 0,
    reachableWorkplaceWeight: 0,
    activeServiceLineCount: 0,
    inactiveOrNoServiceLineCount: 0,
    blockedLineCount: 0,
    reasons: {
      residentialCapturedButNoReachableWorkplace: 0,
      residentialCapturedButNoActiveService: 0,
      residentialNotCaptured: 0,
      workplaceCapturedButUnreachable: 0
    }
  };
}
