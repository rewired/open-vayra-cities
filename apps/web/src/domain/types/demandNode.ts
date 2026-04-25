import type { StopPosition } from './stop';
import type { TimeBandId } from './timeBand';

/**
 * Identifies the functional role of a demand node in the network simulation.
 */
export type DemandNodeRole = 'origin' | 'destination';

/**
 * Identifies the specific MVP classification of a spatial demand source.
 */
export type DemandClass = 'residential' | 'workplace';

/**
 * Branded identifier for a deterministic spatial demand node.
 */
export type DemandNodeId = string & { readonly __brand: 'DemandNodeId' };

/**
 * Creates a branded demand node identifier.
 */
export const createDemandNodeId = (id: string): DemandNodeId => id as DemandNodeId;

/**
 * Branded demand weight representing relative strength of a demand node.
 */
export type DemandWeight = number & { readonly __brand: 'DemandWeight' };

/**
 * Creates a branded, non-negative finite demand weight.
 */
export const createDemandWeight = (weight: number): DemandWeight => {
  if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0) {
    throw new Error('Demand weight must be a non-negative finite number.');
  }
  return weight as DemandWeight;
};

/**
 * Canonical MVP spatial demand node representing either a residential origin or a workplace destination.
 */
export interface DemandNode {
  readonly id: DemandNodeId;
  readonly label: string;
  readonly position: StopPosition;
  readonly role: DemandNodeRole;
  readonly demandClass: DemandClass;
  readonly weightByTimeBand: Readonly<Record<TimeBandId, DemandWeight>>;
}
