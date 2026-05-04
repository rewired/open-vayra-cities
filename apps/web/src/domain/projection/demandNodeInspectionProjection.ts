import type { TimeBandId } from '../types/timeBand';
import type { ScenarioDemandArtifact, ScenarioDemandNode } from '../types/scenarioDemand';
import type { ScenarioDemandNodeRole } from '../constants/scenarioDemand';
import type { ScenarioDemandCaptureProjection } from './scenarioDemandCaptureProjection';
import type { ServedDemandProjection } from './servedDemandProjection';
import { calculateGreatCircleDistanceMeters } from '../../lib/geometry';
import { calculateActiveDemandWeight } from './demandWeight';
import { DEMAND_GAP_OD_CONTEXT_MAX_CANDIDATES } from '../constants/scenarioDemand';
import { TIME_BAND_DISPLAY_LABELS } from '../constants/timeBands';
import type { FocusedDemandGapPlanningEvidenceItem } from './focusedDemandGapPlanningProjection';

/** Status of the demand node inspection projection. */
export type DemandNodeInspectionStatus = 'unavailable' | 'ready';

/** 
 * Problem classification for a demand node based on its capture and service state. 
 * 'context-only' is used when the node itself isn't a problem but provides context for others.
 */
export type DemandNodeInspectionProblemStatus =
  | 'not-captured'
  | 'captured-unserved'
  | 'captured-unreachable-destination'
  | 'captured-and-served'
  | 'context-only';

/** Represents a candidate node providing context for the selected demand node. */
export interface DemandNodeInspectionContextCandidate {
  readonly ordinal: number;
  readonly candidateId: string;
  readonly label: string;
  readonly roleLabel: string;
  readonly demandClassLabel: string;
  readonly activeWeightLabel: string;
  readonly distanceLabel: string;
  readonly position: { readonly lng: number; readonly lat: number };
}

/** 
 * Pure projection module for inspecting a single selected demand node's planning context. 
 * This module does not perform passenger-flow simulation or exact OD trip matching.
 */
export interface DemandNodeInspectionProjection {
  readonly status: DemandNodeInspectionStatus;
  readonly selectedNodeId: string | null;
  readonly inspectedTimeBandId: TimeBandId | null;
  readonly inspectedTimeBandLabel: string | null;
  readonly followsSimulationTimeBand: boolean;
  readonly title: string | null;
  readonly summary: string | null;
  readonly problemStatus: DemandNodeInspectionProblemStatus | null;
  readonly primaryAction: string | null;
  readonly caveat: string | null;
  readonly evidence: readonly FocusedDemandGapPlanningEvidenceItem[];
  readonly contextCandidates: readonly DemandNodeInspectionContextCandidate[];
  readonly selectedNodePosition: { readonly lng: number; readonly lat: number } | null;
  readonly selectedNodeRole: ScenarioDemandNodeRole | null;
}

interface ProjectDemandNodeInspectionInput {
  readonly artifact: ScenarioDemandArtifact | null;
  readonly selectedNodeId: string | null;
  readonly inspectedTimeBandId: TimeBandId;
  readonly followsSimulationTimeBand: boolean;
  readonly scenarioDemandCaptureProjection: ScenarioDemandCaptureProjection;
  readonly servedDemandProjection: ServedDemandProjection;
}

const createUnavailableProjection = (
  selectedNodeId: string | null,
  inspectedTimeBandId: TimeBandId | null,
  followsSimulationTimeBand: boolean
): DemandNodeInspectionProjection => ({
  status: 'unavailable',
  selectedNodeId,
  inspectedTimeBandId,
  inspectedTimeBandLabel: inspectedTimeBandId ? TIME_BAND_DISPLAY_LABELS[inspectedTimeBandId] : null,
  followsSimulationTimeBand,
  title: null,
  summary: null,
  problemStatus: null,
  primaryAction: null,
  caveat: null,
  evidence: [],
  contextCandidates: [],
  selectedNodePosition: null,
  selectedNodeRole: null
});

/**
 * Derives a planning-centric inspection projection for a single selected scenario demand node.
 * 
 * @param input Projection inputs including scenario artifact, selection state, and existing projections.
 */
