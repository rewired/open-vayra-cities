import type {
  ScenarioDemandArtifact,
  ScenarioDemandSourceEntry,
  ScenarioDemandSourceMetadata,
  ScenarioDemandNode,
  ScenarioDemandAttractor,
  ScenarioDemandGateway,
  ScenarioDemandPosition,
  ScenarioDemandSourceKind,
  ScenarioDemandNodeRole,
  ScenarioDemandNodeClass,
  ScenarioDemandAttractorCategory,
  ScenarioDemandScale,
  ScenarioDemandGatewayKind
} from '../types/scenarioDemand';
import {
  ALLOWED_DEMAND_NODE_ROLES,
  ALLOWED_DEMAND_NODE_CLASSES,
  ALLOWED_ATTRACTOR_CATEGORIES,
  ALLOWED_DEMAND_SCALES,
  ALLOWED_GATEWAY_KINDS,
  ALLOWED_DEMAND_SOURCE_KINDS
} from '../constants/scenarioDemand';
import type { TimeBandId } from '../types/timeBand';

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isScenarioDemandSourceKind(value: unknown): value is ScenarioDemandSourceKind {
  return typeof value === 'string' && (ALLOWED_DEMAND_SOURCE_KINDS as readonly string[]).includes(value);
}

function isScenarioDemandNodeRole(value: unknown): value is ScenarioDemandNodeRole {
  return typeof value === 'string' && (ALLOWED_DEMAND_NODE_ROLES as readonly string[]).includes(value);
}

function isScenarioDemandNodeClass(value: unknown): value is ScenarioDemandNodeClass {
  return typeof value === 'string' && (ALLOWED_DEMAND_NODE_CLASSES as readonly string[]).includes(value);
}

function isScenarioDemandAttractorCategory(value: unknown): value is ScenarioDemandAttractorCategory {
  return typeof value === 'string' && (ALLOWED_ATTRACTOR_CATEGORIES as readonly string[]).includes(value);
}

function isScenarioDemandScale(value: unknown): value is ScenarioDemandScale {
  return typeof value === 'string' && (ALLOWED_DEMAND_SCALES as readonly string[]).includes(value);
}

function isScenarioDemandGatewayKind(value: unknown): value is ScenarioDemandGatewayKind {
  return typeof value === 'string' && (ALLOWED_GATEWAY_KINDS as readonly string[]).includes(value);
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value === 'number' && !Number.isFinite(value)) return false;
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (typeof value === 'object') {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      return false;
    }
    return Object.entries(value).every(([key, val]) => typeof key === 'string' && isJsonValue(val));
  }
  return false;
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

/**
 * Validates an untrusted payload against the ScenarioDemandArtifact schema.
 * 
 * @param payload Untrusted raw JSON object.
 * @throws Error upon structural or value constraints violations.
 */
