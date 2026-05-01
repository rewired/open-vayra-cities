/** Default service interval in minutes used when activating interval mode without prior valid input. */
export const DEFAULT_LINE_SERVICE_INTERVAL_MINUTES = 10;

/** Minimal deterministic turnaround/recovery allowance in minutes per round trip. */
export const DEFAULT_TURNAROUND_RECOVERY_MINUTES = 2;

/**
 * Minimum departures per hour denominator to avoid division by zero in service pressure calculations.
 */
export const SERVICE_PRESSURE_MIN_DEPARTURES_PER_HOUR_DENOMINATOR = 1;

/**
 * Service pressure ratio threshold for 'low' pressure status.
 * Represents served active residential demand per departure per hour.
 */
export const SERVICE_PRESSURE_RATIO_LOW_THRESHOLD = 10;

/**
 * Service pressure ratio threshold for 'balanced' pressure status.
 */
export const SERVICE_PRESSURE_RATIO_BALANCED_THRESHOLD = 50;

export const SERVICE_PRESSURE_RATIO_HIGH_THRESHOLD = 100;


