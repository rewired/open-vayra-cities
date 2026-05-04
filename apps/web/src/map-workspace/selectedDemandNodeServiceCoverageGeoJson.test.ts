import { describe, expect, it } from 'vitest';

import { createLineId } from '../domain/types/line';
import { createStopId, type StopId, type StopPosition } from '../domain/types/stop';
import type {
  SelectedDemandNodeCoverageStopSummary,
  SelectedDemandNodeServiceCoverageProjection
} from '../domain/projection/selectedDemandNodeServiceCoverageProjection';
import { buildSelectedDemandNodeServiceCoverageFeatureCollection } from './selectedDemandNodeServiceCoverageGeoJson';

const makeStopSummary = (
  rawStopId: string,
  label: string,
  position: StopPosition
): SelectedDemandNodeCoverageStopSummary => ({
  stopId: createStopId(rawStopId),
  label,
  position,
  distanceMeters: 100,
  distanceLabel: '100m'
});

const selectedStop = makeStopSummary('stop-selected', 'Selected Stop', { lng: 10, lat: 50 });
const selectedStopTwo = makeStopSummary('stop-selected-2', 'Selected Stop 2', { lng: 10.001, lat: 50 });
const oppositeStop = makeStopSummary('stop-opposite', 'Opposite Stop', { lng: 10.01, lat: 50.01 });
const duplicateStop = makeStopSummary('stop-duplicate', 'Duplicate Stop', { lng: 10.02, lat: 50.02 });

const makeProjection = (
  overrides: Partial<SelectedDemandNodeServiceCoverageProjection> = {}
): SelectedDemandNodeServiceCoverageProjection => ({
  status: 'covered-no-line',
  selectedNodeId: 'node-selected',
  selectedNodeRole: 'origin',
  inspectedTimeBandId: 'morning-rush',
  inspectedTimeBandLabel: 'Morning Rush',
  accessRadiusMeters: 400,
  summaryLabel: 'Covered by stops, but no connecting line',
  reason: 'Nearby stops cover this node, but no completed bus line includes a covering stop.',
  coveringStops: [selectedStop],
  candidateMatches: [],
  connectingLines: [],
  activeLines: [],
  diagnostics: {
    selectedSideCoveringStopCount: 1,
    hiddenSelectedSideCoveringStopCount: 0,
    oppositeCandidateWithStopCoverageCount: 0,
    hiddenOppositeCandidateMatchCount: 0,
    lineWithSelectedSideStopCount: 0,
    structurallyConnectingLineCount: 0,
    hiddenStructurallyConnectingLineCount: 0,
    activeConnectingLineCount: 0,
    hiddenActiveConnectingLineCount: 0
  },
  caveat: 'This is a planning projection, not observed travel behavior.',
  ...overrides
});

const makeLineSummary = (input: {
  readonly selectedSideStopIds: readonly StopId[];
  readonly oppositeSideStopIds: readonly StopId[];
}) => ({
  lineId: createLineId('line-1'),
  label: 'Line 1',
  topologyLabel: 'Linear',
  servicePatternLabel: 'One-way',
  serviceLabel: '10 min headway',
  selectedSideStopIds: input.selectedSideStopIds,
  selectedSideStopLabels: ['Selected Stop'],
  oppositeSideStopIds: input.oppositeSideStopIds,
  oppositeSideStopLabels: ['Opposite Stop']
});

const requireFirstFeature = (
  features: ReturnType<typeof buildSelectedDemandNodeServiceCoverageFeatureCollection>['features']
) => {
  const [feature] = features;
  if (!feature) {
    throw new Error('Expected at least one feature.');
  }

  return feature;
};

