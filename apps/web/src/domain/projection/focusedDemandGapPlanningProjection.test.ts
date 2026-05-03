import { describe, it, expect } from 'vitest';
import { projectFocusedDemandGapPlanningSummary } from './focusedDemandGapPlanningProjection';
import type { DemandGapRankingProjection, DemandGapRankingItem } from './demandGapProjection';
import type { DemandGapOdContextProjection } from './demandGapOdContextProjection';

const MOCK_TIME_BAND_ID = 'morning-rush';

const createMockRanking = (items: DemandGapRankingItem[]): DemandGapRankingProjection => ({
  status: 'ready',
  activeTimeBandId: MOCK_TIME_BAND_ID,
  uncapturedResidentialGaps: items.filter(i => i.kind === 'uncaptured-residential'),
  capturedButUnservedResidentialGaps: items.filter(i => i.kind === 'captured-unserved-residential'),
  capturedButUnreachableWorkplaceGaps: items.filter(i => i.kind === 'captured-unreachable-workplace'),
  summary: { totalGapCount: items.length }
});

const createMockOdContext = (candidateCount: number = 0, topActiveWeight: number = 0): DemandGapOdContextProjection => ({
  status: 'ready',
  activeTimeBandId: MOCK_TIME_BAND_ID,
  focusedGapId: 'mock-gap',
  focusedGapKind: 'uncaptured-residential',
  problemSide: 'origin',
  focusedPosition: { lng: 0, lat: 0 },
  candidates: Array.from({ length: candidateCount }, (_, i) => ({
    id: `mock-candidate-${i}`, role: 'destination', demandClass: 'workplace', position: { lng: 1, lat: 1 }, activeWeight: topActiveWeight, baseWeight: 10, distanceMeters: 500
  })),
  summary: { candidateCount, topActiveWeight },
  guidance: 'Mock guidance'
});

