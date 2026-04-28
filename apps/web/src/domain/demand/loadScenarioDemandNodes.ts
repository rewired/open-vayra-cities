import {
  createDemandNodeId,
  createDemandWeight,
  type DemandNode,
  type DemandNodeId,
  type DemandWeight,
  type DemandNodeRole,
  type DemandClass
} from '../types/demandNode';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { TimeBandId } from '../types/timeBand';

/**
 * Represents the discriminated outcome of loading scenario-specific demand models.
 */
export interface LoadScenarioDemandResult {
  readonly status: 'loaded' | 'missing' | 'failed';
  readonly nodes: readonly DemandNode[];
  readonly message?: string;
}

interface UntrustedDemandNode {
  id?: unknown;
  label?: unknown;
  position?: unknown;
  role?: unknown;
  demandClass?: unknown;
  weightByTimeBand?: unknown;
}

interface UntrustedDemandPayload {
  schemaVersion?: unknown;
  scenarioId?: unknown;
  demandProfileId?: unknown;
  nodes?: unknown;
}

/**
 * Fetches and strictly validates demand profile configurations associated with active deployment zones.
 * 
 * @param scenarioId The unique scenario context requested for verification.
 */
export async function loadScenarioDemandNodes(scenarioId: string): Promise<LoadScenarioDemandResult> {
  try {
    const response = await fetch(`/generated/scenarios/${scenarioId}.demand.json`);
    
    if (response.status === 404) {
      return {
        status: 'missing',
        nodes: []
      };
    }

    if (!response.ok) {
      return {
        status: 'failed',
        message: `Server responded with code ${response.status}`,
        nodes: []
      };
    }

    const payload = (await response.json()) as UntrustedDemandPayload;

    if (!payload || typeof payload !== 'object') {
      return { status: 'failed', message: 'Payload is not a valid JSON object', nodes: [] };
    }

    if (!Array.isArray(payload.nodes)) {
      return { status: 'failed', message: 'Payload "nodes" field must be an array', nodes: [] };
    }

    const validatedNodes: DemandNode[] = [];

    for (let i = 0; i < payload.nodes.length; i++) {
      const rawNode = payload.nodes[i] as UntrustedDemandNode;

      if (!rawNode || typeof rawNode !== 'object') {
        return { status: 'failed', message: `Node at index ${i} is not an object`, nodes: [] };
      }

      if (typeof rawNode.id !== 'string' || !rawNode.id.trim()) {
        return { status: 'failed', message: `Node at index ${i} has missing/invalid id`, nodes: [] };
      }

      if (typeof rawNode.label !== 'string' || !rawNode.label.trim()) {
        return { status: 'failed', message: `Node at index ${i} has missing/invalid label`, nodes: [] };
      }

      const position = rawNode.position as Record<string, unknown> | null;
      if (
        !position ||
        typeof position !== 'object' ||
        typeof position.lng !== 'number' ||
        !Number.isFinite(position.lng) ||
        typeof position.lat !== 'number' ||
        !Number.isFinite(position.lat)
      ) {
        return { status: 'failed', message: `Node "${rawNode.id}" has invalid spatial coordinates`, nodes: [] };
      }

      if (rawNode.role !== 'origin' && rawNode.role !== 'destination') {
        return { status: 'failed', message: `Node "${rawNode.id}" role "${rawNode.role}" is unsupported`, nodes: [] };
      }

      if (rawNode.demandClass !== 'residential' && rawNode.demandClass !== 'workplace') {
        return { status: 'failed', message: `Node "${rawNode.id}" demandClass "${rawNode.demandClass}" is unsupported`, nodes: [] };
      }

      // MVP Rule: residential -> origin, workplace -> destination
      if (rawNode.demandClass === 'residential' && rawNode.role !== 'origin') {
        return { status: 'failed', message: `Node "${rawNode.id}" pairs residential class with non-origin role`, nodes: [] };
      }
      if (rawNode.demandClass === 'workplace' && rawNode.role !== 'destination') {
        return { status: 'failed', message: `Node "${rawNode.id}" pairs workplace class with non-destination role`, nodes: [] };
      }

      const weightByTimeBand = rawNode.weightByTimeBand as Record<string, unknown> | null;
      if (!weightByTimeBand || typeof weightByTimeBand !== 'object') {
        return { status: 'failed', message: `Node "${rawNode.id}" weight map missing`, nodes: [] };
      }

      // Check that all required MVP timebands are present
      for (const timeBandId of MVP_TIME_BAND_IDS) {
        const weight = weightByTimeBand[timeBandId];
        if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0) {
          return {
            status: 'failed',
            message: `Node "${rawNode.id}" missing/invalid weight for mandatory band "${timeBandId}"`,
            nodes: []
          };
        }
      }

      // Reject unknown timebands
      const weightKeys = Object.keys(weightByTimeBand);
      for (const key of weightKeys) {
        if (!MVP_TIME_BAND_IDS.includes(key as TimeBandId)) {
          return {
            status: 'failed',
            message: `Node "${rawNode.id}" contains forbidden custom band key "${key}"`,
            nodes: []
          };
        }
      }

      const weightMap = {} as Record<TimeBandId, DemandWeight>;
      for (const timeBandId of MVP_TIME_BAND_IDS) {
        weightMap[timeBandId] = createDemandWeight(weightByTimeBand[timeBandId] as number);
      }

      validatedNodes.push({
        id: createDemandNodeId(rawNode.id),
        label: rawNode.label,
        position: { lng: position.lng, lat: position.lat },
        role: rawNode.role as DemandNodeRole,
        demandClass: rawNode.demandClass as DemandClass,
        weightByTimeBand: weightMap
      });
    }

    return {
      status: 'loaded',
      nodes: validatedNodes
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown catastrophic loading failure',
      nodes: []
    };
  }
}