describe('buildSelectedDemandNodeServiceCoverageFeatureCollection', () => {
  it('returns empty FeatureCollection for unavailable projection input', () => {
    expect(buildSelectedDemandNodeServiceCoverageFeatureCollection(null)).toEqual({
      type: 'FeatureCollection',
      features: []
    });

    const result = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        status: 'unavailable',
        coveringStops: [],
        candidateMatches: [],
        connectingLines: [],
        activeLines: []
      })
    );

    expect(result.features).toEqual([]);
  });

  it('returns empty FeatureCollection for no selected node and no stop coverage states', () => {
    const noSelected = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        status: 'no-selected-node',
        selectedNodeId: null,
        selectedNodeRole: null,
        coveringStops: []
      })
    );
    const noStopCoverage = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        status: 'no-stop-coverage',
        coveringStops: []
      })
    );

    expect(noSelected.features).toEqual([]);
    expect(noStopCoverage.features).toEqual([]);
  });

  it('builds selected-side stop point features with stable properties', () => {
    const result = buildSelectedDemandNodeServiceCoverageFeatureCollection(makeProjection());
    const feature = requireFirstFeature(result.features);

    expect(feature.geometry).toEqual({
      type: 'Point',
      coordinates: [10, 50]
    });
    expect(feature.properties).toEqual({
      stopId: selectedStop.stopId,
      label: 'Selected Stop',
      role: 'selected-side-stop',
      coverageStatus: 'coverage-only',
      ordinal: 1
    });
  });

  it('builds opposite-side stop point features with a distinguishable role', () => {
    const result = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        candidateMatches: [
          {
            candidateId: 'node-work',
            label: 'Workplace',
            distanceLabel: '500m',
            coveringStops: [oppositeStop],
            connectingLineLabels: []
          }
        ]
      })
    );

    expect(result.features.map((feature) => feature.properties.role)).toEqual([
      'selected-side-stop',
      'opposite-side-stop'
    ]);
    expect(result.features.map((feature) => feature.properties.stopId)).toEqual([
      selectedStop.stopId,
      oppositeStop.stopId
    ]);
  });

  it('reflects structural and active service stop status from projection line summaries', () => {
    const structuralLine = makeLineSummary({
      selectedSideStopIds: [selectedStop.stopId],
      oppositeSideStopIds: [oppositeStop.stopId]
    });
    const result = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        status: 'served-by-active-line',
        candidateMatches: [
          {
            candidateId: 'node-work',
            label: 'Workplace',
            distanceLabel: '500m',
            coveringStops: [oppositeStop],
            connectingLineLabels: ['Line 1']
          }
        ],
        connectingLines: [structuralLine],
        activeLines: [structuralLine]
      })
    );

    expect(result.features.map((feature) => feature.properties.coverageStatus)).toEqual([
      'active-service',
      'active-service'
    ]);

    const structuralOnly = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        status: 'line-no-active-service',
        candidateMatches: [
          {
            candidateId: 'node-work',
            label: 'Workplace',
            distanceLabel: '500m',
            coveringStops: [oppositeStop],
            connectingLineLabels: ['Line 1']
          }
        ],
        connectingLines: [structuralLine],
        activeLines: []
      })
    );

    expect(structuralOnly.features.map((feature) => feature.properties.coverageStatus)).toEqual([
      'structural-connection',
      'structural-connection'
    ]);
  });

  it('deduplicates stops deterministically and preserves the highest projected status', () => {
    const structuralLine = makeLineSummary({
      selectedSideStopIds: [],
      oppositeSideStopIds: [duplicateStop.stopId]
    });
    const result = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        coveringStops: [duplicateStop],
        candidateMatches: [
          {
            candidateId: 'node-work',
            label: 'Workplace',
            distanceLabel: '500m',
            coveringStops: [duplicateStop],
            connectingLineLabels: ['Line 1']
          }
        ],
        connectingLines: [structuralLine],
        activeLines: [structuralLine]
      })
    );

    expect(result.features).toHaveLength(1);
    expect(requireFirstFeature(result.features).properties).toEqual({
      stopId: duplicateStop.stopId,
      label: 'Duplicate Stop',
      role: 'selected-side-stop',
      coverageStatus: 'active-service',
      ordinal: 1
    });
  });

  it('keeps feature order and ordinals deterministic after deduplication', () => {
    const result = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      makeProjection({
        coveringStops: [selectedStopTwo, selectedStop],
        candidateMatches: [
          {
            candidateId: 'node-work',
            label: 'Workplace',
            distanceLabel: '500m',
            coveringStops: [oppositeStop, selectedStop],
            connectingLineLabels: []
          }
        ]
      })
    );

    expect(result.features.map((feature) => feature.properties.stopId)).toEqual([
      selectedStopTwo.stopId,
      selectedStop.stopId,
      oppositeStop.stopId
    ]);
    expect(result.features.map((feature) => feature.properties.ordinal)).toEqual([1, 2, 3]);
  });
});
