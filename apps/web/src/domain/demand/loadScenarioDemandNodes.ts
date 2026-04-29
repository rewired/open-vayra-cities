import {
  createDemandNodeId,
  createDemandWeight,
  createZeroDemandWeightByTimeBand,
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

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDemandNodeRole(value: unknown): value is DemandNodeRole {
  return value === 'origin' || value === 'destination';
}

function isDemandClass(value: unknown): value is DemandClass {
  return value === 'residential' || value === 'workplace';
}

const MVP_TIME_BAND_ID_SET: ReadonlySet<string> = new Set(MVP_TIME_BAND_IDS);

function isCanonicalTimeBandId(value: string): value is TimeBandId {
  return MVP_TIME_BAND_ID_SET.has(value);
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

    const payload: unknown = await response.json();

    if (!isRecord(payload)) {
      return { status: 'failed', message: 'Payload is not a valid JSON object', nodes: [] };
    }

    const nodes = payload.nodes;
    if (!Array.isArray(nodes)) {
      return { status: 'failed', message: 'Payload "nodes" field must be an array', nodes: [] };
    }

    const validatedNodes: DemandNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const rawNode: unknown = nodes[i];

      if (!isRecord(rawNode)) {
        return { status: 'failed', message: `Node at index ${i} is not an object`, nodes: [] };
      }

      const id = rawNode.id;
      if (typeof id !== 'string' || !id.trim()) {
        return { status: 'failed', message: `Node at index ${i} has missing/invalid id`, nodes: [] };
      }

      const label = rawNode.label;
      if (typeof label !== 'string' || !label.trim()) {
        return { status: 'failed', message: `Node at index ${i} has missing/invalid label`, nodes: [] };
      }

      const position = rawNode.position;
      if (
        !isRecord(position) ||
        typeof position.lng !== 'number' ||
        !Number.isFinite(position.lng) ||
        typeof position.lat !== 'number' ||
        !Number.isFinite(position.lat)
      ) {
        return { status: 'failed', message: `Node "${id}" has invalid spatial coordinates`, nodes: [] };
      }

      const role = rawNode.role;
      if (!isDemandNodeRole(role)) {
        return { status: 'failed', message: `Node "${id}" role "${role}" is unsupported`, nodes: [] };
      }

      const demandClass = rawNode.demandClass;
      if (!isDemandClass(demandClass)) {
        return { status: 'failed', message: `Node "${id}" demandClass "${demandClass}" is unsupported`, nodes: [] };
      }

      // MVP Rule: residential -> origin, workplace -> destination
      if (demandClass === 'residential' && role !== 'origin') {
        return { status: 'failed', message: `Node "${id}" pairs residential class with non-origin role`, nodes: [] };
      }
      if (demandClass === 'workplace' && role !== 'destination') {
        return { status: 'failed', message: `Node "${id}" pairs workplace class with non-destination role`, nodes: [] };
      }

      const weightByTimeBand = rawNode.weightByTimeBand;
      if (!isRecord(weightByTimeBand)) {
        return { status: 'failed', message: `Node "${id}" weight map missing`, nodes: [] };
      }

      // Check that all required MVP timebands are present
      for (const timeBandId of MVP_TIME_BAND_IDS) {
        const weight = weightByTimeBand[timeBandId];
        if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0) {
          return {
            status: 'failed',
            message: `Node "${id}" missing/invalid weight for mandatory band "${timeBandId}"`,
            nodes: []
          };
        }
      }

      // Reject unknown timebands
      const weightKeys = Object.keys(weightByTimeBand);
      for (const key of weightKeys) {
        if (!isCanonicalTimeBandId(key)) {
          return {
            status: 'failed',
            message: `Node "${id}" contains forbidden custom band key "${key}"`,
            nodes: []
          };
        }
      }

      // Build weight map safely
      const weightMap = createZeroDemandWeightByTimeBand();
      for (const timeBandId of MVP_TIME_BAND_IDS) {
        const weight = weightByTimeBand[timeBandId];
        // We already validated that weight is a finite non-negative number
        if (typeof weight === 'number') {
          weightMap[timeBandId] = createDemandWeight(weight);
        }
      }

      validatedNodes.push({
        id: createDemandNodeId(id),
        label,
        position: { lng: position.lng, lat: position.lat },
        role,
        demandClass,
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
