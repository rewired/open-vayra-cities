import type { ScenarioDemandArtifact, ScenarioDemandSourceKind } from '../types/scenarioDemand';

/** Availability status of the provenance projection. */
export type ScenarioDemandProvenanceStatus = 'unavailable' | 'ready';

/** Formatted metadata entry for a single demand source dataset. */
export interface ScenarioDemandProvenanceSourceRow {
  /** Human-readable category label. */
  readonly sourceKindLabel: string;
  /** Dataset name or identifier. */
  readonly label: string;
  /** Optional formatted release date. */
  readonly sourceDateLabel: string | null;
  /** Optional formatted reference year. */
  readonly datasetYearLabel: string | null;
  /** Optional licensing reference. */
  readonly licenseHint: string | null;
  /** Optional attribution requirement. */
  readonly attributionHint: string | null;
}

/** 
 * Pure projection of scenario demand provenance and model caveats. 
 * Provides transparency regarding data origins and simulation limitations.
 */
export interface ScenarioDemandProvenanceProjection {
  /** Status of the artifact metadata availability. */
  readonly status: ScenarioDemandProvenanceStatus;
  /** Section title for the provenance display. */
  readonly title: string | null;
  /** High-level summary of how demand is created. */
  readonly summary: string | null;
  /** Explicit warning regarding data fidelity and intended use. */
  readonly modelCaveat: string | null;
  /** Clarification on stop-to-demand interactions. */
  readonly stopBoundaryNote: string | null;
  /** Combined generator name and version string. */
  readonly generatorLabel: string | null;
  /** Ordered list of contributing source materials. */
  readonly sourceRows: readonly ScenarioDemandProvenanceSourceRow[];
}

/** Mapping of internal source kind constants to player-facing display labels. */
const SOURCE_KIND_LABELS: Record<ScenarioDemandSourceKind, string> = {
  census: 'Population grid',
  osm: 'OSM extract',
  'commuter-statistics': 'Commuter statistics',
  manual: 'Manual seed',
  generated: 'Generated'
};

/**
 * Projects scenario demand provenance from artifact metadata.
 * Provides a structured summary of data origins, model limitations, and generator info.
 * 
 * @param artifact - The loaded scenario demand artifact, or null if none is active.
 * @returns A strictly typed provenance projection.
 */
export function projectScenarioDemandProvenance(
  artifact: ScenarioDemandArtifact | null
): ScenarioDemandProvenanceProjection {
  if (!artifact) {
    return {
      status: 'unavailable',
      title: null,
      summary: null,
      modelCaveat: null,
      stopBoundaryNote: null,
      generatorLabel: null,
      sourceRows: []
    };
  }

  const { sourceMetadata } = artifact;

  const sourceRows: ScenarioDemandProvenanceSourceRow[] = sourceMetadata.generatedFrom.map((entry) => ({
    sourceKindLabel: SOURCE_KIND_LABELS[entry.sourceKind],
    label: entry.label,
    sourceDateLabel: entry.sourceDate ?? null,
    datasetYearLabel: entry.datasetYear?.toString() ?? null,
    licenseHint: entry.licenseHint ?? null,
    attributionHint: entry.attributionHint ?? null
  }));

  return {
    status: 'ready',
    title: 'Demand model',
    summary: 'This is generated scenario demand derived from source materials.',
    modelCaveat: 'Demand is generated for gameplay planning context. It is not observed passenger demand or a true OD matrix.',
    stopBoundaryNote: 'Stops capture and serve demand; stops do not generate demand.',
    generatorLabel: `${sourceMetadata.generatorName} ${sourceMetadata.generatorVersion}`,
    sourceRows
  };
}
