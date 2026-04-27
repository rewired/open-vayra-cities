import { calculateGreatCircleDistanceMeters } from '../../lib/geometry';
import type {
  OsmStopCandidate,
  OsmStopCandidateGroup,
  OsmStopCandidateGroupId,
  OsmStopCandidateKind
} from '../types/osmStopCandidate';
import { createOsmStopCandidateGroupId } from '../types/osmStopCandidate';

/**
 * Distance threshold for grouping nearby compatible OSM stop candidates.
 */
export const OSM_STOP_CANDIDATE_GROUPING_RADIUS_METERS = 35;

/**
 * Distance threshold for exact duplicate OSM objects (e.g. redundant bus_stop + platform).
 */
export const OSM_STOP_CANDIDATE_EXACT_DUPLICATE_RADIUS_METERS = 5;

/**
 * Maximum geographic span of a single consolidated candidate group.
 * Prevents over-merging along long street segments with same-named stops.
 */
export const OSM_STOP_CANDIDATE_MAX_GROUP_SPAN_METERS = 60;

const OSM_FALLBACK_LABEL_PATTERN = /^OSM stop \d+$/;

const DISPLAY_POSITION_KIND_PREFERENCE: OsmStopCandidateKind[] = [
  'bus-stop',
  'public-transport-platform',
  'public-transport-stop-position'
];

const ROUTING_ANCHOR_KIND_PREFERENCE: OsmStopCandidateKind[] = [
  'public-transport-stop-position',
  'bus-stop',
  'public-transport-platform'
];

/**
 * Normalizes a label for comparison by trimming, lowercasing, and collapsing whitespace.
 */
function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Returns true if a label is a fallback "OSM stop <id>" label.
 */
function isFallbackLabel(label: string): boolean {
  return OSM_FALLBACK_LABEL_PATTERN.test(label);
}

/**
 * Returns true if two candidates are label-compatible for grouping.
 * Compatible if normalized labels match or one side has only a fallback label.
 */
function areLabelsCompatible(labelA: string, labelB: string): boolean {
  const normA = normalizeLabel(labelA);
  const normB = normalizeLabel(labelB);

  if (normA === normB) {
    return true;
  }

  return isFallbackLabel(labelA) || isFallbackLabel(labelB);
}

/**
 * Deterministically sorts raw candidates to ensure stable grouping.
 */
function sortCandidates(candidates: readonly OsmStopCandidate[]): OsmStopCandidate[] {
  return [...candidates].sort((a, b) => {
    // 1. Numeric OSM element ID if available
    const idA = parseInt(a.osmElementId ?? '0', 10);
    const idB = parseInt(b.osmElementId ?? '0', 10);
    if (!isNaN(idA) && !isNaN(idB) && idA !== idB) {
      return idA - idB;
    }

    // 2. Candidate ID string
    if (a.id !== b.id) {
      return a.id.localeCompare(b.id);
    }

    // 3. Label
    return a.label.localeCompare(b.label);
  });
}

/**
 * Selects the best position from a list of members based on a priority list of kinds.
 */
function selectPreferredPosition(
  members: readonly OsmStopCandidate[],
  preference: OsmStopCandidateKind[]
): OsmStopCandidate['position'] {
  for (const kind of preference) {
    const preferred = members.find((m) => m.kind === kind);
    if (preferred) {
      return preferred.position;
    }
  }
  return members[0]!.position;
}

/**
 * Selects the best label for the group.
 * 1. Prefer non-fallback label from bus-stop or platform.
 * 2. Prefer any non-fallback label.
 * 3. Use first fallback label.
 */
function selectPreferredLabel(members: readonly OsmStopCandidate[]): string {
  const sortedMembers = sortCandidates(members);

  const namedPlatformOrBusStop = sortedMembers.find(
    (m) => !isFallbackLabel(m.label) && (m.kind === 'bus-stop' || m.kind === 'public-transport-platform')
  );
  if (namedPlatformOrBusStop) {
    return namedPlatformOrBusStop.label;
  }

  const namedCandidate = sortedMembers.find((m) => !isFallbackLabel(m.label));
  if (namedCandidate) {
    return namedCandidate.label;
  }

  return sortedMembers[0]!.label;
}

/**
 * Checks if a candidate can join an existing group based on distance, span, and label compatibility.
 */
