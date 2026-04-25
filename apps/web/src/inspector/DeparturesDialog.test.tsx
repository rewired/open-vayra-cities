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
import { createRouteTravelTimeSeconds, type LineRouteBaseline } from '../domain/types/routeBaseline';
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
  topology: 'linear',
  servicePattern: 'one-way',
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

const routeBaseline: LineRouteBaseline = {
  lineId,
  segments: [{
    lineId,
    segmentIndex: 0,
    fromStopId: stopA,
    toStopId: stopB,
    geometry: [
      [10, 53],
      [10.01, 53.01]
    ],
    distanceMeters: createRouteDistanceMeters(1_000),
    travelTimeSeconds: createRouteTravelTimeSeconds(240),
    status: 'routed',
    warnings: []
  }],
  totalDistanceMeters: createRouteDistanceMeters(1_000),
  totalTravelTimeSeconds: createRouteTravelTimeSeconds(240),
  status: 'routed',
  warnings: []
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
        selectedLineRouteBaseline={routeBaseline}
      />
    );

    expect(markup).toContain('<div class="departures-dialog__band-label">Morning rush</div>');
    expect(markup).toContain('<div class="departures-dialog__band-label">Night</div>');
    expect(markup).toContain('00 05 10 15');
    expect(markup).toContain('04 09 14 19');
    expect(markup).toContain('Morning rush · 06:00–09:00 · every 5 min');
    expect(markup).toContain('Runtime 4.0 min');
  });
});
