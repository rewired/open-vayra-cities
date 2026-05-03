import { describe, it, expect } from 'vitest';
import { projectScenarioDemandProvenance } from './scenarioDemandProvenanceProjection';
import type { ScenarioDemandArtifact } from '../types/scenarioDemand';

describe('projectScenarioDemandProvenance', () => {
  it('returns unavailable status when artifact is null', () => {
    const projection = projectScenarioDemandProvenance(null);
    expect(projection.status).toBe('unavailable');
    expect(projection.sourceRows).toHaveLength(0);
    expect(projection.title).toBeNull();
  });

  it('returns ready status and correct metadata when artifact is present', () => {
    const artifact: ScenarioDemandArtifact = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      generatedAt: '2026-05-01T12:00:00Z',
      sourceMetadata: {
        generatorName: 'test-generator',
        generatorVersion: '1.2.3',
        generatedFrom: [
          {
            sourceKind: 'census',
            label: 'Census 2022',
            datasetYear: 2022,
            attributionHint: 'Test Attribution'
          },
          {
            sourceKind: 'osm',
            label: 'Hamburg Extract',
            sourceDate: '2026-04-01',
            licenseHint: 'ODbL'
          }
        ]
      },
      nodes: [],
      attractors: [],
      gateways: []
    };

    const projection = projectScenarioDemandProvenance(artifact);

    expect(projection.status).toBe('ready');
    expect(projection.title).toBe('Demand model');
    expect(projection.generatorLabel).toBe('test-generator 1.2.3');
    expect(projection.summary).toContain('generated scenario demand');
    expect(projection.modelCaveat).toContain('not observed passenger demand');
    expect(projection.stopBoundaryNote).toContain('stops do not generate demand');
    
    expect(projection.sourceRows).toHaveLength(2);
    expect(projection.sourceRows[0]).toEqual({
      sourceKindLabel: 'Population grid',
      label: 'Census 2022',
      sourceDateLabel: null,
      datasetYearLabel: '2022',
      licenseHint: null,
      attributionHint: 'Test Attribution'
    });
    expect(projection.sourceRows[1]).toEqual({
      sourceKindLabel: 'OSM extract',
      label: 'Hamburg Extract',
      sourceDateLabel: '2026-04-01',
      datasetYearLabel: null,
      licenseHint: 'ODbL',
      attributionHint: null
    });
  });

  it('handles unknown source kinds gracefully', () => {
    const artifact: ScenarioDemandArtifact = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      generatedAt: '2026-05-01T12:00:00Z',
      sourceMetadata: {
        generatorName: 'test',
        generatorVersion: '1.0.0',
        generatedFrom: [
          {
            sourceKind: 'future-kind' as any,
            label: 'Future Data'
          }
        ]
      },
      nodes: [],
      attractors: [],
      gateways: []
    };

    const projection = projectScenarioDemandProvenance(artifact);
    expect(projection.sourceRows[0]?.sourceKindLabel).toBe('Source: future-kind');
  });

  it('does not mutate input artifact', () => {
    const artifact: ScenarioDemandArtifact = {
      schemaVersion: 1,
      scenarioId: 'test-scenario',
      generatedAt: '2026-05-01T12:00:00Z',
      sourceMetadata: {
        generatorName: 'test',
        generatorVersion: '1.0.0',
        generatedFrom: [{ sourceKind: 'census', label: 'Census' }]
      },
      nodes: [],
      attractors: [],
      gateways: []
    };
    
    const frozenArtifact = Object.freeze({ ...artifact });
    expect(() => projectScenarioDemandProvenance(frozenArtifact)).not.toThrow();
  });
});
