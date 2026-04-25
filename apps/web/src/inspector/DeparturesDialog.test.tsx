import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createLineFrequencyMinutes, createLineId, type Line } from '../domain/types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../domain/types/lineRoute';
import { createStopId, type Stop } from '../domain/types/stop';
import type { RouteBaselineAggregateMetrics } from '../domain/projection/useNetworkPlanningProjections';
import { DeparturesDialog } from './DeparturesDialog';

const lineId = createLineId('line-1');
const stopA = createStopId('stop-a');
const stopB = createStopId('stop-b');

const placedStops: readonly Stop[] = [
  { id: stopA, label: 'Alpha', position: { lat: 53, lng: 10 } },
  { id: stopB, label: 'Bravo', position: { lat: 53.01, lng: 10.01 } }
];

const routeSegments: readonly LineRouteSegment[] = [
  {
    id: createLineSegmentId('segment-1'),
    lineId,
    fromStopId: stopA,
    toStopId: stopB,
    orderedGeometry: [
      [10, 53],
      [10.01, 53.01]
    ],
    distanceMeters: createRouteDistanceMeters(1_000),
    inMotionTravelMinutes: createRouteTravelMinutes(3.5),
    dwellMinutes: createRouteTravelMinutes(0.5),
    totalTravelMinutes: createRouteTravelMinutes(4),
    status: 'routed'
  }
];

const line: Line = {
  id: lineId,
  label: 'Line 1',
  stopIds: [stopA, stopB],
  routeSegments,
  frequencyByTimeBand: {
    'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(5) },
    'late-morning': { kind: 'no-service' },
    midday: { kind: 'no-service' },
    afternoon: { kind: 'no-service' },
    'evening-rush': { kind: 'no-service' },
    evening: { kind: 'no-service' },
    night: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(30) }
  }
};

const routeBaselineMetrics: RouteBaselineAggregateMetrics = {
  segmentCount: 1,
  totalDistanceMeters: 1_000,
  totalInMotionMinutes: 3.5,
  totalDwellMinutes: 0.5,
  totalLineMinutes: 4,
  hasFallbackSegments: false
};

describe('DeparturesDialog', () => {
  it('renders timetable matrix headers and two-digit minute values', () => {
    const markup = renderToStaticMarkup(
      <DeparturesDialog
        open
        onClose={() => {}}
        selectedLine={line}
        placedStops={placedStops}
        activeTimeBandId="morning-rush"
        selectedLineRouteBaselineMetrics={routeBaselineMetrics}
      />
    );

    expect(markup).toContain('<th scope="col">00</th>');
    expect(markup).toContain('<th scope="col">23</th>');
    expect(markup).toContain('00 05 10 15');
    expect(markup).toContain('04 09 14 19');
    expect(markup).toContain('Morning rush · 06:00–09:00 · every 5 min');
    expect(markup).not.toContain('Route baseline</button>');
  });
});