function canJoinGroup(candidate: OsmStopCandidate, group: OsmStopCandidate[]): boolean {
  const representative = group[0]!;
  if (!areLabelsCompatible(representative.label, candidate.label)) {
    return false;
  }

  let withinRadiusOfAny = false;
  for (const member of group) {
    const distanceToMember = calculateGreatCircleDistanceMeters(
      [member.position.lng, member.position.lat],
      [candidate.position.lng, candidate.position.lat]
    );

    if (distanceToMember <= OSM_STOP_CANDIDATE_EXACT_DUPLICATE_RADIUS_METERS) {
      withinRadiusOfAny = true;
    } else if (distanceToMember <= OSM_STOP_CANDIDATE_GROUPING_RADIUS_METERS) {
      withinRadiusOfAny = true;
    }

    if (distanceToMember > OSM_STOP_CANDIDATE_MAX_GROUP_SPAN_METERS) {
      return false;
    }
  }

  return withinRadiusOfAny;
}

/**
 * Consolidates raw OSM stop candidates into deterministic display/adoption groups.
 * Conservative grouping: nearby objects with compatible labels are merged into logical stop facilities.
 */
export function consolidateOsmStopCandidates(candidates: readonly OsmStopCandidate[]): readonly OsmStopCandidateGroup[] {
  if (candidates.length === 0) {
    return [];
  }

  const sorted = sortCandidates(candidates);

  // 1. Group passenger-visible candidates first
  const passengerVisible = sorted.filter((c) => c.kind === 'bus-stop' || c.kind === 'public-transport-platform');
  const vehicleAnchors = sorted.filter((c) => c.kind === 'public-transport-stop-position');

  const groups: OsmStopCandidate[][] = [];

  for (const candidate of passengerVisible) {
    let joined = false;

    for (const group of groups) {
      if (canJoinGroup(candidate, group)) {
        group.push(candidate);
        joined = true;
        break;
      }
    }

    if (!joined) {
      groups.push([candidate]);
    }
  }

  // 2. Assign vehicle-anchor candidates to the best compatible passenger-visible group
  for (const anchor of vehicleAnchors) {
    let bestGroup: OsmStopCandidate[] | null = null;
    let minDistance = Infinity;

    for (const group of groups) {
      const representative = group[0]!;
      if (!areLabelsCompatible(representative.label, anchor.label)) {
        continue;
      }

      const distance = calculateGreatCircleDistanceMeters(
        [representative.position.lng, representative.position.lat],
        [anchor.position.lng, anchor.position.lat]
      );

      if (distance <= OSM_STOP_CANDIDATE_GROUPING_RADIUS_METERS && distance < minDistance) {
        // Verify max span before tentatively assigning
        let spanOk = true;
        for (const member of group) {
          if (calculateGreatCircleDistanceMeters(
            [member.position.lng, member.position.lat],
            [anchor.position.lng, anchor.position.lat]
          ) > OSM_STOP_CANDIDATE_MAX_GROUP_SPAN_METERS) {
            spanOk = false;
            break;
          }
        }

        if (spanOk) {
          bestGroup = group;
          minDistance = distance;
        }
      }
    }

    if (bestGroup) {
      bestGroup.push(anchor);
    } else {
      // 3. Standalone stop-position
      groups.push([anchor]);
    }
  }

  // Final group construction
  const result = groups.map((members) => {
    // Re-sort members within the group to ensure deterministic result
    const sortedMembers = sortCandidates(members);
    const firstMember = sortedMembers[0]!;
    const groupId = createOsmStopCandidateGroupId(`osm-group:${firstMember.id}`);

    const passengerVisibleMemberCount = sortedMembers.filter(
      (m) => m.kind === 'bus-stop' || m.kind === 'public-transport-platform'
    ).length;
    const vehicleAnchorMemberCount = sortedMembers.filter((m) => m.kind === 'public-transport-stop-position').length;

    return {
      id: groupId,
      label: selectPreferredLabel(sortedMembers),
      displayPosition: selectPreferredPosition(sortedMembers, DISPLAY_POSITION_KIND_PREFERENCE),
      routingAnchorPosition: selectPreferredPosition(sortedMembers, ROUTING_ANCHOR_KIND_PREFERENCE),
      memberIds: sortedMembers.map((m) => m.id),
      memberKinds: sortedMembers.map((m) => m.kind),
      memberCount: sortedMembers.length,
      passengerVisibleMemberCount,
      vehicleAnchorMemberCount,
      berthCountHint: passengerVisibleMemberCount > 0 ? passengerVisibleMemberCount : (vehicleAnchorMemberCount > 0 ? 1 : 0),
      source: 'osm' as const
    };
  });

  // Sort groups by ID to ensure stable output order
  return result.sort((a, b) => a.id.localeCompare(b.id));
}

