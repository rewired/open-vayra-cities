import { ScenarioSourceMaterialManifest, ScenarioSourceMaterialSource, ScenarioSourceMaterialKind } from '../types/scenarioSourceMaterial';
import { VALID_SOURCE_MATERIAL_KINDS } from '../constants/scenarioSourceMaterial';

/**
 * Validates and parses an unknown object into a typed ScenarioSourceMaterialManifest.
 * Throws an Error if validation fails.
 */
export function parseScenarioSourceMaterialManifest(input: unknown): ScenarioSourceMaterialManifest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Manifest must be a JSON object.');
  }

  const record = input as Record<string, unknown>;

  // schemaVersion
  if (typeof record.schemaVersion !== 'number' || !Number.isFinite(record.schemaVersion)) {
    throw new Error('Manifest missing valid schemaVersion.');
  }

  // scenarioId
  if (typeof record.scenarioId !== 'string' || !record.scenarioId.trim()) {
    throw new Error('Manifest missing valid scenarioId.');
  }

  // manifestId
  if (typeof record.manifestId !== 'string' || !record.manifestId.trim()) {
    throw new Error('Manifest missing valid manifestId.');
  }

  // description
  let description: string | undefined;
  if ('description' in record) {
    if (typeof record.description !== 'string') {
      throw new Error('Manifest description must be a string.');
    }
    description = record.description;
  }

  // sources
  if (!Array.isArray(record.sources)) {
    throw new Error('Manifest missing sources array.');
  }

  const sources: ScenarioSourceMaterialSource[] = [];
  const seenSourceIds = new Set<string>();

  for (let i = 0; i < record.sources.length; i++) {
    const src = record.sources[i];
    if (!src || typeof src !== 'object' || Array.isArray(src)) {
      throw new Error(`Source at index ${i} must be an object.`);
    }

    const srcRecord = src as Record<string, unknown>;

    // id
    if (typeof srcRecord.id !== 'string' || !srcRecord.id.trim()) {
      throw new Error(`Source at index ${i} missing valid id.`);
    }
    if (seenSourceIds.has(srcRecord.id)) {
      throw new Error(`Duplicate source ID detected: ${srcRecord.id}`);
    }
    seenSourceIds.add(srcRecord.id);

    // kind
    if (typeof srcRecord.kind !== 'string' || !VALID_SOURCE_MATERIAL_KINDS.includes(srcRecord.kind as ScenarioSourceMaterialKind)) {
      throw new Error(`Source ${srcRecord.id} has invalid kind: ${srcRecord.kind}`);
    }
    const kind = srcRecord.kind as ScenarioSourceMaterialKind;

    // label
    let label: string | undefined;
    if ('label' in srcRecord) {
      if (typeof srcRecord.label !== 'string') {
        throw new Error(`Source ${srcRecord.id} label must be a string.`);
      }
      if (srcRecord.label.trim()) {
        label = srcRecord.label;
      }
    }

    // path
    let path: string | undefined;
    if ('path' in srcRecord) {
      if (typeof srcRecord.path !== 'string') {
        throw new Error(`Source ${srcRecord.id} path must be a string.`);
      }
      if (srcRecord.path.trim()) {
        path = srcRecord.path;
      }
    }

    // expectedPath
    let expectedPath: string | undefined;
    if ('expectedPath' in srcRecord) {
      if (typeof srcRecord.expectedPath !== 'string') {
        throw new Error(`Source ${srcRecord.id} expectedPath must be a string.`);
      }
      if (srcRecord.expectedPath.trim()) {
        expectedPath = srcRecord.expectedPath;
      }
    }

    // Validation: no source entry can be both pathless and unlabeled
    const isPathless = !path && !expectedPath;
    const isUnlabeled = !label;
    if (isPathless && isUnlabeled) {
      throw new Error(`Source ${srcRecord.id} must have at least a useful label, path, or expectedPath.`);
    }

    // datasetYear
    let datasetYear: number | undefined;
    if ('datasetYear' in srcRecord) {
      if (typeof srcRecord.datasetYear !== 'number' || !Number.isFinite(srcRecord.datasetYear)) {
        throw new Error(`Source ${srcRecord.id} datasetYear must be a number.`);
      }
      datasetYear = srcRecord.datasetYear;
    }

    // attribution
    let attribution: string | undefined;
    if ('attribution' in srcRecord) {
      if (typeof srcRecord.attribution !== 'string') {
        throw new Error(`Source ${srcRecord.id} attribution must be a string.`);
      }
      attribution = srcRecord.attribution;
    }

    // notes
    let notes: string | undefined;
    if ('notes' in srcRecord) {
      if (typeof srcRecord.notes !== 'string') {
        throw new Error(`Source ${srcRecord.id} notes must be a string.`);
      }
      notes = srcRecord.notes;
    }

    // enabled
    let enabled = true;
    if ('enabled' in srcRecord) {
      if (typeof srcRecord.enabled !== 'boolean') {
        throw new Error(`Source ${srcRecord.id} enabled must be a boolean.`);
      }
      enabled = srcRecord.enabled;
    }

    const sourceEntry: ScenarioSourceMaterialSource = {
      id: srcRecord.id,
      kind,
      ...(label !== undefined ? { label } : {}),
      ...(path !== undefined ? { path } : {}),
      ...(expectedPath !== undefined ? { expectedPath } : {}),
      ...(datasetYear !== undefined ? { datasetYear } : {}),
      ...(attribution !== undefined ? { attribution } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(enabled !== undefined ? { enabled } : {})
    };
    sources.push(sourceEntry);
  }

  // output
  if (!record.output || typeof record.output !== 'object' || Array.isArray(record.output)) {
    throw new Error('Manifest missing valid output object.');
  }

  const outputRecord = record.output as Record<string, unknown>;

  // demandArtifactPath
  if (typeof outputRecord.demandArtifactPath !== 'string' || !outputRecord.demandArtifactPath.trim()) {
    throw new Error('Manifest output missing valid demandArtifactPath.');
  }

  const manifest: ScenarioSourceMaterialManifest = {
    schemaVersion: record.schemaVersion as number,
    scenarioId: record.scenarioId as string,
    manifestId: record.manifestId as string,
    sources,
    output: {
      demandArtifactPath: outputRecord.demandArtifactPath as string
    },
    ...(description !== undefined ? { description } : {})
  };

  return manifest;
}
