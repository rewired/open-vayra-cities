import type { TimeBandId } from '../types/timeBand';
import type { ServedDemandProjection } from './servedDemandProjection';
import type { LineServicePlanProjection } from '../types/lineServicePlanProjection';
import {
  SERVICE_PRESSURE_MIN_DEPARTURES_PER_HOUR_DENOMINATOR,
  SERVICE_PRESSURE_RATIO_LOW_THRESHOLD,
  SERVICE_PRESSURE_RATIO_BALANCED_THRESHOLD,
  SERVICE_PRESSURE_RATIO_HIGH_THRESHOLD,
  SERVICE_PRESSURE_RATIO_OVERLOADED_THRESHOLD
} from '../constants/lineService';

/**
 * Service pressure status classifying the ratio of served demand to offered service frequency.
 */
export type ServicePressureStatus = 'none' | 'low' | 'balanced' | 'high' | 'overloaded';

/**
 * Result of the service pressure projection.
 */
export interface ServicePressureProjection {
  /** Active time band used for this projection. */
  readonly activeTimeBandId: TimeBandId;
  /** Sum of theoretical departures per hour across all active lines. */
  readonly activeDeparturesPerHourEstimate: number;
  /** Weighted average headway in minutes across active lines, or null if no service. */
  readonly averageHeadwayMinutes: number | null;
  /** Ratio of served residential active weight to departures per hour. */
  readonly servicePressureRatio: number;
  /** Classification of the service pressure ratio based on centralized thresholds. */
  readonly servicePressureStatus: ServicePressureStatus;
  /** Total active weight of residential origin nodes served by active service (forwarded from served demand). */
  readonly servedResidentialActiveWeight: number;
}

/**
 * Projects network-level service pressure by comparing served demand against active service frequency.
 * 
 * This is a lightweight projection signal for gameplay feedback.
 */
export function projectServicePressure(
  servedDemand: ServedDemandProjection,
  lineServicePlan: LineServicePlanProjection
): ServicePressureProjection {
  const { activeTimeBandId, servedResidentialActiveWeight } = servedDemand;
  const activeDeparturesPerHourEstimate = lineServicePlan.summary.totalTheoreticalDeparturesPerHour;
  
  const averageHeadwayMinutes = activeDeparturesPerHourEstimate > 0 
    ? 60 / activeDeparturesPerHourEstimate 
    : null;

  const servicePressureRatio = servedResidentialActiveWeight / Math.max(
    activeDeparturesPerHourEstimate, 
    SERVICE_PRESSURE_MIN_DEPARTURES_PER_HOUR_DENOMINATOR
  );

  let servicePressureStatus: ServicePressureStatus = 'none';

  if (activeDeparturesPerHourEstimate > 0) {
    if (servicePressureRatio <= SERVICE_PRESSURE_RATIO_LOW_THRESHOLD) {
      servicePressureStatus = 'low';
    } else if (servicePressureRatio <= SERVICE_PRESSURE_RATIO_BALANCED_THRESHOLD) {
      servicePressureStatus = 'balanced';
    } else if (servicePressureRatio <= SERVICE_PRESSURE_RATIO_HIGH_THRESHOLD) {
      servicePressureStatus = 'high';
    } else {
      servicePressureStatus = 'overloaded';
    }
  }

  return {
    activeTimeBandId,
    activeDeparturesPerHourEstimate,
    averageHeadwayMinutes,
    servicePressureRatio,
    servicePressureStatus,
    servedResidentialActiveWeight
  };
}
