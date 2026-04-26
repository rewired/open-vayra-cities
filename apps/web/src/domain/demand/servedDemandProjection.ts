import type { StopDemandCatchment } from './demandCatchment';
import { type DemandNode, type DemandNodeId, type DemandWeight, createDemandWeight } from '../types/demandNode';
import type { LineId, LineServicePattern, LineTopology } from '../types/line';
import type { LineServiceActiveBandState } from '../types/lineServicePlanProjection';
import type { StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';

export type DemandProjectionStatus =
  | 'served'
  | 'no-service'
  | 'unconfigured'
  | 'no-demand'
  | 'incomplete-pairing';

export interface DemandProjectionWarning {
  readonly type: 'missing-origin' | 'missing-destination' | 'wrong-direction' | 'no-service-configured';
  readonly message: string;
}

export interface LineBandDemandProjection {
  readonly lineId: LineId;
  readonly timeBandId: TimeBandId;
  readonly serviceState: LineServiceActiveBandState | 'unset';
  readonly capturedOriginWeight: DemandWeight;
  readonly capturedDestinationWeight: DemandWeight;
  readonly servedDemandWeight: DemandWeight;
  readonly status: DemandProjectionStatus;
  readonly warnings: readonly DemandProjectionWarning[];
}

/**
 * Projects the served demand for a single line in a specific time band.
 * Evaluates line topology (linear/loop) and service pattern (one-way/bidirectional)
 * to determine connectivity between captured residential origins and workplace destinations.
 *
 * Deduplicates demand nodes by identity so that a node captured by multiple stops on the same
 * line is counted exactly once in the line's served demand aggregate.
 */
export const projectLineBandDemand = (
  lineId: LineId,
  orderedStopIds: readonly StopId[],
  topology: LineTopology,
  servicePattern: LineServicePattern,
  timeBandId: TimeBandId,
  serviceState: LineServiceActiveBandState | 'unset',
  catchmentLookup: ReadonlyMap<StopId, StopDemandCatchment>,
  residentialNodeMap: ReadonlyMap<DemandNodeId, DemandNode>,
  workplaceNodeMap: ReadonlyMap<DemandNodeId, DemandNode>
): LineBandDemandProjection => {
  const warnings: DemandProjectionWarning[] = [];
  const ZERO_WEIGHT = createDemandWeight(0);

  if (serviceState === 'unset') {
    return {
      lineId,
      timeBandId,
      serviceState,
      capturedOriginWeight: ZERO_WEIGHT,
      capturedDestinationWeight: ZERO_WEIGHT,
      servedDemandWeight: ZERO_WEIGHT,
      status: 'unconfigured',
      warnings: [{ type: 'no-service-configured', message: 'Line service is unconfigured.' }]
    };
  }

  if (serviceState === 'no-service') {
    return {
      lineId,
      timeBandId,
      serviceState,
      capturedOriginWeight: ZERO_WEIGHT,
      capturedDestinationWeight: ZERO_WEIGHT,
      servedDemandWeight: ZERO_WEIGHT,
      status: 'no-service',
      warnings: []
    };
  }

  // 1. Identify all nodes captured by this line
  const stopCaptures = orderedStopIds.map(stopId => {
    const catchment = catchmentLookup.get(stopId);
    if (!catchment) return { residentialIds: [], workplaceIds: [] };
    
    return {
      residentialIds: catchment.capturedDemandNodeIds.filter(id => residentialNodeMap.has(id)),
      workplaceIds: catchment.capturedDemandNodeIds.filter(id => workplaceNodeMap.has(id))
    };
  });

  const stopHasWorkplace = stopCaptures.map(c => c.workplaceIds.length > 0);
  const anyWorkplaceOnLine = stopHasWorkplace.some(has => has);
  const anyResidentialOnLine = stopCaptures.some(c => c.residentialIds.length > 0);

  const isLoop = topology === 'loop';
  const isBidirectional = servicePattern === 'bidirectional';

  // 2. Determine which residential nodes are "served" (can reach at least one workplace)
  const servedResidentialNodeIds = new Set<DemandNodeId>();
  const pairedWorkplaceNodeIds = new Set<DemandNodeId>();

  for (let i = 0; i < orderedStopIds.length; i++) {
    const { residentialIds, workplaceIds } = stopCaptures[i]!;

    // Check connectivity for residential nodes at this stop
    if (residentialIds.length > 0) {
      let canReachWorkplace = false;
      if (isLoop || isBidirectional) {
        canReachWorkplace = anyWorkplaceOnLine;
      } else {
        // One-way linear: must appear before
        for (let j = i + 1; j < orderedStopIds.length; j++) {
          if (stopHasWorkplace[j]) {
            canReachWorkplace = true;
            break;
          }
        }
      }

      if (canReachWorkplace) {
        for (const id of residentialIds) {
          servedResidentialNodeIds.add(id);
        }
      }
    }

    // Check connectivity for workplace nodes at this stop
    if (workplaceIds.length > 0) {
      let canBeReachedByOrigin = false;
      if (isLoop || isBidirectional) {
        canBeReachedByOrigin = anyResidentialOnLine;
      } else {
        // One-way linear: must have origin before
        for (let j = 0; j < i; j++) {
          if (stopCaptures[j]!.residentialIds.length > 0) {
            canBeReachedByOrigin = true;
            break;
          }
        }
      }

      if (canBeReachedByOrigin) {
        for (const id of workplaceIds) {
          pairedWorkplaceNodeIds.add(id);
        }
      }
    }
  }

  // 3. Aggregate weights without double counting
  const capturedOriginRaw = Array.from(servedResidentialNodeIds).reduce((sum, id) => {
    const node = residentialNodeMap.get(id);
    return sum + ((node?.weightByTimeBand as any)?.[timeBandId] ?? 0);
  }, 0);

  const capturedDestinationRaw = Array.from(pairedWorkplaceNodeIds).reduce((sum, id) => {
    const node = workplaceNodeMap.get(id);
    return sum + ((node?.weightByTimeBand as any)?.[timeBandId] ?? 0);
  }, 0);

  const capturedOriginWeight = createDemandWeight(capturedOriginRaw);
  const capturedDestinationWeight = createDemandWeight(capturedDestinationRaw);
  const servedDemandWeight = createDemandWeight(Math.min(capturedOriginRaw, capturedDestinationRaw));

  // 4. Determine status and warnings
  let status: DemandProjectionStatus = 'served';

  const totalOriginIds = new Set<DemandNodeId>();
  const totalDestIds = new Set<DemandNodeId>();
  for (const { residentialIds, workplaceIds } of stopCaptures) {
    residentialIds.forEach(id => totalOriginIds.add(id));
    workplaceIds.forEach(id => totalDestIds.add(id));
  }

  const totalOriginRaw = Array.from(totalOriginIds).reduce((sum, id) => {
    const node = residentialNodeMap.get(id);
    return sum + ((node?.weightByTimeBand as any)?.[timeBandId] ?? 0);
  }, 0);

  const totalDestRaw = Array.from(totalDestIds).reduce((sum, id) => {
    const node = workplaceNodeMap.get(id);
    return sum + ((node?.weightByTimeBand as any)?.[timeBandId] ?? 0);
  }, 0);

  if (totalOriginRaw === 0 && totalDestRaw === 0) {
    status = 'no-demand';
    warnings.push({ type: 'missing-origin', message: 'No residential origins captured.' });
    warnings.push({ type: 'missing-destination', message: 'No workplace destinations captured.' });
  } else if (capturedOriginRaw === 0 && capturedDestinationRaw === 0) {
    if (totalOriginRaw > 0 && totalDestRaw > 0) {
      status = 'no-demand';
      warnings.push({ type: 'wrong-direction', message: 'Demand exists but origin appears after destination.' });
    } else {
      status = 'incomplete-pairing';
      if (totalOriginRaw === 0) warnings.push({ type: 'missing-origin', message: 'No residential origins captured.' });
      if (totalDestRaw === 0) warnings.push({ type: 'missing-destination', message: 'No workplace destinations captured.' });
    }
  } else if (servedDemandWeight === 0) {
    status = 'incomplete-pairing';
    if (capturedOriginRaw === 0) warnings.push({ type: 'missing-origin', message: 'No residential origins paired with destinations.' });
    if (capturedDestinationRaw === 0) warnings.push({ type: 'missing-destination', message: 'No workplace destinations paired with origins.' });
  }

  return {
    lineId,
    timeBandId,
    serviceState,
    capturedOriginWeight,
    capturedDestinationWeight,
    servedDemandWeight,
    status,
    warnings
  };
};