export function parseScenarioDemandArtifact(payload: unknown): ScenarioDemandArtifact {
  if (!isRecord(payload)) {
    throw new Error('Scenario demand artifact must be a valid JSON object.');
  }

  const schemaVersion = payload.schemaVersion;
  if (typeof schemaVersion !== 'number') {
    throw new Error('Demand artifact missing numeric schemaVersion.');
  }

  const scenarioId = payload.scenarioId;
  if (typeof scenarioId !== 'string') {
    throw new Error('Demand artifact missing string scenarioId.');
  }

  const generatedAt = payload.generatedAt;
  if (typeof generatedAt !== 'string') {
    throw new Error('Demand artifact missing string generatedAt.');
  }

  const rawMeta = payload.sourceMetadata;
  if (!isRecord(rawMeta)) {
    throw new Error('Demand artifact missing sourceMetadata object.');
  }

  const generatorName = rawMeta.generatorName;
  if (typeof generatorName !== 'string') {
    throw new Error('sourceMetadata missing string generatorName.');
  }

  const generatorVersion = rawMeta.generatorVersion;
  if (typeof generatorVersion !== 'string') {
    throw new Error('sourceMetadata missing string generatorVersion.');
  }

  const notes = rawMeta.notes;
  if (notes !== undefined && typeof notes !== 'string') {
    throw new Error('sourceMetadata notes must be a string.');
  }

  const generatedFrom = rawMeta.generatedFrom;
  if (!Array.isArray(generatedFrom)) {
    throw new Error('sourceMetadata missing generatedFrom array.');
  }

  const parsedGeneratedFrom: ScenarioDemandSourceEntry[] = [];
  for (let i = 0; i < generatedFrom.length; i++) {
    const entry = generatedFrom[i];
    if (!isRecord(entry)) {
      throw new Error(`generatedFrom entry at index ${i} is not an object.`);
    }

    const sourceKind = entry.sourceKind;
    if (!isScenarioDemandSourceKind(sourceKind)) {
      throw new Error(`generatedFrom entry at index ${i} holds invalid sourceKind.`);
    }

    const label = entry.label;
    if (typeof label !== 'string') {
      throw new Error(`generatedFrom entry at index ${i} missing string label.`);
    }

    const sourceDate = entry.sourceDate;
    if (sourceDate !== undefined && typeof sourceDate !== 'string') {
      throw new Error(`generatedFrom entry at index ${i} sourceDate must be a string.`);
    }

    const datasetYear = entry.datasetYear;
    if (datasetYear !== undefined && !isFiniteNumber(datasetYear)) {
      throw new Error(`generatedFrom entry at index ${i} datasetYear must be a finite number.`);
    }

    const licenseHint = entry.licenseHint;
    if (licenseHint !== undefined && typeof licenseHint !== 'string') {
      throw new Error(`generatedFrom entry at index ${i} licenseHint must be a string.`);
    }

    const attributionHint = entry.attributionHint;
    if (attributionHint !== undefined && typeof attributionHint !== 'string') {
      throw new Error(`generatedFrom entry at index ${i} attributionHint must be a string.`);
    }

    parsedGeneratedFrom.push({
      sourceKind,
      label,
      ...(sourceDate !== undefined ? { sourceDate } : {}),
      ...(datasetYear !== undefined ? { datasetYear } : {}),
      ...(licenseHint !== undefined ? { licenseHint } : {}),
      ...(attributionHint !== undefined ? { attributionHint } : {})
    });
  }

  const sourceMetadata: ScenarioDemandSourceMetadata = {
    generatedFrom: parsedGeneratedFrom,
    generatorName,
    generatorVersion,
    ...(notes !== undefined ? { notes } : {})
  };

  const rawNodes = payload.nodes;
  if (!Array.isArray(rawNodes)) {
    throw new Error('Demand artifact missing nodes array.');
  }

  const rawAttractors = payload.attractors;
  if (!Array.isArray(rawAttractors)) {
    throw new Error('Demand artifact missing attractors array.');
  }

  const rawGateways = payload.gateways;
  if (!Array.isArray(rawGateways)) {
    throw new Error('Demand artifact missing gateways array.');
  }

  const knownIds = new Set<string>();

  const parsePosition = (pos: unknown, entityId: string, entityType: string): ScenarioDemandPosition => {
    if (!isRecord(pos)) {
      throw new Error(`${entityType} ${entityId} missing position object.`);
    }
    const lng = pos.lng;
    if (!isFiniteNumber(lng)) {
      throw new Error(`${entityType} ${entityId} position lng must be a finite number.`);
    }
    const lat = pos.lat;
    if (!isFiniteNumber(lat)) {
      throw new Error(`${entityType} ${entityId} position lat must be a finite number.`);
    }
    return { lng, lat };
  };

  const parseTimeBandWeights = (weights: unknown, entityId: string, entityType: string): Readonly<Record<TimeBandId, number>> => {
    if (!isRecord(weights)) {
      throw new Error(`${entityType} ${entityId} missing timeBandWeights object.`);
    }

    const getWeight = (bandId: TimeBandId): number => {
      const val = weights[bandId];
      if (!isNonNegativeFiniteNumber(val)) {
        throw new Error(`${entityType} ${entityId} missing or invalid non-negative weight for time band ${bandId}.`);
      }
      return val;
    };

    return {
      'morning-rush': getWeight('morning-rush'),
      'late-morning': getWeight('late-morning'),
      'midday': getWeight('midday'),
      'afternoon': getWeight('afternoon'),
      'evening-rush': getWeight('evening-rush'),
      'evening': getWeight('evening'),
      'night': getWeight('night')
    };
  };

  const nodes: ScenarioDemandNode[] = [];
  for (let i = 0; i < rawNodes.length; i++) {
    const n = rawNodes[i];
    if (!isRecord(n)) {
      throw new Error(`Node at index ${i} is not an object.`);
    }

    const id = n.id;
    if (typeof id !== 'string') {
      throw new Error(`Node at index ${i} missing string id.`);
    }

    if (knownIds.has(id)) {
      throw new Error(`Duplicate entity ID detected: ${id}`);
    }
    knownIds.add(id);

    const position = parsePosition(n.position, id, 'Node');

    const role = n.role;
    if (!isScenarioDemandNodeRole(role)) {
      throw new Error(`Node ${id} holds invalid role.`);
    }

    const nodeClass = n.class;
    if (!isScenarioDemandNodeClass(nodeClass)) {
      throw new Error(`Node ${id} holds invalid class.`);
    }

    const baseWeight = n.baseWeight;
    if (!isNonNegativeFiniteNumber(baseWeight)) {
      throw new Error(`Node ${id} requires non-negative numeric baseWeight.`);
    }

    const timeBandWeights = parseTimeBandWeights(n.timeBandWeights, id, 'Node');

    const sourceTrace = n.sourceTrace;
    if (sourceTrace !== undefined && !isJsonRecord(sourceTrace)) {
      throw new Error(`Node ${id} holds invalid sourceTrace.`);
    }

    nodes.push({
      id,
      position,
      role,
      class: nodeClass,
      baseWeight,
      timeBandWeights,
      ...(sourceTrace !== undefined ? { sourceTrace } : {})
    });
  }

  const attractors: ScenarioDemandAttractor[] = [];
  for (let i = 0; i < rawAttractors.length; i++) {
    const a = rawAttractors[i];
    if (!isRecord(a)) {
      throw new Error(`Attractor at index ${i} is not an object.`);
    }

    const id = a.id;
    if (typeof id !== 'string') {
      throw new Error(`Attractor at index ${i} missing string id.`);
    }

    if (knownIds.has(id)) {
      throw new Error(`Duplicate entity ID detected: ${id}`);
    }
    knownIds.add(id);

    const position = parsePosition(a.position, id, 'Attractor');

    const category = a.category;
    if (!isScenarioDemandAttractorCategory(category)) {
      throw new Error(`Attractor ${id} holds invalid category.`);
    }

    const scale = a.scale;
    if (!isScenarioDemandScale(scale)) {
      throw new Error(`Attractor ${id} holds invalid scale.`);
    }

    const sourceWeight = a.sourceWeight;
    if (!isNonNegativeFiniteNumber(sourceWeight)) {
      throw new Error(`Attractor ${id} requires non-negative numeric sourceWeight.`);
    }

    const sinkWeight = a.sinkWeight;
    if (!isNonNegativeFiniteNumber(sinkWeight)) {
      throw new Error(`Attractor ${id} requires non-negative numeric sinkWeight.`);
    }

    let timeBandWeights: Readonly<Record<TimeBandId, number>> | undefined;
    if (a.timeBandWeights !== undefined) {
      timeBandWeights = parseTimeBandWeights(a.timeBandWeights, id, 'Attractor');
    }

    const sourceTrace = a.sourceTrace;
    if (sourceTrace !== undefined && !isJsonRecord(sourceTrace)) {
      throw new Error(`Attractor ${id} holds invalid sourceTrace.`);
    }

    attractors.push({
      id,
      position,
      category,
      scale,
      sourceWeight,
      sinkWeight,
      ...(timeBandWeights !== undefined ? { timeBandWeights } : {}),
      ...(sourceTrace !== undefined ? { sourceTrace } : {})
    });
  }

  const gateways: ScenarioDemandGateway[] = [];
  for (let i = 0; i < rawGateways.length; i++) {
    const g = rawGateways[i];
    if (!isRecord(g)) {
      throw new Error(`Gateway at index ${i} is not an object.`);
    }

    const id = g.id;
    if (typeof id !== 'string') {
      throw new Error(`Gateway at index ${i} missing string id.`);
    }

    if (knownIds.has(id)) {
      throw new Error(`Duplicate entity ID detected: ${id}`);
    }
    knownIds.add(id);

    const position = parsePosition(g.position, id, 'Gateway');

    const kind = g.kind;
    if (!isScenarioDemandGatewayKind(kind)) {
      throw new Error(`Gateway ${id} holds invalid kind.`);
    }

    const scale = g.scale;
    if (!isScenarioDemandScale(scale)) {
      throw new Error(`Gateway ${id} holds invalid scale.`);
    }

    const sourceWeight = g.sourceWeight;
    if (!isNonNegativeFiniteNumber(sourceWeight)) {
      throw new Error(`Gateway ${id} requires non-negative numeric sourceWeight.`);
    }

    const sinkWeight = g.sinkWeight;
    if (!isNonNegativeFiniteNumber(sinkWeight)) {
      throw new Error(`Gateway ${id} requires non-negative numeric sinkWeight.`);
    }

    const transferWeight = g.transferWeight;
    if (!isNonNegativeFiniteNumber(transferWeight)) {
      throw new Error(`Gateway ${id} requires non-negative numeric transferWeight.`);
    }

    const timeBandWeights = parseTimeBandWeights(g.timeBandWeights, id, 'Gateway');

    const sourceTrace = g.sourceTrace;
    if (sourceTrace !== undefined && !isJsonRecord(sourceTrace)) {
      throw new Error(`Gateway ${id} holds invalid sourceTrace.`);
    }

    gateways.push({
      id,
      position,
      kind,
      scale,
      sourceWeight,
      sinkWeight,
      transferWeight,
      timeBandWeights,
      ...(sourceTrace !== undefined ? { sourceTrace } : {})
    });
  }

  return {
    schemaVersion,
    scenarioId,
    generatedAt,
    sourceMetadata,
    nodes,
    attractors,
    gateways
  };
}