describe('focusedDemandGapPlanningProjection', () => {
  it('returns unavailable if ranking is not ready', () => {
    const ranking: DemandGapRankingProjection = {
      status: 'unavailable',
      activeTimeBandId: MOCK_TIME_BAND_ID,
      uncapturedResidentialGaps: [],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 0 }
    };
    const odContext = createMockOdContext();
    
    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    expect(result.status).toBe('unavailable');
  });

  it('returns unavailable if gap is not found', () => {
    const ranking = createMockRanking([]);
    const odContext = createMockOdContext();
    
    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    expect(result.status).toBe('unavailable');
  });

  it('projects coverage guidance for uncaptured-residential gap', () => {
    const gapItem: DemandGapRankingItem = {
      id: 'mock-gap',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 15.4,
      baseWeight: 20,
      nearestStopDistanceMeters: 1250,
      capturingStopCount: 0,
      note: 'Mock note'
    };
    const ranking = createMockRanking([gapItem]);
    const odContext = createMockOdContext(2, 10.5);

    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    
    expect(result.status).toBe('ready');
    expect(result.actionKind).toBe('add-stop-coverage');
    expect(result.title).toBe('Coverage gap');
    
    expect(result.evidence).toEqual([
      { label: 'Active pressure', value: '15.4' },
      { label: 'Nearest stop', value: '1250m' },
      { label: 'OD candidates', value: '2' },
      { label: 'Top candidate weight', value: '10.5' }
    ]);
  });

  it('projects connectivity guidance for captured-unserved-residential gap', () => {
    const gapItem: DemandGapRankingItem = {
      id: 'mock-gap',
      kind: 'captured-unserved-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 12.0,
      baseWeight: 20,
      nearestStopDistanceMeters: 250,
      capturingStopCount: 2,
      note: 'Mock note'
    };
    const ranking = createMockRanking([gapItem]);
    const odContext = createMockOdContext(0, 0);

    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    
    expect(result.status).toBe('ready');
    expect(result.actionKind).toBe('connect-origin-to-destination');
    expect(result.title).toBe('Unserved captured demand');
    
    expect(result.evidence).toEqual([
      { label: 'Active pressure', value: '12.0' },
      { label: 'Capturing stops', value: '2' },
      { label: 'OD candidates', value: '0' }
    ]);
  });

  it('projects reachability guidance for captured-unreachable-workplace gap', () => {
    const gapItem: DemandGapRankingItem = {
      id: 'mock-gap',
      kind: 'captured-unreachable-workplace',
      position: { lng: 0, lat: 0 },
      activeWeight: 25.1,
      baseWeight: 30,
      nearestStopDistanceMeters: 100,
      capturingStopCount: 1,
      note: 'Mock note'
    };
    const ranking = createMockRanking([gapItem]);
    const odContext = createMockOdContext(1, 8.0);

    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    
    expect(result.status).toBe('ready');
    expect(result.actionKind).toBe('connect-destination-from-origin');
    expect(result.title).toBe('Unreachable workplace');
    
    expect(result.evidence).toEqual([
      { label: 'Active pressure', value: '25.1' },
      { label: 'Capturing stops', value: '1' },
      { label: 'OD candidates', value: '1' },
      { label: 'Top candidate weight', value: '8.0' }
    ]);
  });
  
  it('handles null nearest stop distance for uncaptured-residential', () => {
    const gapItem: DemandGapRankingItem = {
      id: 'mock-gap',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 15.4,
      baseWeight: 20,
      nearestStopDistanceMeters: null,
      capturingStopCount: 0,
      note: 'Mock note'
    };
    const ranking = createMockRanking([gapItem]);
    const odContext = createMockOdContext(0, 0);

    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    
    expect(result.status).toBe('ready');
    const nearestStopEvidence = result.evidence.find(e => e.label === 'Nearest stop');
    expect(nearestStopEvidence?.value).toBe('Outside access');
  });

  it('returns unavailable if focusedGapId is null', () => {
    const gapItem: DemandGapRankingItem = {
      id: 'mock-gap',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 15.4,
      baseWeight: 20,
      nearestStopDistanceMeters: 1250,
      capturingStopCount: 0,
      note: 'Mock note'
    };
    const ranking = createMockRanking([gapItem]);
    const odContext = createMockOdContext();
    
    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, null);
    expect(result.status).toBe('unavailable');
  });

  it('omits OD candidate evidence when odContext is unavailable', () => {
    const gapItem: DemandGapRankingItem = {
      id: 'mock-gap',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 15.4,
      baseWeight: 20,
      nearestStopDistanceMeters: 1250,
      capturingStopCount: 0,
      note: 'Mock note'
    };
    const ranking = createMockRanking([gapItem]);
    const odContext: DemandGapOdContextProjection = {
      ...createMockOdContext(),
      status: 'unavailable'
    };

    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    
    expect(result.status).toBe('ready');
    const odEvidence = result.status === 'ready' ? result.evidence.find(e => e.label === 'OD candidates') : undefined;
    expect(odEvidence).toBeUndefined();
  });

  it('does not contain wording claiming exact passenger flows or real-world routing', () => {
    const gapItem: DemandGapRankingItem = {
      id: 'mock-gap',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 15.4,
      baseWeight: 20,
      nearestStopDistanceMeters: 1250,
      capturingStopCount: 0,
      note: 'Mock note'
    };
    const ranking = createMockRanking([gapItem]);
    const odContext = createMockOdContext(2, 10.5);

    const result = projectFocusedDemandGapPlanningSummary(ranking, odContext, 'mock-gap');
    expect(result.status).toBe('ready');
    
    if (result.status === 'ready') {
      const allText = [
        result.title,
        result.primaryAction,
        result.supportingContext,
        result.caveat
      ].filter(Boolean).join(' ').toLowerCase();

      expect(allText).not.toContain('actual flow');
      expect(allText).not.toContain('exact flow');
      expect(allText).not.toContain('assigned passengers');
      expect(allText).not.toContain('passengers are assigned');
      expect(allText).not.toContain('real-world route');
    }
  });
});
