import { parseScenarioDemandArtifact } from './scenarioDemandArtifact';
import type { ScenarioDemandArtifact } from '../types/scenarioDemand';

/** Result state describing scenario demand artifact loader completion. */
export type ScenarioDemandArtifactLoadResult =
  | { readonly status: 'loaded'; readonly artifact: ScenarioDemandArtifact }
  | { readonly status: 'failed'; readonly message: string };

/**
 * Normalizes a generated demand artifact asset path to a browser-public fetch path.
 *
 * @param assetPath Scenario-defined asset path.
 * @returns Leading-slash browser fetch path.
 */
function normalizeScenarioDemandAssetPath(assetPath: string): string {
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
}

/**
 * Fetches and validates a scenario-owned generated demand artifact.
 *
 * @param assetPath Scenario demand artifact path declared in scenario definition.
 * @param expectedScenarioId Scenario identifier expected by the active selection.
 */
export async function loadScenarioDemandArtifact(
  assetPath: string,
  expectedScenarioId: string
): Promise<ScenarioDemandArtifactLoadResult> {
  const normalizedAssetPath = normalizeScenarioDemandAssetPath(assetPath.trim());

  try {
    const response = await fetch(normalizedAssetPath);
    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: 'failed',
          message:
            `Generated scenario demand artifact not found at "${normalizedAssetPath}" (HTTP 404). ` +
            'Run the scenario demand generation pipeline and scenario build pipeline before launching the web runtime.'
        };
      }
      return {
        status: 'failed',
        message: `Failed to load scenario demand artifact at "${normalizedAssetPath}". HTTP ${response.status} (${response.statusText}).`
      };
    }

    const rawJson: unknown = await response.json();
    const parsedArtifact = parseScenarioDemandArtifact(rawJson);

    if (parsedArtifact.scenarioId !== expectedScenarioId) {
      return {
        status: 'failed',
        message:
          `Scenario demand artifact scenarioId mismatch: expected "${expectedScenarioId}" but received "${parsedArtifact.scenarioId}" from "${normalizedAssetPath}".`
      };
    }

    return {
      status: 'loaded',
      artifact: parsedArtifact
    };
  } catch (error) {
    const errorString = error instanceof Error ? error.message : String(error);
    return {
      status: 'failed',
      message: `Scenario demand artifact validation failed for "${normalizedAssetPath}": ${errorString}`
    };
  }
}