export function projectDemandNodeInspection(
  input: ProjectDemandNodeInspectionInput
): DemandNodeInspectionProjection {
  const {
    artifact,
    selectedNodeId,
    inspectedTimeBandId,
    followsSimulationTimeBand,
    scenarioDemandCaptureProjection,
    servedDemandProjection
  } = input;

  if (!artifact || !selectedNodeId) {
    return createUnavailableProjection(selectedNodeId, inspectedTimeBandId, followsSimulationTimeBand);
  }

  const selectedNode = artifact.nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNode) {
    return createUnavailableProjection(selectedNodeId, inspectedTimeBandId, followsSimulationTimeBand);
  }

  const activeWeight = calculateActiveDemandWeight(selectedNode, inspectedTimeBandId);
  const isOrigin = selectedNode.role === 'origin';
  const roleLabel = isOrigin ? 'Residential origin' : 'Workplace destination';
  
  const title = isOrigin ? 'Residential demand node' : 'Workplace demand node';
  const summary = `${roleLabel} node "${selectedNode.id}" with base weight ${selectedNode.baseWeight.toFixed(1)}.`;

  // 1. Resolve Problem Status
  let problemStatus: DemandNodeInspectionProblemStatus = 'context-only';
  let primaryAction: string | null = null;

  if (scenarioDemandCaptureProjection.status === 'ready' && servedDemandProjection.status === 'ready') {
    const capturingStop = scenarioDemandCaptureProjection.nearestStopByEntityId.get(selectedNodeId);
    
    if (!capturingStop) {
      problemStatus = 'not-captured';
      primaryAction = isOrigin 
        ? 'Place a stop near this residential demand.' 
        : 'Place a stop near this workplace destination.';
    } else {
      const isServed = isOrigin 
        ? servedDemandProjection.servedResidentialNodeIds.has(selectedNodeId)
        : servedDemandProjection.reachableWorkplaceNodeIds.has(selectedNodeId);

      if (isServed) {
        problemStatus = 'captured-and-served';
        primaryAction = isOrigin 
          ? 'This origin appears served in the inspected time band.' 
          : 'This destination appears reachable in the inspected time band.';
      } else {
        if (isOrigin) {
          problemStatus = 'captured-unserved';
          primaryAction = 'Connect this captured origin toward a workplace candidate with active service.';
        } else {
          problemStatus = 'captured-unreachable-destination';
          primaryAction = 'Connect likely residential origins toward this workplace with active service.';
        }
      }
    }
  }

  // 2. Resolve Context Candidates
  const isWorkplaceDestinationNode = (
    node: ScenarioDemandNode
  ): node is ScenarioDemandNode & { readonly role: 'destination'; readonly class: 'workplace' } => {
    return node.role === 'destination' && node.class === 'workplace';
  };

  const isResidentialOriginNode = (
    node: ScenarioDemandNode
  ): node is ScenarioDemandNode & { readonly role: 'origin'; readonly class: 'residential' } => {
    return node.role === 'origin' && node.class === 'residential';
  };

  const candidateNodes = isOrigin
    ? artifact.nodes.filter(isWorkplaceDestinationNode)
    : artifact.nodes.filter(isResidentialOriginNode);

  const rawCandidates: Array<{ node: ScenarioDemandNode; activeWeight: number; distanceMeters: number }> = [];

  for (const node of candidateNodes) {
    const nodeActiveWeight = calculateActiveDemandWeight(node, inspectedTimeBandId);
    if (nodeActiveWeight <= 0) continue;

    const distanceMeters = calculateGreatCircleDistanceMeters(
      [selectedNode.position.lng, selectedNode.position.lat],
      [node.position.lng, node.position.lat]
    );

    rawCandidates.push({
      node,
      activeWeight: nodeActiveWeight,
      distanceMeters
    });
  }

  // Sort candidates deterministically:
  // 1. Descending active weight
  // 2. Ascending distance
  // 3. Ascending stable ID
  rawCandidates.sort((a, b) => {
    if (b.activeWeight !== a.activeWeight) {
      return b.activeWeight - a.activeWeight;
    }
    if (a.distanceMeters !== b.distanceMeters) {
      return a.distanceMeters - b.distanceMeters;
    }
    return a.node.id.localeCompare(b.node.id);
  });

  const contextCandidates: DemandNodeInspectionContextCandidate[] = rawCandidates
    .slice(0, DEMAND_GAP_OD_CONTEXT_MAX_CANDIDATES)
    .map((item, index) => ({
      ordinal: index + 1,
      candidateId: item.node.id,
      label: item.node.id, // Using ID as label for now
      roleLabel: item.node.role === 'origin' ? 'Origin' : 'Destination',
      demandClassLabel: item.node.class,
      activeWeightLabel: item.activeWeight.toFixed(1),
      distanceLabel: item.distanceMeters < 1000 
        ? `${Math.round(item.distanceMeters)}m` 
        : `${(item.distanceMeters / 1000).toFixed(1)}km`,
      position: item.node.position
    }));

  const evidence: FocusedDemandGapPlanningEvidenceItem[] = [
    { label: 'Role', value: roleLabel },
    { label: 'Time band', value: TIME_BAND_DISPLAY_LABELS[inspectedTimeBandId] },
    { label: 'Active weight', value: activeWeight.toFixed(1) },
    { label: 'Capture status', value: problemStatus === 'not-captured' ? 'Uncaptured' : 'Captured' }
  ];

  return {
    status: 'ready',
    selectedNodeId: selectedNode.id,
    inspectedTimeBandId,
    inspectedTimeBandLabel: TIME_BAND_DISPLAY_LABELS[inspectedTimeBandId],
    followsSimulationTimeBand,
    title,
    summary,
    problemStatus,
    primaryAction,
    caveat: 'Context candidates are planning hints from generated scenario demand, not exact passenger flows.',
    evidence,
    contextCandidates,
    selectedNodePosition: selectedNode.position,
    selectedNodeRole: selectedNode.role
  };
}
