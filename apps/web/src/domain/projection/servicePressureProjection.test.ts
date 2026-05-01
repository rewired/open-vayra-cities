import { describe, it, expect } from 'vitest';
import { projectServicePressure } from './servicePressureProjection';
import type { ServedDemandProjection } from './servedDemandProjection';
import type { LineServicePlanProjection } from '../types/lineServicePlanProjection';

describe('servicePressureProjection', () => {
  const activeTimeBandId = 'morning-rush' as any;

  const createMockServedDemand = (servedWeight: number, capturedWeight: number = servedWeight): ServedDemandProjection => ({
    status: 'ready',
    activeTimeBandId,
    capturedResidentialActiveWeight: capturedWeight,
    capturedWorkplaceActiveWeight: 0,
    servedResidentialActiveWeight: servedWeight,
    unservedResidentialActiveWeight: capturedWeight - servedWeight,
    reachableWorkplaceActiveWeight: 0,
    activeServiceLineCount: servedWeight > 0 ? 1 : 0,
    inactiveOrNoServiceLineCount: 0,
    blockedLineCount: 0,
    reasons: {
      residentialCapturedButNoReachableWorkplace: 0,
      residentialCapturedButNoActiveService: 0,
      residentialNotCaptured: 0,
      workplaceCapturedButUnreachable: 0
    }
  });

  const createMockServicePlan = (totalDepartures: number): LineServicePlanProjection => ({
    lines: [],
    summary: {
      activeTimeBandId,
      totalCompletedLineCount: 0,
      totalLineCount: 0,
      blockedLineCount: 0,
      configuredLineCount: 0,
      degradedLineCount: 0,
      availableLineCount: 0,
      unavailableLineCount: 0,
      totalRouteSegmentCount: 0,
      totalRouteTravelMinutes: 0,
      totalTheoreticalDeparturesPerHour: totalDepartures
    }
  });

  it('projects none status when there are zero departures', () => {
    const servedDemand = createMockServedDemand(100);
    const servicePlan = createMockServicePlan(0);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.servicePressureStatus).toBe('none');
    expect(result.activeDeparturesPerHourEstimate).toBe(0);
    expect(result.averageHeadwayMinutes).toBeNull();
  });

  it('projects low status when ratio is below threshold (e.g., 100 demand / 20 departures = 5)', () => {
    const servedDemand = createMockServedDemand(100);
    const servicePlan = createMockServicePlan(20);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.servicePressureRatio).toBe(5);
    expect(result.servicePressureStatus).toBe('low');
    expect(result.averageHeadwayMinutes).toBe(3);
  });

  it('projects balanced status when ratio is between low and balanced thresholds (e.g., 300 demand / 10 departures = 30)', () => {
    const servedDemand = createMockServedDemand(300);
    const servicePlan = createMockServicePlan(10);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.servicePressureRatio).toBe(30);
    expect(result.servicePressureStatus).toBe('balanced');
  });

  it('projects high status when ratio is between balanced and high thresholds (e.g., 800 demand / 10 departures = 80)', () => {
    const servedDemand = createMockServedDemand(800);
    const servicePlan = createMockServicePlan(10);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.servicePressureRatio).toBe(80);
    expect(result.servicePressureStatus).toBe('high');
  });

  it('projects overloaded status when ratio is above high threshold (e.g., 3000 demand / 10 departures = 300)', () => {
    const servedDemand = createMockServedDemand(3000);
    const servicePlan = createMockServicePlan(10);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.servicePressureRatio).toBe(300);
    expect(result.servicePressureStatus).toBe('overloaded');
  });

  it('additive departures per hour from multiple lines (mocked in summary)', () => {
    const servedDemand = createMockServedDemand(600);
    // Two lines with 10 min headway -> 6 + 6 = 12 departures/hour
    const servicePlan = createMockServicePlan(12);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.activeDeparturesPerHourEstimate).toBe(12);
    expect(result.servicePressureRatio).toBe(50); // 600 / 12 = 50
    expect(result.servicePressureStatus).toBe('balanced');
  });

  it('uses minimal denominator for zero departures with demand to avoid infinity (though status becomes none)', () => {
    const servedDemand = createMockServedDemand(100);
    const servicePlan = createMockServicePlan(0);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.servicePressureStatus).toBe('none');
    expect(result.servicePressureRatio).toBe(100); // 100 / 1 (min denominator)
  });

  it('projects none status with zero demand and zero departures', () => {
    const servedDemand = createMockServedDemand(0);
    const servicePlan = createMockServicePlan(0);
    
    const result = projectServicePressure(servedDemand, servicePlan);
    
    expect(result.servicePressureStatus).toBe('none');
    expect(result.servicePressureRatio).toBe(0);
  });
});
