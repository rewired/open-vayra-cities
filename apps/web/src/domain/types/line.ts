import type { StopId } from './stop';

/**
 * Branded line identifier used to keep line ids distinct from plain strings.
 */
export type LineId = string & { readonly __brand: 'LineId' };

/**
 * Minimal canonical transit line model for ordered stop sequences in the bus-first MVP.
 */
export interface Line {
  readonly id: LineId;
  readonly label: string;
  readonly stopIds: readonly StopId[];
}

/**
 * Creates a branded line identifier from a deterministic raw line key.
 */
export const createLineId = (rawLineId: string): LineId => rawLineId as LineId;
