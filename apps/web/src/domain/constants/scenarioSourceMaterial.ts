import { ScenarioSourceMaterialKind } from '../types/scenarioSourceMaterial';

/**
 * The set of recognized scenario source material kinds.
 */
export const VALID_SOURCE_MATERIAL_KINDS: readonly ScenarioSourceMaterialKind[] = [
  'manual-seed',
  'census-grid',
  'osm-extract',
  'commuter-statistics',
  'workplace-attractors',
  'generated'
];
