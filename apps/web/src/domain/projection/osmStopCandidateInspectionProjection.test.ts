import { describe, expect, it } from 'vitest';
import {
  projectOsmStopCandidateInspection,
  type OsmStopCandidateInspectionProjection
} from './osmStopCandidateInspectionProjection';
import type { OsmStopCandidateStreetAnchorResolution } from '../osm/osmStopCandidateAnchorTypes';
import { createOsmStopCandidateGroupId, createOsmStopCandidateId } from '../types/osmStopCandidate';
import type { OsmStopCandidateGroup } from '../types/osmStopCandidate';
import { createStopId } from '../types/stop';

const candidateGroupId = createOsmStopCandidateGroupId('osm-group:central');
const unknownCandidateGroupId = createOsmStopCandidateGroupId('osm-group:missing');

const candidateGroup: OsmStopCandidateGroup = {
  id: candidateGroupId,
  label: 'Central Station',
  displayPosition: { lng: 10.0001, lat: 53.5501 },
  routingAnchorPosition: { lng: 10.0002, lat: 53.5502 },
  memberIds: [createOsmStopCandidateId('osm-node:1')],
  memberKinds: ['bus-stop'],
  memberCount: 1,
  passengerVisibleMemberCount: 1,
  vehicleAnchorMemberCount: 0,
  berthCountHint: 1,
  source: 'osm'
};

const readyAnchor: OsmStopCandidateStreetAnchorResolution = {
  candidateGroupId,
  status: 'ready',
  source: 'street-snap',
  originalAnchorPosition: candidateGroup.routingAnchorPosition,
  streetAnchorPosition: { lng: 10.0003, lat: 53.5503 },
  distanceMeters: 12,
  streetLabelCandidate: 'Main Street',
  reason: 'Snapped to Main Street (12m).'
};

const reviewAnchor: OsmStopCandidateStreetAnchorResolution = {
  ...readyAnchor,
  status: 'review',
  distanceMeters: 48,
  reason: 'Snapped to Main Street (48m).'
};

const expectReadyProjection = (
  projection: OsmStopCandidateInspectionProjection
): Extract<OsmStopCandidateInspectionProjection, { readonly status: 'ready' }> => {
  if (projection.status !== 'ready') {
    throw new Error(`Expected ready projection, received ${projection.status}.`);
  }

  return projection;
};

describe('projectOsmStopCandidateInspection', () => {
  it('returns unavailable when candidate groups are not loaded', () => {
    const projection = projectOsmStopCandidateInspection({
      candidateGroups: null,
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: null,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    });

    expect(projection.status).toBe('unavailable');
    expect(projection.summaryLabel).toBe('OSM stop candidates unavailable');
  });

  it('returns no-selection when no candidate is selected', () => {
    const projection = projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: null,
      anchorResolution: null,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    });

    expect(projection.status).toBe('no-selection');
    expect(projection.summaryLabel).toBe('No OSM stop candidate selected');
  });

  it('returns not-found for an unknown selected candidate id', () => {
    const projection = projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: unknownCandidateGroupId,
      anchorResolution: null,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    });

    expect(projection.status).toBe('not-found');
  });

  it('returns candidate label, positions, readiness, and caveat for a selected candidate', () => {
    const projection = expectReadyProjection(projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: readyAnchor,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    }));

    expect(projection.displayLabel).toBe('Central Station');
    expect(projection.displayPosition).toEqual(candidateGroup.displayPosition);
    expect(projection.sourcePosition).toEqual(candidateGroup.routingAnchorPosition);
    expect(projection.streetAnchorPosition).toEqual(readyAnchor.streetAnchorPosition);
    expect(projection.adoptionReadinessLabel).toBe('Ready for adoption');
    expect(projection.caveat).toBe('Adoption is required before this can serve demand or be used in lines.');
  });

  it('reports not adoption-ready when the candidate has no ready street anchor', () => {
    const projection = expectReadyProjection(projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: null,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    }));

    expect(projection.canAdopt).toBe(false);
    expect(projection.adoptionReadiness).toBe('needs-street-anchor');
    expect(projection.adoptionReadinessLabel).toBe('Needs street anchor');
  });

  it('reports anchor review when the candidate street anchor is not ready', () => {
    const projection = expectReadyProjection(projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: reviewAnchor,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    }));

    expect(projection.canAdopt).toBe(false);
    expect(projection.adoptionReadiness).toBe('needs-anchor-review');
  });

  it('reports adoption-ready when the candidate has a ready street anchor', () => {
    const projection = expectReadyProjection(projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: readyAnchor,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    }));

    expect(projection.canAdopt).toBe(true);
    expect(projection.adoptionReadiness).toBe('ready-for-adoption');
  });

  it('keeps detail rows deterministic across repeated projection runs', () => {
    const first = expectReadyProjection(projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: readyAnchor,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    }));
    const second = expectReadyProjection(projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: readyAnchor,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    }));

    expect(second.detailRows).toEqual(first.detailRows);
  });

  it('reports an existing-stop blocker without counting the candidate as a stop', () => {
    const projection = expectReadyProjection(projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: readyAnchor,
      existingStops: [
        {
          id: createStopId('stop-1'),
          label: 'Existing Stop',
          position: { lng: 10.0003, lat: 53.5503 }
        }
      ],
      adoptedCandidateGroupIds: new Set()
    }));

    expect(projection.canAdopt).toBe(false);
    expect(projection.adoptionReadiness).toBe('blocked-by-existing-stop');
  });
});
