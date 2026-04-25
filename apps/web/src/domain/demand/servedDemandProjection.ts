import { createDemandWeight, type DemandWeight } from '../types/demandNode';
import type { LineId } from '../types/line';
import type { LineServiceActiveBandState } from '../types/lineServicePlanProjection';
import type { StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';
import type { StopDemandCatchment } from './demandCatchment';

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
 * Enforces the MVP outbound-direction pairing rule:
 * - A completed line serves residential-to-workplace demand when at least one captured residential origin
 *   appears before at least one captured workplace destination in the ordered stop sequence.
 * - `capturedOriginWeight` is only drawn from origin stops that have a subsequent destination stop.
 * - `capturedDestinationWeight` is only drawn from destination stops that have a preceding origin stop.
 * - Return direction is explicitly not modeled in this slice.
 */
export const projectLineBandDemand = (
  lineId: LineId,
  orderedStopIds: readonly StopId[],
  timeBandId: TimeBandId,
  serviceState: LineServiceActiveBandState | 'unset',
  catchmentLookup: ReadonlyMap<StopId, StopDemandCatchment>
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

  // Calculate weights for the specific time band from stop catchments
  const stopOriginWeights = orderedStopIds.map((stopId) => {
    const catchment = catchmentLookup.get(stopId);
    return catchment?.residentialOriginWeightByTimeBand[timeBandId] ?? 0;
  });

  const stopDestinationWeights = orderedStopIds.map((stopId) => {
    const catchment = catchmentLookup.get(stopId);
    return catchment?.workplaceDestinationWeightByTimeBand[timeBandId] ?? 0;
  });

  // Determine valid pairs according to the directionality rule
  let capturedOriginRaw = 0;
  let capturedDestinationRaw = 0;

  for (let i = 0; i < orderedStopIds.length; i++) {
    // For origin: is there a destination after it?
    if (stopOriginWeights[i] > 0) {
      let hasSubsequentDestination = false;
      for (let j = i + 1; j < orderedStopIds.length; j++) {
        if (stopDestinationWeights[j] > 0) {
          hasSubsequentDestination = true;
          break;
        }
      }
      if (hasSubsequentDestination) {
        capturedOriginRaw += stopOriginWeights[i];
      }
    }

    // For destination: is there an origin before it?
    if (stopDestinationWeights[i] > 0) {
      let hasPrecedingOrigin = false;
      for (let j = 0; j < i; j++) {
        if (stopOriginWeights[j] > 0) {
          hasPrecedingOrigin = true;
          break;
        }
      }
      if (hasPrecedingOrigin) {
        capturedDestinationRaw += stopDestinationWeights[i];
      }
    }
  }

  const capturedOriginWeight = createDemandWeight(capturedOriginRaw);
  const capturedDestinationWeight = createDemandWeight(capturedDestinationRaw);
  const servedDemandWeight = createDemandWeight(Math.min(capturedOriginRaw, capturedDestinationRaw));

  let status: DemandProjectionStatus = 'served';

  const totalOriginRaw = (stopOriginWeights as readonly number[]).reduce((sum, w) => sum + w, 0);
  const totalDestRaw = (stopDestinationWeights as readonly number[]).reduce((sum, w) => sum + w, 0);

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
