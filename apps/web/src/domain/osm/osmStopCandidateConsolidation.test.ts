import { describe, it, expect } from 'vitest';
import {
  consolidateOsmStopCandidates,
  OSM_STOP_CANDIDATE_GROUPING_RADIUS_METERS,
  OSM_STOP_CANDIDATE_MAX_GROUP_SPAN_METERS
} from './osmStopCandidateConsolidation';
import { createOsmStopCandidateId, type OsmStopCandidate } from '../types/osmStopCandidate';

describe('consolidateOsmStopCandidates', () => {
  const createMockCandidate = (overrides: Partial<OsmStopCandidate>): OsmStopCandidate => ({
    id: createOsmStopCandidateId(`test-${Math.random()}`),
    position: { lng: 10.0, lat: 53.5 },
    label: 'Test Stop',
    kind: 'bus-stop',
    source: 'osm',
    ...overrides
  });

  it('returns empty array for empty input', () => {
    expect(consolidateOsmStopCandidates([])).toEqual([]);
  });

  it('produces one group for a single candidate', () => {
    const candidate = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'A' });
    const groups = consolidateOsmStopCandidates([candidate]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.label).toBe('A');
    expect(groups[0]!.memberCount).toBe(1);
    expect(groups[0]!.memberIds).toContain('1');
    expect(groups[0]!.passengerVisibleMemberCount).toBe(1);
    expect(groups[0]!.vehicleAnchorMemberCount).toBe(0);
    expect(groups[0]!.berthCountHint).toBe(1);
  });

  it('groups nearby candidates with the same label', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'A', kind: 'bus-stop', position: { lng: 10.0, lat: 53.5 } });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), label: 'A', kind: 'public-transport-stop-position', position: { lng: 10.0001, lat: 53.5 } }); // ~6m away

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.memberCount).toBe(2);
    expect(groups[0]!.label).toBe('A');
    expect(groups[0]!.passengerVisibleMemberCount).toBe(1);
    expect(groups[0]!.vehicleAnchorMemberCount).toBe(1);
    expect(groups[0]!.berthCountHint).toBe(1);
  });

  it('groups nearby fallback-labeled candidate with named candidate', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'Named Stop', kind: 'bus-stop' });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), label: 'OSM stop 123', kind: 'public-transport-stop-position' });

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.label).toBe('Named Stop');
  });

  it('does not group nearby candidates with unrelated labels', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'Stop A' });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), label: 'Stop B' });

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups).toHaveLength(2);
  });

  it('does not group distant candidates with same label', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'A', position: { lng: 10.0, lat: 53.5 } });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), label: 'A', position: { lng: 10.1, lat: 53.5 } }); // ~6km away

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups).toHaveLength(2);
  });

  it('enforces maximum group span', () => {
    // 35m grouping radius is OK, but 60m max span should prevent merging a long chain
    // A (0m) -- B (30m) -- C (60m) -- D (90m)
    // A and B can group. B and C could group if alone, but A and C are 60m apart (limit).
    // D is 90m from A, so it definitely should not join A's group.
    
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'A', position: { lng: 10.0, lat: 53.5 } });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), label: 'A', position: { lng: 10.00045, lat: 53.5 } }); // ~30m
    const c3 = createMockCandidate({ id: createOsmStopCandidateId('3'), label: 'A', position: { lng: 10.0009, lat: 53.5 } });  // ~60m from c1
    const c4 = createMockCandidate({ id: createOsmStopCandidateId('4'), label: 'A', position: { lng: 10.00135, lat: 53.5 } }); // ~90m from c1
    
    const groups = consolidateOsmStopCandidates([c1, c2, c3, c4]);
    
    // c1, c2, c3 should group (span is 60m). c4 should be separate.
    expect(groups).toHaveLength(2);
    expect(groups[0]!.memberCount).toBe(3);
    expect(groups[1]!.memberCount).toBe(1);
  });

  it('prefers bus-stop or platform label over fallback stop-position', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'OSM stop 1', kind: 'public-transport-stop-position' });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), label: 'Real Name', kind: 'public-transport-platform' });

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups[0]!.label).toBe('Real Name');
  });

  it('prefers bus-stop/platform for display position', () => {
    const posPlatform = { lng: 10.0, lat: 53.5 };
    const posStopPos = { lng: 10.0001, lat: 53.5001 };
    
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), kind: 'public-transport-stop-position', position: posStopPos });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), kind: 'public-transport-platform', position: posPlatform });

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups[0]!.displayPosition).toEqual(posPlatform);
  });

  it('prefers stop-position for routing anchor', () => {
    const posPlatform = { lng: 10.0, lat: 53.5 };
    const posStopPos = { lng: 10.0001, lat: 53.5001 };
    
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), kind: 'public-transport-stop-position', position: posStopPos });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), kind: 'public-transport-platform', position: posPlatform });

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups[0]!.routingAnchorPosition).toEqual(posStopPos);
  });

  it('is deterministic across input order changes', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), osmElementId: '10', label: 'A' });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), osmElementId: '20', label: 'A' });

    const groups1 = consolidateOsmStopCandidates([c1, c2]);
    const groups2 = consolidateOsmStopCandidates([c2, c1]);

    expect(groups1).toEqual(groups2);
    expect(groups1[0]!.id).toBe('osm-group:1');
  });

  it('handles label compatibility with whitespace and case differences', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), label: 'Stop A  ', position: { lng: 10.0, lat: 53.5 } });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), label: '  stop a', position: { lng: 10.0001, lat: 53.5 } });

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups).toHaveLength(1);
  });

  it('computes berthCountHint from passenger-visible members', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('1'), kind: 'bus-stop', label: 'A' });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('2'), kind: 'public-transport-platform', label: 'A' });
    const c3 = createMockCandidate({ id: createOsmStopCandidateId('3'), kind: 'public-transport-stop-position', label: 'A' });

    const groups = consolidateOsmStopCandidates([c1, c2, c3]);
    expect(groups[0]!.passengerVisibleMemberCount).toBe(2);
    expect(groups[0]!.vehicleAnchorMemberCount).toBe(1);
    expect(groups[0]!.berthCountHint).toBe(2);
  });

  it('outputs groups in deterministic sorted order by id', () => {
    const c1 = createMockCandidate({ id: createOsmStopCandidateId('z'), label: 'Z' });
    const c2 = createMockCandidate({ id: createOsmStopCandidateId('a'), label: 'A' });

    const groups = consolidateOsmStopCandidates([c1, c2]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.label).toBe('A');
    expect(groups[1]!.label).toBe('Z');
  });
});
