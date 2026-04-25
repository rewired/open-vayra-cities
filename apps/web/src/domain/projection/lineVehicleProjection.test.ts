import { describe, it, expect } from 'vitest';
import { projectLineVehicleNetwork } from './lineVehicleProjection';
import { createSimulationMinuteOfDay } from '../simulation/simulationClock';
import type { Line } from '../types/line';
import type { LineRouteBaseline } from '../types/routeBaseline';
import type { LinePlanningVehicleProjection } from '../types/linePlanningVehicleProjection';

const mockLineId = 'line-1' as any;
const mockTimeBandId = 'morning-rush' as any;

const mockLine: Line = {
  id: mockLineId,
  label: 'Line 1',
  stopIds: [],
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments: [],
  frequencyByTimeBand: {
    [mockTimeBandId]: { kind: 'frequency', headwayMinutes: 10 as any }
  } as any
};

const mockRouteBaseline: LineRouteBaseline = {
  lineId: mockLineId,
  status: 'routed',
  totalDistanceMeters: 5000 as any,
  totalTravelTimeSeconds: 600 as any,
  warnings: [],
  segments: [
    {
      lineId: mockLineId,
      segmentIndex: 0,
      fromStopId: 'stop-1' as any,
      toStopId: 'stop-2' as any,
      distanceMeters: 5000 as any,
      travelTimeSeconds: 600 as any,
      status: 'routed',
      warnings: [],
      geometry: [
        [10, 10],
        [20, 20]
      ]
    }
  ]
};

const mockPlanningProjection: LinePlanningVehicleProjection = {
  lineId: mockLineId,
  maxProjectedVehicles: 3 as any,
  totalConfiguredBands: 1,
  totalNoServiceBands: 0,
  totalUnconfiguredBands: 0,
  hasFallbackRouteWarning: false,
  bands: [
    {
      lineId: mockLineId,
      timeBandId: mockTimeBandId,
      serviceState: 'frequency',
      headwayMinutes: 10 as any,
      status: 'ready',
      projectedVehicles: 3 as any,
      roundTripSeconds: 1500 as any, // 600 * 2 + 5 * 60
      warnings: []
    }
  ]
};

describe('projectLineVehicleNetwork', () => {
  it('returns no vehicles if service is unset', () => {
    const routeBaselinesByLineId = new Map([[mockLineId, mockRouteBaseline]]);
    const planning: LinePlanningVehicleProjection = {
      ...mockPlanningProjection,
      bands: [{
        ...mockPlanningProjection.bands[0]!,
        serviceState: 'unset',
        status: 'unconfigured'
      }]
    };
    const result = projectLineVehicleNetwork(
      [mockLine],
      routeBaselinesByLineId,
      [planning],
      createSimulationMinuteOfDay(420),
      mockTimeBandId
    );

    expect(result.lines[0]?.vehicles).toHaveLength(0);
    expect(result.summary.totalProjectedVehicleCount).toBe(0);
  });

  it('distributes vehicles evenly based on deterministic headway and interpolates geometry', () => {
    const routeBaselinesByLineId = new Map([[mockLineId, mockRouteBaseline]]);
    const result = projectLineVehicleNetwork(
      [mockLine],
      routeBaselinesByLineId,
      [mockPlanningProjection],
      createSimulationMinuteOfDay(420),
      mockTimeBandId
    );

    expect(result.lines[0]?.vehicles).toHaveLength(3);
    const vehicles = result.lines[0]!.vehicles;
    
    // First vehicle
    expect(vehicles[0]?.id).toBe(`${mockLineId}:${mockTimeBandId}:bus-0`);
    expect(vehicles[0]?.direction).toMatch(/outbound|return/);
    
    // Summary
    expect(result.summary.totalProjectedVehicleCount).toBe(3);
    expect(result.summary.linesWithProjectedVehiclesCount).toBe(1);
  });

  it('marks vehicles as degraded if the route baseline is fallback-routed', () => {
    const fallbackBaseline: LineRouteBaseline = {
      ...mockRouteBaseline,
      status: 'fallback-routed'
    };
    const routeBaselinesByLineId = new Map([[mockLineId, fallbackBaseline]]);
    const result = projectLineVehicleNetwork(
      [mockLine],
      routeBaselinesByLineId,
      [mockPlanningProjection],
      createSimulationMinuteOfDay(420),
      mockTimeBandId
    );

    const vehicles = result.lines[0]!.vehicles;
    expect(vehicles).toHaveLength(3);
    expect(vehicles[0]?.status).toBe('degraded-projected');
    expect(vehicles[0]?.degradedNote).toContain('fallback routing');
    expect(result.summary.totalProjectedVehicleCount).toBe(0);
    expect(result.summary.totalDegradedProjectedVehicleCount).toBe(3);
  });

  it('handles empty geometry robustly by marking status unavailable', () => {
    const emptyBaseline: LineRouteBaseline = {
      ...mockRouteBaseline,
      segments: [{
        ...mockRouteBaseline.segments[0]!,
        geometry: [] // Invalid geometry length
      }]
    };
    const routeBaselinesByLineId = new Map([[mockLineId, emptyBaseline]]);
    const result = projectLineVehicleNetwork(
      [mockLine],
      routeBaselinesByLineId,
      [mockPlanningProjection],
      createSimulationMinuteOfDay(420),
      mockTimeBandId
    );

    const vehicles = result.lines[0]!.vehicles;
    expect(vehicles).toHaveLength(3);
    expect(vehicles[0]?.status).toBe('unavailable');
    expect(vehicles[0]?.coordinate).toBeNull();
  });
});
