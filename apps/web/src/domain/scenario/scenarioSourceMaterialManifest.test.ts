import { describe, it, expect } from 'vitest';
import { parseScenarioSourceMaterialManifest } from './scenarioSourceMaterialManifest';

describe('parseScenarioSourceMaterialManifest', () => {
  const validManifest = {
    schemaVersion: 1,
    scenarioId: 'hamburg-core-mvp',
    manifestId: 'hamburg-core-mvp-source-material',
    description: 'Test manifest',
    sources: [
      {
        id: 'src-1',
        kind: 'manual-seed',
        label: 'Curated seed',
        path: 'data/seed.json',
        enabled: true
      }
    ],
    output: {
      demandArtifactPath: 'public/demand.json'
    }
  };

  it('should parse a valid manifest correctly', () => {
    const parsed = parseScenarioSourceMaterialManifest(validManifest);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.scenarioId).toBe('hamburg-core-mvp');
    expect(parsed.manifestId).toBe('hamburg-core-mvp-source-material');
    expect(parsed.sources.length).toBe(1);
    expect(parsed.sources[0]?.id).toBe('src-1');
    expect(parsed.sources[0]?.enabled).toBe(true);
    expect(parsed.output.demandArtifactPath).toBe('public/demand.json');
  });

  it('should default enabled to true when omitted', () => {
    const manifest = {
      ...validManifest,
      sources: [
        {
          id: 'src-1',
          kind: 'manual-seed',
          label: 'Curated seed',
          path: 'data/seed.json'
        }
      ]
    };
    const parsed = parseScenarioSourceMaterialManifest(manifest);
    expect(parsed.sources[0]?.enabled).toBe(true);
  });

  it('should parse disabled future source entries without requiring local files', () => {
    const manifest = {
      ...validManifest,
      sources: [
        {
          id: 'src-1',
          kind: 'census-grid',
          label: 'Future census',
          expectedPath: 'data/external/census/...',
          enabled: false
        }
      ]
    };
    const parsed = parseScenarioSourceMaterialManifest(manifest);
    expect(parsed.sources[0]?.enabled).toBe(false);
    expect(parsed.sources[0]?.expectedPath).toBe('data/external/census/...');
  });

  it('should reject invalid source kind', () => {
    const manifest = {
      ...validManifest,
      sources: [
        {
          id: 'src-1',
          kind: 'invalid-kind',
          label: 'Bad kind',
          path: 'data/seed.json'
        }
      ]
    };
    expect(() => parseScenarioSourceMaterialManifest(manifest)).toThrow('invalid kind');
  });

  it('should reject duplicate source ids', () => {
    const manifest = {
      ...validManifest,
      sources: [
        { id: 'src-1', kind: 'manual-seed', label: 'Seed 1', path: 'data/seed1.json' },
        { id: 'src-1', kind: 'manual-seed', label: 'Seed 2', path: 'data/seed2.json' }
      ]
    };
    expect(() => parseScenarioSourceMaterialManifest(manifest)).toThrow('Duplicate source ID detected');
  });

  it('should reject missing output demandArtifactPath', () => {
    const manifest = {
      ...validManifest,
      output: {}
    };
    expect(() => parseScenarioSourceMaterialManifest(manifest)).toThrow('Manifest output missing valid demandArtifactPath');
  });

  it('should reject malformed root', () => {
    expect(() => parseScenarioSourceMaterialManifest(null)).toThrow('Manifest must be a JSON object');
    expect(() => parseScenarioSourceMaterialManifest([])).toThrow('Manifest must be a JSON object');
    expect(() => parseScenarioSourceMaterialManifest('string')).toThrow('Manifest must be a JSON object');
  });

  it('should reject malformed sources', () => {
    const manifest = {
      ...validManifest,
      sources: 'not-an-array'
    };
    expect(() => parseScenarioSourceMaterialManifest(manifest)).toThrow('Manifest missing sources array');
  });

  it('should reject malformed output', () => {
    const manifest = {
      ...validManifest,
      output: 'not-an-object'
    };
    expect(() => parseScenarioSourceMaterialManifest(manifest)).toThrow('Manifest missing valid output object');
  });

  it('should reject non-string path or expectedPath', () => {
    const manifestPath = {
      ...validManifest,
      sources: [{ id: 'src-1', kind: 'manual-seed', label: 'Seed', path: 123 }]
    };
    expect(() => parseScenarioSourceMaterialManifest(manifestPath)).toThrow('path must be a string');

    const manifestExpected = {
      ...validManifest,
      sources: [{ id: 'src-1', kind: 'manual-seed', label: 'Seed', expectedPath: 123 }]
    };
    expect(() => parseScenarioSourceMaterialManifest(manifestExpected)).toThrow('expectedPath must be a string');
  });

  it('should reject a source with neither path nor expectedPath nor useful label', () => {
    const manifest = {
      ...validManifest,
      sources: [
        {
          id: 'src-1',
          kind: 'manual-seed'
          // missing label, path, expectedPath
        }
      ]
    };
    expect(() => parseScenarioSourceMaterialManifest(manifest)).toThrow('must have at least a useful label, path, or expectedPath');
  });
});
