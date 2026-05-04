// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { projectOsmStopCandidateInspection } from '../domain/projection/osmStopCandidateInspectionProjection';
import type { OsmStopCandidateStreetAnchorResolution } from '../domain/osm/osmStopCandidateAnchorTypes';
import { createOsmStopCandidateGroupId, createOsmStopCandidateId } from '../domain/types/osmStopCandidate';
import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import { OsmStopCandidateInspector } from './OsmStopCandidateInspector';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface RenderResult {
  readonly container: HTMLDivElement;
  readonly root: Root;
}

const candidateGroupId = createOsmStopCandidateGroupId('osm-group:central');

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

const renderInspector = (
  projection: ReturnType<typeof projectOsmStopCandidateInspection>,
  group: OsmStopCandidateGroup | null,
  anchor: OsmStopCandidateStreetAnchorResolution | null
): RenderResult => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <OsmStopCandidateInspector
        projection={projection}
        candidateGroup={group}
        anchorResolution={anchor}
        onAdopt={vi.fn()}
      />
    );
  });

  return { container, root };
};

let mounted: RenderResult | null = null;

afterEach(() => {
  if (!mounted) {
    return;
  }

  act(() => {
    mounted?.root.unmount();
  });
  mounted.container.remove();
  mounted = null;
});

describe('OsmStopCandidateInspector', () => {
  it('renders selected OSM candidate identity and non-canonical copy', () => {
    const projection = projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: readyAnchor,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    });

    mounted = renderInspector(projection, candidateGroup, readyAnchor);

    expect(mounted.container.textContent).toContain('OSM stop candidate');
    expect(mounted.container.textContent).toContain('Central Station');
    expect(mounted.container.textContent).toContain('Not yet a game stop');
  });

  it('renders adoption readiness status and explicit demand/line caveat', () => {
    const projection = projectOsmStopCandidateInspection({
      candidateGroups: [candidateGroup],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: readyAnchor,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    });

    mounted = renderInspector(projection, candidateGroup, readyAnchor);

    expect(mounted.container.textContent).toContain('Ready for adoption');
    expect(mounted.container.textContent).toContain(
      'Adoption is required before this can serve demand or be used in lines.'
    );
  });

  it('renders unavailable state safely', () => {
    const projection = projectOsmStopCandidateInspection({
      candidateGroups: null,
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: null,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    });

    mounted = renderInspector(projection, null, null);

    expect(mounted.container.textContent).toContain('OSM stop candidate');
    expect(mounted.container.textContent).toContain('OSM stop candidates unavailable');
  });

  it('renders not-found state safely', () => {
    const projection = projectOsmStopCandidateInspection({
      candidateGroups: [],
      selectedCandidateGroupId: candidateGroupId,
      anchorResolution: null,
      existingStops: [],
      adoptedCandidateGroupIds: new Set()
    });

    mounted = renderInspector(projection, null, null);

    expect(mounted.container.textContent).toContain('Selected OSM stop candidate not found');
    expect(mounted.container.textContent).toContain(
      'Adoption is required before this can serve demand or be used in lines.'
    );
  });
});
