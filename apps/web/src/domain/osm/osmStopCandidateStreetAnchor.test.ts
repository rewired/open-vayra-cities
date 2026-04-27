import { describe, it, expect } from 'vitest';
import { classifyOsmStopCandidateStreetAnchorDistance } from './osmStopCandidateStreetAnchor';
import {
  OSM_STOP_CANDIDATE_STREET_ANCHOR_READY_MAX_DISTANCE_METERS,
  OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS
} from './osmStopCandidateAnchorConstants';

describe('osmStopCandidateStreetAnchor', () => {
  describe('classifyOsmStopCandidateStreetAnchorDistance', () => {
    it('should classify null distance as blocked', () => {
      expect(classifyOsmStopCandidateStreetAnchorDistance(null)).toBe('blocked');
    });

    it('should classify 0 meters as ready', () => {
      expect(classifyOsmStopCandidateStreetAnchorDistance(0)).toBe('ready');
    });

    it('should classify ready threshold boundary as ready', () => {
      expect(classifyOsmStopCandidateStreetAnchorDistance(OSM_STOP_CANDIDATE_STREET_ANCHOR_READY_MAX_DISTANCE_METERS)).toBe('ready');
    });

    it('should classify just above ready threshold as review', () => {
      expect(classifyOsmStopCandidateStreetAnchorDistance(OSM_STOP_CANDIDATE_STREET_ANCHOR_READY_MAX_DISTANCE_METERS + 0.1)).toBe('review');
    });

    it('should classify review threshold boundary as review', () => {
      expect(classifyOsmStopCandidateStreetAnchorDistance(OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS)).toBe('review');
    });

    it('should classify just above review threshold as blocked', () => {
      expect(classifyOsmStopCandidateStreetAnchorDistance(OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS + 0.1)).toBe('blocked');
    });

    it('should classify non-finite distances as blocked', () => {
      expect(classifyOsmStopCandidateStreetAnchorDistance(Infinity)).toBe('blocked');
      expect(classifyOsmStopCandidateStreetAnchorDistance(-Infinity)).toBe('blocked');
      expect(classifyOsmStopCandidateStreetAnchorDistance(NaN)).toBe('blocked');
    });
  });
});
