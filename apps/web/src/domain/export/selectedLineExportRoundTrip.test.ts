import { describe, expect, it } from 'vitest';
import { createLineId, createNoServiceLineServiceByTimeBand, type Line } from '../types/line';
import { createStopId, type Stop } from '../types/stop';
import { buildSelectedLineExportPayload } from '../types/selectedLineExport';
import { validateSelectedLineExportPayload } from './selectedLineExportValidation';
import { convertSelectedLineExportPayloadToSession } from './selectedLineExportSessionLoader';

describe('selected-line export round-trip', () => {
  const mockStop1: Stop = { id: createStopId('stop-1'), label: 'Stop A', position: { lng: 9.9, lat: 53.5 } };
  const mockStop2: Stop = { id: createStopId('stop-2'), label: 'Stop B', position: { lng: 9.91, lat: 53.51 } };
  
  const mockLine: Line = {
    id: createLineId('line-1'),
    label: 'Stop A ↔ Stop B',
    stopIds: [mockStop1.id, mockStop2.id],
    topology: 'linear',
    servicePattern: 'bidirectional',
    routeSegments: [
      {
        id: 'seg-1' as any,
        lineId: 'line-1' as any,
        fromStopId: 'stop-1' as any,
        toStopId: 'stop-2' as any,
        orderedGeometry: [[9.9, 53.5], [9.91, 53.51]],
        distanceMeters: 1000 as any,
        inMotionTravelMinutes: 2 as any,
        dwellMinutes: 0.5 as any,
        totalTravelMinutes: 2.5 as any,
        status: 'routed'
      }
    ],
    reverseRouteSegments: [
       {
        id: 'seg-rev-1' as any,
        lineId: 'line-1' as any,
        fromStopId: 'stop-2' as any,
        toStopId: 'stop-1' as any,
        orderedGeometry: [[9.91, 53.51], [9.9, 53.5]],
        distanceMeters: 1000 as any,
        inMotionTravelMinutes: 2 as any,
        dwellMinutes: 0.5 as any,
        totalTravelMinutes: 2.5 as any,
        status: 'routed'
      }
    ],
    frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
  };

  it('preserves all line and stop data through export/validate/convert cycle', () => {
    // 1. Build payload
    const payload = buildSelectedLineExportPayload({
      selectedLine: mockLine,
      placedStops: [mockStop1, mockStop2],
      createdAtIsoUtc: new Date().toISOString(),
      sourceMetadata: { source: 'round-trip-test' }
    });

    // 2. Validate payload
    const validationResult = validateSelectedLineExportPayload(payload);
    expect(validationResult.ok).toBe(true);
    if (!validationResult.ok) return;

    // 3. Convert back to session
    const conversionResult = convertSelectedLineExportPayloadToSession(validationResult.payload);
    expect(conversionResult.ok).toBe(true);
    if (!conversionResult.ok) return;

    const importedLine = conversionResult.session.sessionLines[0];
    const importedStops = conversionResult.session.placedStops;

    // Assert preservation
    expect(importedLine.id).toBe(mockLine.id);
    expect(importedLine.label).toBe(mockLine.label);
    expect(importedLine.stopIds).toEqual(mockLine.stopIds);
    expect(importedLine.topology).toBe(mockLine.topology);
    expect(importedLine.servicePattern).toBe(mockLine.servicePattern);
    expect(importedLine.routeSegments).toHaveLength(mockLine.routeSegments.length);
    expect(importedLine.reverseRouteSegments).toHaveLength(mockLine.reverseRouteSegments!.length);
    
    // Check first segment data
    expect(importedLine.routeSegments[0].id).toBe(mockLine.routeSegments[0].id);
    expect(importedLine.routeSegments[0].orderedGeometry).toEqual(mockLine.routeSegments[0].orderedGeometry);
    
    // Check stops
    expect(importedStops).toHaveLength(2);
    expect(importedStops[0].label).toBe(mockStop1.label);
  });
});
