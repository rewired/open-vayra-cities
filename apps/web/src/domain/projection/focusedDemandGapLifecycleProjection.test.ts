import { describe, it, expect } from 'vitest';
import { projectFocusedDemandGapLifecycle } from './focusedDemandGapLifecycleProjection';
import type { DemandGapRankingProjection, DemandGapRankingItem } from './demandGapProjection';

describe('focusedDemandGapLifecycleProjection', () => {
  const createMockItem = (id: string): DemandGapRankingItem => ({
    id,
    kind: 'uncaptured-residential',
    position: { lng: 0, lat: 0 },
    activeWeight: 10,
    baseWeight: 10,
    nearestStopDistanceMeters: null,
    capturingStopCount: 0,
    note: 'Test item'
  });

  const createMockRanking = (params: {
    uncaptured?: DemandGapRankingItem[];
    unserved?: DemandGapRankingItem[];
    unreachable?: DemandGapRankingItem[];
  } = {}): DemandGapRankingProjection => ({
    status: 'ready',
    activeTimeBandId: 'morning-rush',
    uncapturedResidentialGaps: params.uncaptured ?? [],
    capturedButUnservedResidentialGaps: params.unserved ?? [],
    capturedButUnreachableWorkplaceGaps: params.unreachable ?? [],
    summary: { totalGapCount: 0 }
  });

  it('returns unfocused status when no gap is focused', () => {
    const ranking = createMockRanking();
    const result = projectFocusedDemandGapLifecycle(null, ranking);
    
    expect(result.status).toBe('unfocused');
    expect(result.focusedGapId).toBeNull();
    expect(result.shouldOfferClearFocus).toBe(false);
  });

  it('returns active status when focused gap is present in uncaptured residential list', () => {
    const gapId = 'gap-1';
    const ranking = createMockRanking({ uncaptured: [createMockItem(gapId)] });
    const result = projectFocusedDemandGapLifecycle(gapId, ranking);
    
    expect(result.status).toBe('active');
    expect(result.focusedGapId).toBe(gapId);
    expect(result.title).toBe('Focused gap active');
    expect(result.shouldOfferClearFocus).toBe(true);
  });

  it('returns active status when focused gap is present in unserved residential list', () => {
    const gapId = 'gap-1';
    const ranking = createMockRanking({ unserved: [createMockItem(gapId)] });
    const result = projectFocusedDemandGapLifecycle(gapId, ranking);
    
    expect(result.status).toBe('active');
  });

  it('returns active status when focused gap is present in unreachable workplace list', () => {
    const gapId = 'gap-1';
    const ranking = createMockRanking({ unreachable: [createMockItem(gapId)] });
    const result = projectFocusedDemandGapLifecycle(gapId, ranking);
    
    expect(result.status).toBe('active');
  });

  it('returns not-currently-ranked status when focused gap is missing from all buckets', () => {
    const gapId = 'gap-missing';
    const ranking = createMockRanking({ uncaptured: [createMockItem('gap-other')] });
    const result = projectFocusedDemandGapLifecycle(gapId, ranking);
    
    expect(result.status).toBe('not-currently-ranked');
    expect(result.focusedGapId).toBe(gapId);
    expect(result.title).toContain('no longer appears');
    expect(result.message).toContain('may be resolved');
    expect(result.message).not.toContain('is resolved'); // Should not claim certainty
    expect(result.shouldOfferClearFocus).toBe(true);
  });
});
