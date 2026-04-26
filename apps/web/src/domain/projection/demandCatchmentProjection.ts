import type { DemandNode, DemandWeight } from '../types/demandNode';
import { createDemandWeight } from '../types/demandNode';
import type { TimeBandId } from '../types/timeBand';
import type { Stop, StopId } from '../types/stop';
import { calculateStopCatchments, type StopDemandCatchment } from '../demand/demandCatchment';
import type { Line } from '../types/line';
import type { LineServicePlanProjection } from '../types/lineServicePlanProjection';

/**
 * Network-wide demand capture and served-demand summary.
 */
export interface NetworkDemandProjection {
  readonly residential: {
    readonly totalWeight: DemandWeight;
    readonly capturedWeight: DemandWeight;
    readonly capturedNodeCount: number;
    readonly totalNodeCount: number;
  };
  readonly workplace: {
    readonly totalWeight: DemandWeight;
    readonly capturedWeight: DemandWeight;
    readonly capturedNodeCount: number;
    readonly totalNodeCount: number;
  };
  /** Total residential demand weight actively served by the network in the current time band. */
  readonly activelyServedResidentialWeight: DemandWeight;
}

/**
 * Projects network-wide demand metrics.
 * Deterministically calculates how much demand is captured by stops and how much is served by active lines.
 */
export const projectNetworkDemand = (
  nodes: readonly DemandNode[],
  stops: readonly Stop[],
  completedLines: readonly Line[],
  servicePlanProjection: LineServicePlanProjection,
  activeTimeBandId: TimeBandId
): NetworkDemandProjection => {
  const residentialNodes = nodes.filter(n => n.demandClass === 'residential' && n.role === 'origin');
  const workplaceNodes = nodes.filter(n => n.demandClass === 'workplace' && n.role === 'destination');

  const catchments = calculateStopCatchments(stops, nodes);
  const catchmentLookup = new Map<StopId, StopDemandCatchment>(catchments.map(c => [c.stopId, c]));

  // Calculate capture
  const capturedNodeIds = new Set<string>();
  for (const c of catchments) {
    for (const id of c.capturedDemandNodeIds) {
      capturedNodeIds.add(id);
    }
  }

  const capturedResidentialNodes = residentialNodes.filter(n => capturedNodeIds.has(n.id));
  const capturedWorkplaceNodes = workplaceNodes.filter(n => capturedNodeIds.has(n.id));

  const totalResidentialWeight = residentialNodes.reduce((sum, n) => sum + (n.weightByTimeBand[activeTimeBandId] || 0), 0);
  const capturedResidentialWeight = capturedResidentialNodes.reduce((sum, n) => sum + (n.weightByTimeBand[activeTimeBandId] || 0), 0);

  const totalWorkplaceWeight = workplaceNodes.reduce((sum, n) => sum + (n.weightByTimeBand[activeTimeBandId] || 0), 0);
  const capturedWorkplaceWeight = capturedWorkplaceNodes.reduce((sum, n) => sum + (n.weightByTimeBand[activeTimeBandId] || 0), 0);

  const residentialNodeMap = new Map(residentialNodes.map(n => [n.id, n]));
  const workplaceNodeMap = new Map(workplaceNodes.map(n => [n.id, n]));

  // Calculate served demand (avoiding double counting residential nodes)
  // A residential node is served if at least one active line connects it to a workplace.
  const servedResidentialNodeIds = new Set<string>();

  for (const line of completedLines) {
    const lineService = servicePlanProjection.lines.find(l => l.lineId === line.id);
    const isActive = lineService?.activeBandState === 'frequency';
    
    if (!isActive) continue;

    const stopIds = line.stopIds;
    const isLoop = line.topology === 'loop';
    const isBidirectional = line.servicePattern === 'bidirectional';

    // For each stop, check if it captures any workplace nodes
    const stopHasWorkplace = stopIds.map(stopId => {
      const c = catchmentLookup.get(stopId);
      if (!c) return false;
      return c.capturedDemandNodeIds.some(nodeId => workplaceNodeMap.has(nodeId));
    });

    const anyWorkplaceOnLine = stopHasWorkplace.some(has => has);
    if (!anyWorkplaceOnLine) continue;

    for (let i = 0; i < stopIds.length; i++) {
      const stopId = stopIds[i]!;
      const c = catchmentLookup.get(stopId);
      if (!c) continue;

      // Check if this stop captures any residential nodes
      const residentialNodeIdsAtStop = c.capturedDemandNodeIds.filter(nodeId => residentialNodeMap.has(nodeId));

      if (residentialNodeIdsAtStop.length === 0) continue;

      // Is there a workplace stop that can be reached from this one?
      let canReachWorkplace = false;
      
      if (isLoop || isBidirectional) {
        // In a loop or bidirectional line, any residential stop can reach any workplace stop
        canReachWorkplace = true; // anyWorkplaceOnLine is already true
      } else {
        // For one-way linear, must appear before
        for (let j = i + 1; j < stopIds.length; j++) {
          if (stopHasWorkplace[j]) {
            canReachWorkplace = true;
            break;
          }
        }
      }

      if (canReachWorkplace) {
        for (const nodeId of residentialNodeIdsAtStop) {
          servedResidentialNodeIds.add(nodeId);
        }
      }
    }
  }

  const activelyServedResidentialWeight = Array.from(servedResidentialNodeIds).reduce((sum, nodeId) => {
    const node = residentialNodeMap.get(nodeId as any);
    return sum + (node?.weightByTimeBand[activeTimeBandId] || 0);
  }, 0);

  return {
    residential: {
      totalWeight: createDemandWeight(totalResidentialWeight),
      capturedWeight: createDemandWeight(capturedResidentialWeight),
      capturedNodeCount: capturedResidentialNodes.length,
      totalNodeCount: residentialNodes.length
    },
    workplace: {
      totalWeight: createDemandWeight(totalWorkplaceWeight),
      capturedWeight: createDemandWeight(capturedWorkplaceWeight),
      capturedNodeCount: capturedWorkplaceNodes.length,
      totalNodeCount: workplaceNodes.length
    },
    activelyServedResidentialWeight: createDemandWeight(activelyServedResidentialWeight)
  };
};
