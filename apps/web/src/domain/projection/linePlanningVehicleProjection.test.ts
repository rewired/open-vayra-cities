import { describe, expect, it } from 'vitest';

import { projectLinePlanningVehicles } from './linePlanningVehicleProjection';
import { createLineFrequencyMinutes, createLineId, type Line, type LineServiceByTimeBand } from '../types/line';
import { createRouteDistanceMeters } from '../types/lineRoute';
import { createRouteTravelTimeSeconds, type LineRouteBaseline } from '../types/routeBaseline';
import { DEFAULT_TURNAROUND_RECOVERY_MINUTES } from '../constants/lineService';

const SECONDS_PER_MINUTE = 60;

const createMockLine = (frequencyByTimeBand: Partial<LineServiceByTimeBand> = {}): Line => ({
  id: createLineId('line-1'),
  label: 'Line 1',
  stopIds: [],
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments: [],
  frequencyByTimeBand: frequencyByTimeBand as LineServiceByTimeBand
});

const createMockRouteBaseline = (
  status: LineRouteBaseline['status'],
  travelMinutes: number = 10
): LineRouteBaseline => ({
  lineId: createLineId('line-1'),
  segments: [],
  totalDistanceMeters: createRouteDistanceMeters(0),
  totalTravelTimeSeconds: createRouteTravelTimeSeconds(travelMinutes * SECONDS_PER_MINUTE),
  status,
  warnings: []
});

describe('projectLinePlanningVehicles', () => {
  it('computes projected vehicle count for frequency bands using ceiling', () => {
    const line = createMockLine({
      'night': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
    });
    // 10 minutes one way -> 20 min round trip + 2 min recovery = 22 mins
    // 22 / 10 = 2.2 -> 3 vehicles
    const baseline = createMockRouteBaseline('routed', 10);
    const projection = projectLinePlanningVehicles(line, baseline);

    const bandProjection = projection.bands.find((b) => b.timeBandId === 'night')!;
    expect(bandProjection.serviceState).toBe('frequency');
    expect(bandProjection.status).toBe('ready');
    expect(bandProjection.projectedVehicles).toBe(3);
    
    // Check roundTripSeconds: 20m + recovery
    expect(bandProjection.roundTripSeconds).toBe((20 + DEFAULT_TURNAROUND_RECOVERY_MINUTES) * SECONDS_PER_MINUTE);
  });

  it('computes minimum 1 vehicle if positive frequency and route available', () => {
    const line = createMockLine({
      'night': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(60) }
    });
    // 5 minutes one way -> 10 min round trip + 2 min recovery = 12 mins
    // 12 / 60 = 0.2 -> ceil is 1
    const baseline = createMockRouteBaseline('routed', 5);
    const projection = projectLinePlanningVehicles(line, baseline);

    const bandProjection = projection.bands.find((b) => b.timeBandId === 'night')!;
    expect(bandProjection.projectedVehicles).toBe(1);
  });

  it('returns zero vehicles for no-service bands', () => {
    const line = createMockLine({
      'night': { kind: 'no-service' }
    });
    const baseline = createMockRouteBaseline('routed', 10);
    const projection = projectLinePlanningVehicles(line, baseline);

    const bandProjection = projection.bands.find((b) => b.timeBandId === 'night')!;
    expect(bandProjection.serviceState).toBe('no-service');
    expect(bandProjection.projectedVehicles).toBe(0);
    expect(bandProjection.status).toBe('no-service');
  });

  it('returns unconfigured status and no vehicle count for unset bands', () => {
    const line = createMockLine({});
    const baseline = createMockRouteBaseline('routed', 10);
    const projection = projectLinePlanningVehicles(line, baseline);

    const bandProjection = projection.bands.find((b) => b.timeBandId === 'night')!;
    expect(bandProjection.serviceState).toBe('unset');
    expect(bandProjection.projectedVehicles).toBeUndefined();
    expect(bandProjection.status).toBe('unconfigured');
  });

  it('returns route-unavailable status if route baseline is missing', () => {
    const line = createMockLine({
      'night': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
    });
    const projection = projectLinePlanningVehicles(line, null);

    const bandProjection = projection.bands.find((b) => b.timeBandId === 'night')!;
    expect(bandProjection.serviceState).toBe('frequency');
    expect(bandProjection.projectedVehicles).toBeUndefined();
    expect(bandProjection.status).toBe('route-unavailable');
  });

  it('returns route-unavailable status if route baseline is unresolved', () => {
    const line = createMockLine({
      'night': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
    });
    const baseline = createMockRouteBaseline('unresolved', 0);
    const projection = projectLinePlanningVehicles(line, baseline);

    const bandProjection = projection.bands.find((b) => b.timeBandId === 'night')!;
    expect(bandProjection.serviceState).toBe('frequency');
    expect(bandProjection.projectedVehicles).toBeUndefined();
    expect(bandProjection.status).toBe('route-unavailable');
  });

  it('carries fallback warning if route baseline is fallback-routed', () => {
    const line = createMockLine({
      'night': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
    });
    const baseline = createMockRouteBaseline('fallback-routed', 10);
    const projection = projectLinePlanningVehicles(line, baseline);

    const bandProjection = projection.bands.find((b) => b.timeBandId === 'night')!;
    expect(bandProjection.serviceState).toBe('frequency');
    expect(bandProjection.status).toBe('fallback-route');
    expect(bandProjection.warnings).toHaveLength(1);
    expect(bandProjection.warnings[0]!.type).toBe('fallback-routing');
    expect(projection.hasFallbackRouteWarning).toBe(true);
  });

  it('aggregates maximum projected vehicles correctly across bands', () => {
    const line = createMockLine({
      'night': { kind: 'no-service' },
      'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }, // 22 / 10 = 3
      'late-morning': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(5) }  // 22 / 5 = 5
    });
    const baseline = createMockRouteBaseline('routed', 10);
    const projection = projectLinePlanningVehicles(line, baseline);

    expect(projection.maxProjectedVehicles).toBe(5);
    expect(projection.totalConfiguredBands).toBe(3);
    expect(projection.totalNoServiceBands).toBe(1);
  });
});
