/**
 * Defines the recognized categories of scenario source material.
 */
export type ScenarioSourceMaterialKind =
  | 'manual-seed'
  | 'census-grid'
  | 'osm-extract'
  | 'commuter-statistics'
  | 'generated';

/**
 * Represents a single source entry in the manifest.
 */
export interface ScenarioSourceMaterialSource {
  readonly id: string;
  readonly kind: ScenarioSourceMaterialKind;
  readonly label?: string;
  readonly path?: string;
  readonly expectedPath?: string;
  readonly datasetYear?: number;
  readonly attribution?: string;
  readonly notes?: string;
  readonly enabled?: boolean;
}

/**
 * Defines the output configuration for the generated demand artifact.
 */
export interface ScenarioSourceMaterialOutput {
  readonly demandArtifactPath: string;
}

/**
 * The root shape of a scenario source material manifest.
 */
export interface ScenarioSourceMaterialManifest {
  readonly schemaVersion: number;
  readonly scenarioId: string;
  readonly manifestId: string;
  readonly description?: string;
  readonly sources: readonly ScenarioSourceMaterialSource[];
  readonly output: ScenarioSourceMaterialOutput;
}
