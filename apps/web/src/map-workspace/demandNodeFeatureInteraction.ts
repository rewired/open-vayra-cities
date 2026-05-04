/**
 * Minimal rendered demand feature shape required to decode scenario demand node IDs.
 */
export interface DemandNodeFeatureInteractionFeature {
  /** Raw MapLibre feature properties emitted by the scenario demand preview layer. */
  readonly properties?: Record<string, unknown>;
}

/**
 * Safely decodes a scenario demand node ID from raw MapLibre feature properties.
 * 
 * @param properties The properties record from a rendered map feature.
 */
export function decodeDemandNodeIdFromFeatureProperties(
  properties: Record<string, unknown> | undefined
): string | null {
  const entityId = properties?.entityId;

  // We only treat 'node', 'attractor', or 'gateway' as selectable if they have an entityId.
  // In the current scenario demand preview projection, these all map to scenario demand nodes.
  if (typeof entityId === 'string' && entityId.length > 0) {
    return entityId;
  }

  return null;
}

/**
 * Safely decodes a scenario demand node ID from a MapLibre rendered feature.
 * 
 * @param feature A MapLibre feature from the scenario demand preview layer.
 */
export function decodeDemandNodeIdFromFeature(
  feature: DemandNodeFeatureInteractionFeature | undefined
): string | null {
  return decodeDemandNodeIdFromFeatureProperties(feature?.properties);
}
