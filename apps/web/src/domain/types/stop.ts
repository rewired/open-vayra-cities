/**
 * Branded stop identifier used to keep stop ids distinct from plain strings.
 */
export type StopId = string & { readonly __brand: 'StopId' };

/**
 * Geographic stop position in WGS84 longitude/latitude coordinates.
 */
export interface StopPosition {
  readonly lng: number;
  readonly lat: number;
}

/**
 * Minimal canonical stop model for map placement in the bus-first MVP.
 */
export interface Stop {
  readonly id: StopId;
  readonly position: StopPosition;
  readonly label?: string;
}

/**
 * Creates a branded stop identifier from a deterministic raw stop key.
 */
export const createStopId = (rawStopId: string): StopId => rawStopId as StopId;
