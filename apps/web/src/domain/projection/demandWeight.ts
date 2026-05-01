import type { ScenarioDemandNode, ScenarioDemandAttractor, ScenarioDemandGateway } from '../types/scenarioDemand';
import type { TimeBandId } from '../types/timeBand';

/**
 * Calculates the active demand weight for a demand node in a specific time band.
 * activeWeight = baseWeight * timeBandWeight[activeTimeBandId]
 */
export function calculateActiveDemandWeight(
  node: ScenarioDemandNode,
  timeBandId: TimeBandId
): number {
  const bandWeight = node.timeBandWeights[timeBandId];

  if (bandWeight === undefined || !Number.isFinite(bandWeight) || bandWeight < 0) {
    return 0;
  }

  const activeWeight = node.baseWeight * bandWeight;

  return Number.isFinite(activeWeight) && activeWeight > 0 ? activeWeight : 0;
}

/**
 * Calculates the active sink weight for an attractor in a specific time band.
 * activeSinkWeight = sinkWeight * (timeBandWeight[activeTimeBandId] ?? 1.0)
 */
export function calculateActiveAttractorSinkWeight(
  attractor: ScenarioDemandAttractor,
  timeBandId: TimeBandId
): number {
  const bandWeight = attractor.timeBandWeights?.[timeBandId] ?? 1.0;

  if (!Number.isFinite(bandWeight) || bandWeight < 0) {
    return 0;
  }

  const activeWeight = attractor.sinkWeight * bandWeight;

  return Number.isFinite(activeWeight) && activeWeight > 0 ? activeWeight : 0;
}

/**
 * Calculates the active transfer weight for a gateway in a specific time band.
 * activeTransferWeight = transferWeight * timeBandWeight[activeTimeBandId]
 */
export function calculateActiveGatewayTransferWeight(
  gateway: ScenarioDemandGateway,
  timeBandId: TimeBandId
): number {
  const bandWeight = gateway.timeBandWeights[timeBandId];

  if (bandWeight === undefined || !Number.isFinite(bandWeight) || bandWeight < 0) {
    return 0;
  }

  const activeWeight = gateway.transferWeight * bandWeight;

  return Number.isFinite(activeWeight) && activeWeight > 0 ? activeWeight : 0;
}
