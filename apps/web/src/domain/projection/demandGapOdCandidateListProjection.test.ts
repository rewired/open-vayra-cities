import { describe, expect, it } from 'vitest';
import { projectDemandGapOdCandidateList } from './demandGapOdCandidateListProjection';
import type { DemandGapOdContextProjection } from './demandGapOdContextProjection';

describe('projectDemandGapOdCandidateList', () => {
  it('returns unavailable when context is unavailable', () => {
    const emptyContext: DemandGapOdContextProjection = {
      status: 'unavailable',
      activeTimeBandId: 'morning-rush',
      focusedGapId: null,
      focusedGapKind: null,
      problemSide: null,
      focusedPosition: null,
      candidates: [],
      summary: { candidateCount: 0, topActiveWeight: 0 },
      guidance: null
    };

    const projection = projectDemandGapOdCandidateList(emptyContext);

    expect(projection.status).toBe('unavailable');
    expect(projection.heading).toBeNull();
    expect(projection.rows).toHaveLength(0);
  });

  it('returns unavailable when context is ready but problem side is null', () => {
    const readyContext: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: null,
      focusedPosition: { lng: 0, lat: 0 },
      candidates: [
        {
          id: 'candidate-a',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 1, lat: 1 },
          activeWeight: 25.54,
          baseWeight: 25,
          distanceMeters: 800
        }
      ],
      summary: { candidateCount: 1, topActiveWeight: 25.54 },
      guidance: 'test'
    };

    const projection = projectDemandGapOdCandidateList(readyContext);

    expect(projection.status).toBe('unavailable');
    expect(projection.heading).toBeNull();
    expect(projection.rows).toHaveLength(0);
  });

  it('creates workplace candidates when problem side is origin', () => {
    const readyContext: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: 'origin',
      focusedPosition: { lng: 0, lat: 0 },
      candidates: [
        {
          id: 'candidate-a',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 1, lat: 1 },
          activeWeight: 25.54,
          baseWeight: 25,
          distanceMeters: 800
        },
        {
          id: 'candidate-b',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 2, lat: 2 },
          activeWeight: 25.0,
          baseWeight: 25,
          distanceMeters: 1200
        }
      ],
      summary: { candidateCount: 2, topActiveWeight: 25.54 },
      guidance: 'test'
    };

    const projection = projectDemandGapOdCandidateList(readyContext);

    expect(projection.status).toBe('ready');
    expect(projection.heading).toBe('Likely workplace candidates');
    
    // Check row 0 (matches candidate-a)
    expect(projection.rows[0]?.candidateId).toBe('candidate-a');
    expect(projection.rows[0]?.displayLabel).toBe('#1 Workplace candidate');
    expect(projection.rows[0]?.activeWeightLabel).toBe('25.5');
    expect(projection.rows[0]?.distanceLabel).toBe('800m');
    
    // Check row 1 (matches candidate-b, confirming deterministic order and .0 formatting)
    expect(projection.rows[1]?.candidateId).toBe('candidate-b');
    expect(projection.rows[1]?.displayLabel).toBe('#2 Workplace candidate');
    expect(projection.rows[1]?.activeWeightLabel).toBe('25.0');
    expect(projection.rows[1]?.distanceLabel).toBe('1.2km');
  });

  it('creates residential candidates when problem side is destination', () => {
    const readyContext: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedGapId: 'gap-2',
      focusedGapKind: 'captured-unreachable-workplace',
      problemSide: 'destination',
      focusedPosition: { lng: 0, lat: 0 },
      candidates: [
        {
          id: 'candidate-b',
          role: 'origin',
          demandClass: 'residential',
          position: { lng: 2, lat: 2 },
          activeWeight: 10.0,
          baseWeight: 10,
          distanceMeters: 1500
        }
      ],
      summary: { candidateCount: 1, topActiveWeight: 10.0 },
      guidance: 'test'
    };

    const projection = projectDemandGapOdCandidateList(readyContext);

    expect(projection.status).toBe('ready');
    expect(projection.heading).toBe('Likely residential candidates');
    expect(projection.rows[0]?.displayLabel).toBe('#1 Residential candidate');
    expect(projection.rows[0]?.distanceLabel).toBe('1.5km');
  });

  it('formats distance correctly below and above 1000m', () => {
    const readyContext: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: 'origin',
      focusedPosition: { lng: 0, lat: 0 },
      candidates: [
        {
          id: 'c1',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 1, lat: 1 },
          activeWeight: 10,
          baseWeight: 10,
          distanceMeters: 999.4
        },
        {
          id: 'c2',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 1, lat: 1 },
          activeWeight: 10,
          baseWeight: 10,
          distanceMeters: 1000.1
        }
      ],
      summary: { candidateCount: 2, topActiveWeight: 10 },
      guidance: 'test'
    };

    const projection = projectDemandGapOdCandidateList(readyContext);
    
    expect(projection.rows[0]?.distanceLabel).toBe('999m');
    expect(projection.rows[1]?.distanceLabel).toBe('1.0km');
  });
});
