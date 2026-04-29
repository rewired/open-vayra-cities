import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import child_process from 'child_process';
import { parseScenarioDemandArtifact } from '../../apps/web/src/domain/scenario/scenarioDemandArtifact.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const generatorScript = path.join(__dirname, 'build-scenario-demand.mjs');

const tempDir = path.join(rootDir, 'tmp', 'test-demand');

function setup() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}

function cleanup() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function runGenerator(args) {
  const result = child_process.spawnSync('node', [generatorScript, ...args], { encoding: 'utf8' });
  return result;
}

function testValidSeed() {
  console.log('Testing valid seed...');
  const inputPath = path.join(tempDir, 'valid.seed.json');
  const outputPath = path.join(tempDir, 'output.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    generatorName: 'test-generator',
    sourceMetadata: {
      generatedFrom: [{ sourceKind: 'manual', label: 'test' }],
      notes: 'test notes'
    },
    nodes: [{
      id: 'n1',
      position: { lng: 10, lat: 50 },
      role: 'origin',
      class: 'residential',
      baseWeight: 1,
      timeBandWeights: {
        'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1
      }
    }],
    attractors: [{
      id: 'a1',
      position: { lng: 10.1, lat: 50.1 },
      category: 'workplace',
      scale: 'local',
      sourceWeight: 1,
      sinkWeight: 1,
      timeBandWeights: {
        'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1
      }
    }],
    gateways: [{
      id: 'g1',
      position: { lng: 10.2, lat: 50.2 },
      kind: 'rail-station',
      scale: 'local',
      sourceWeight: 1,
      sinkWeight: 1,
      transferWeight: 1,
      timeBandWeights: {
        'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1
      }
    }]
  };

  fs.writeFileSync(inputPath, JSON.stringify(seed, null, 2));

  const result = runGenerator(['--input', inputPath, '--output', outputPath]);
  assert.strictEqual(result.status, 0, `Generator failed: ${result.stderr}`);

  assert.ok(fs.existsSync(outputPath), 'Output file not created');

  const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(generated.schemaVersion, 1);
  assert.strictEqual(generated.scenarioId, 'test-scenario');
  assert.ok(generated.generatedAt);
  assert.strictEqual(generated.sourceMetadata.generatorName, 'test-generator');
  assert.strictEqual(generated.sourceMetadata.generatorVersion, '0.1.0');
  assert.strictEqual(generated.nodes.length, 1);
  assert.strictEqual(generated.attractors.length, 1);
  assert.strictEqual(generated.gateways.length, 1);

  // Validate through parser
  try {
    const parsed = parseScenarioDemandArtifact(generated);
    assert.ok(parsed, 'Parser returned null or undefined');
  } catch (e) {
    assert.fail(`Parser failed to validate generated artifact: ${e.message}`);
  }
}

function testMissingInput() {
  console.log('Testing missing input file...');
  const result = runGenerator(['--input', 'non-existent.json', '--output', 'out.json']);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Input file not found'));
}

function testInvalidSeedShape() {
  console.log('Testing invalid seed shape...');
  const inputPath = path.join(tempDir, 'invalid.seed.json');
  fs.writeFileSync(inputPath, '{"scenarioId": "test"}'); // Missing arrays

  const result = runGenerator(['--input', inputPath, '--output', 'out.json']);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Seed missing valid sourceMetadata') || result.stderr.includes('Seed missing valid'));
}

function testDuplicateIds() {
  console.log('Testing duplicate entity IDs...');
  const inputPath = path.join(tempDir, 'duplicate.seed.json');
  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [
      { id: 'dup', position: { lng: 10, lat: 50 }, role: 'origin', class: 'residential', baseWeight: 1, timeBandWeights: { 'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1 } }
    ],
    attractors: [
      { id: 'dup', position: { lng: 10, lat: 50 }, category: 'workplace', scale: 'local', sourceWeight: 1, sinkWeight: 1 }
    ],
    gateways: []
  };
  fs.writeFileSync(inputPath, JSON.stringify(seed, null, 2));

  const result = runGenerator(['--input', inputPath, '--output', 'out.json']);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Duplicate entity ID detected'));
}

function testCreateOutputDir() {
  console.log('Testing output directory creation...');
  const inputPath = path.join(tempDir, 'valid.seed.json');
  const outputPath = path.join(tempDir, 'nested', 'dir', 'output.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [], attractors: [], gateways: []
  };
  fs.writeFileSync(inputPath, JSON.stringify(seed, null, 2));

  const result = runGenerator(['--input', inputPath, '--output', outputPath]);
  assert.strictEqual(result.status, 0);
  assert.ok(fs.existsSync(outputPath));
}

function testManifestUsage() {
  console.log('Testing manifest usage...');
  const manifestPath = path.join(tempDir, 'test.manifest.json');
  const seedPath = path.join(tempDir, 'seed.json');
  const outputPath = path.join(tempDir, 'nested', 'manifest-out.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [], attractors: [], gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', path: seedPath, enabled: true }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 0, `Generator failed: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath), 'Output file not created from manifest output path');
}

function testManifestDisabledUnsupported() {
  console.log('Testing manifest ignoring disabled unsupported sources...');
  const manifestPath = path.join(tempDir, 'disabled-unsupported.manifest.json');
  const seedPath = path.join(tempDir, 'seed.json');
  const outputPath = path.join(tempDir, 'manifest-out.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [], attractors: [], gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', path: seedPath, enabled: true },
      { id: 's2', kind: 'census-grid', label: 'Future Census', expectedPath: 'data/external/census/...', enabled: false }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 0, `Generator failed: ${result.stderr}`);
}

function testManifestEnabledUnsupported() {
  console.log('Testing manifest failing on enabled unsupported sources...');
  const manifestPath = path.join(tempDir, 'enabled-unsupported.manifest.json');
  const seedPath = path.join(tempDir, 'seed.json');
  const outputPath = path.join(tempDir, 'manifest-out.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [], attractors: [], gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', path: seedPath, enabled: true },
      { id: 's2', kind: 'osm-extract', label: 'Future OSM', expectedPath: 'data/external/osm/...', enabled: true }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('is configured but no adapter exists yet'));
}

function testMissingManifest() {
  console.log('Testing missing manifest file...');
  const result = runGenerator(['--manifest', 'non-existent.json']);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Manifest file not found'));
}

function testMultipleManualSeeds() {
  console.log('Testing multiple enabled manual seeds rejection...');
  const manifestPath = path.join(tempDir, 'multiple.manifest.json');
  const seedPath = path.join(tempDir, 'seed.json');
  const outputPath = path.join(tempDir, 'manifest-out.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [], attractors: [], gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed 1', path: seedPath, enabled: true },
      { id: 's2', kind: 'manual-seed', label: 'Seed 2', path: seedPath, enabled: true }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Only one enabled manual seed is supported for now.'));
}

function testSeedScenarioMismatch() {
  console.log('Testing seed scenarioId mismatch...');
  const manifestPath = path.join(tempDir, 'mismatch.manifest.json');
  const seedPath = path.join(tempDir, 'mismatched-seed.json');
  const outputPath = path.join(tempDir, 'manifest-out.demand.json');

  const seed = {
    scenarioId: 'scenario-a',
    sourceMetadata: { generatedFrom: [] },
    nodes: [], attractors: [], gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'scenario-b',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', path: seedPath, enabled: true }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('does not match manifest scenarioId'));
}

function testPathlessManualSeed() {
  console.log('Testing pathless manual seed...');
  const manifestPath = path.join(tempDir, 'pathless.manifest.json');
  const outputPath = path.join(tempDir, 'manifest-out.demand.json');

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', enabled: true }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('missing path'));
}

function testManifestCensusGridValid() {
  console.log('Testing manifest with enabled census-grid source...');
  const manifestPath = path.join(tempDir, 'census-grid.manifest.json');
  const csvPath = path.join(tempDir, 'census-grid.csv');
  const outputPath = path.join(tempDir, 'census-out.demand.json');

  fs.writeFileSync(csvPath, 'grid_id,lon,lat,population\ng1,10.0,53.5,100\n');

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      {
        id: 'baseline-population-grid',
        kind: 'census-grid',
        label: 'Grid',
        path: csvPath,
        enabled: true,
        adapter: 'census-grid-csv',
        options: {
          idColumn: 'grid_id',
          longitudeColumn: 'lon',
          latitudeColumn: 'lat',
          populationColumn: 'population',
          delimiter: ','
        }
      }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 0, `Generator failed: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath));

  const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(generated.nodes.length, 1);
  
  const node = generated.nodes[0];
  assert.strictEqual(node.id, 'baseline-population-grid-g1');
  assert.strictEqual(node.position.lng, 10.0);
  assert.strictEqual(node.position.lat, 53.5);
  assert.strictEqual(node.role, 'origin');
  assert.strictEqual(node.class, 'residential');
  assert.strictEqual(node.baseWeight, 100);
  
  assert.ok(node.timeBandWeights);
  assert.strictEqual(node.timeBandWeights['morning-rush'], 1.5);
  
  try {
    parseScenarioDemandArtifact(generated);
  } catch (e) {
    assert.fail(`Parser failed: ${e.message}`);
  }
}

function testManifestCensusGridMissingOptions() {
  console.log('Testing manifest census-grid missing options rejection...');
  const manifestPath = path.join(tempDir, 'missing-options.manifest.json');
  const csvPath = path.join(tempDir, 'census-grid.csv');
  const outputPath = path.join(tempDir, 'census-out.demand.json');

  fs.writeFileSync(csvPath, 'grid_id,lon,lat,population\ng1,10.0,53.5,100\n');

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      {
        id: 'baseline-population-grid',
        kind: 'census-grid',
        label: 'Grid',
        path: csvPath,
        enabled: true,
        adapter: 'census-grid-csv'
      }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('missing valid options object'));
}

function testManifestCensusGridInvalidCsv() {
  console.log('Testing manifest census-grid invalid CSV rejection...');
  const manifestPath = path.join(tempDir, 'invalid-csv.manifest.json');
  const csvPath = path.join(tempDir, 'invalid-census-grid.csv');
  const outputPath = path.join(tempDir, 'census-out.demand.json');

  fs.writeFileSync(csvPath, 'grid_id,lon,lat,population\ng1,not-a-number,53.5,100\n');

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      {
        id: 'baseline-population-grid',
        kind: 'census-grid',
        label: 'Grid',
        path: csvPath,
        enabled: true,
        adapter: 'census-grid-csv',
        options: {
          idColumn: 'grid_id',
          longitudeColumn: 'lon',
          latitudeColumn: 'lat',
          populationColumn: 'population',
          delimiter: ','
        }
      }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Invalid or non-finite longitude') || result.stderr.includes('Adapter failure'));
}

function testManifestMixedSources() {
  console.log('Testing manifest merging manual seed and census-grid sources...');
  const manifestPath = path.join(tempDir, 'mixed.manifest.json');
  const seedPath = path.join(tempDir, 'seed.json');
  const csvPath = path.join(tempDir, 'census-grid.csv');
  const outputPath = path.join(tempDir, 'mixed-out.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [
      { id: 's-node-1', position: { lng: 10, lat: 50 }, role: 'origin', class: 'residential', baseWeight: 1, timeBandWeights: { 'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1 } }
    ],
    attractors: [], gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  fs.writeFileSync(csvPath, 'grid_id,lon,lat,population\ng1,10.0,53.5,100\n');

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', path: seedPath, enabled: true },
      {
        id: 'baseline-population-grid',
        kind: 'census-grid',
        label: 'Grid',
        path: csvPath,
        enabled: true,
        adapter: 'census-grid-csv',
        options: {
          idColumn: 'grid_id',
          longitudeColumn: 'lon',
          latitudeColumn: 'lat',
          populationColumn: 'population',
          delimiter: ','
        }
      }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 0, `Generator failed: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath));

  const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(generated.nodes.length, 2);
}

function testManifestCensusGridDuplicateIds() {
  console.log('Testing manifest duplicate entity ID across sources rejection...');
  const manifestPath = path.join(tempDir, 'duplicate-mixed.manifest.json');
  const seedPath = path.join(tempDir, 'seed.json');
  const csvPath = path.join(tempDir, 'census-grid.csv');
  const outputPath = path.join(tempDir, 'mixed-out.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [
      { id: 'baseline-population-grid-g1', position: { lng: 10, lat: 50 }, role: 'origin', class: 'residential', baseWeight: 1, timeBandWeights: { 'morning-rush': 1, 'late-morning': 1, 'midday': 1, 'afternoon': 1, 'evening-rush': 1, 'evening': 1, 'night': 1 } }
    ],
    attractors: [], gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  fs.writeFileSync(csvPath, 'grid_id,lon,lat,population\ng1,10.0,53.5,100\n');

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', path: seedPath, enabled: true },
      {
        id: 'baseline-population-grid',
        kind: 'census-grid',
        label: 'Grid',
        path: csvPath,
        enabled: true,
        adapter: 'census-grid-csv',
        options: {
          idColumn: 'grid_id',
          longitudeColumn: 'lon',
          latitudeColumn: 'lat',
          populationColumn: 'population',
          delimiter: ','
        }
      }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Duplicate entity ID detected'));
}

function testManifestWorkplaceAttractorsValid() {
  console.log('Testing manifest with enabled workplace-attractors source...');
  const manifestPath = path.join(tempDir, 'workplace.manifest.json');
  const geojsonPath = path.join(tempDir, 'workplace.geojson');
  const outputPath = path.join(tempDir, 'workplace-out.demand.json');

  fs.writeFileSync(geojsonPath, JSON.stringify({
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": { "id": "w1", "name": "Test Office", "weight": 250, "scale": "major" },
      "geometry": { "type": "Point", "coordinates": [10.0, 53.5] }
    }]
  }));

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      {
        id: 'workplace-source',
        kind: 'workplace-attractors',
        label: 'Workplaces',
        path: geojsonPath,
        enabled: true,
        adapter: 'workplace-attractor-geojson',
        options: {
          idProperty: 'id',
          labelProperty: 'name',
          weightProperty: 'weight',
          scaleProperty: 'scale'
        }
      }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 0, `Generator failed: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath));

  const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(generated.attractors.length, 1);

  const attractor = generated.attractors[0];
  assert.strictEqual(attractor.id, 'workplace-source-w1');
  assert.strictEqual(attractor.position.lng, 10.0);
  assert.strictEqual(attractor.position.lat, 53.5);
  assert.strictEqual(attractor.category, 'workplace');
  assert.strictEqual(attractor.scale, 'major');
  assert.strictEqual(attractor.sourceWeight, 250);
  assert.strictEqual(attractor.sinkWeight, 250);

  assert.ok(attractor.timeBandWeights);
  assert.strictEqual(attractor.timeBandWeights['morning-rush'], 1.5);

  try {
    parseScenarioDemandArtifact(generated);
  } catch (e) {
    assert.fail(`Parser failed: ${e.message}`);
  }
}

function testManifestWorkplaceAttractorsDuplicateIds() {
  console.log('Testing manifest duplicate entity ID across workplace sources rejection...');
  const manifestPath = path.join(tempDir, 'duplicate-mixed-attractor.manifest.json');
  const seedPath = path.join(tempDir, 'seed.json');
  const geojsonPath = path.join(tempDir, 'workplace.geojson');
  const outputPath = path.join(tempDir, 'mixed-out.demand.json');

  const seed = {
    scenarioId: 'test-scenario',
    sourceMetadata: { generatedFrom: [] },
    nodes: [],
    attractors: [
      { id: 'workplace-source-w1', position: { lng: 10, lat: 50 }, category: 'workplace', scale: 'local', sourceWeight: 1, sinkWeight: 1 }
    ],
    gateways: []
  };
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  fs.writeFileSync(geojsonPath, JSON.stringify({
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": { "id": "w1" },
      "geometry": { "type": "Point", "coordinates": [10.0, 53.5] }
    }]
  }));

  const manifest = {
    schemaVersion: 1,
    scenarioId: 'test-scenario',
    manifestId: 'test-manifest',
    sources: [
      { id: 's1', kind: 'manual-seed', label: 'Seed', path: seedPath, enabled: true },
      {
        id: 'workplace-source',
        kind: 'workplace-attractors',
        label: 'Workplaces',
        path: geojsonPath,
        enabled: true,
        adapter: 'workplace-attractor-geojson'
      }
    ],
    output: { demandArtifactPath: outputPath }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', manifestPath]);
  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Duplicate entity ID detected'));
}

function testHamburgManifest() {
  console.log('Testing Hamburg manifest with fixtures...');
  const realManifestPath = path.join(rootDir, 'data', 'scenario-source-material', 'hamburg-core-mvp.source-material.json');
  const tempManifestPath = path.join(tempDir, 'hamburg-temp.manifest.json');
  const tempOutputPath = path.join(tempDir, 'hamburg-temp.demand.json');

  const manifest = JSON.parse(fs.readFileSync(realManifestPath, 'utf8'));
  manifest.output.demandArtifactPath = tempOutputPath;
  
  fs.writeFileSync(tempManifestPath, JSON.stringify(manifest, null, 2));

  const result = runGenerator(['--manifest', tempManifestPath]);
  assert.strictEqual(result.status, 0, `Generator failed: ${result.stderr}`);
  assert.ok(fs.existsSync(tempOutputPath));

  const generated = JSON.parse(fs.readFileSync(tempOutputPath, 'utf8'));
  
  assert.ok(generated.nodes.length >= 8, `Expected >= 8 nodes, got ${generated.nodes.length}`);
  assert.ok(generated.attractors.length >= 6, `Expected >= 6 attractors, got ${generated.attractors.length}`);

  const residentialNode = generated.nodes.find(n => n.class === 'residential');
  assert.ok(residentialNode.id.startsWith('hamburg-core-mvp-residential-grid-fixture'), `Expected id to start with prefix, got ${residentialNode.id}`);

  const workplaceAttractor = generated.attractors.find(a => a.category === 'workplace');
  assert.ok(workplaceAttractor.id.startsWith('hamburg-core-mvp-workplace-attractors-fixture'), `Expected id to start with prefix, got ${workplaceAttractor.id}`);

  const hasManualSeed = generated.nodes.some(n => n.id.startsWith('hamburg-core-mvp-manual-seed')) ||
                        generated.attractors.some(a => a.id.startsWith('hamburg-core-mvp-manual-seed'));
  assert.ok(!hasManualSeed, 'Generated artifact contains entities from disabled manual-seed');

  const hasCensusMeta = generated.sourceMetadata.generatedFrom.some(s => s.sourceKind === 'census');
  const hasOsmMeta = generated.sourceMetadata.generatedFrom.some(s => s.sourceKind === 'osm');
  assert.ok(hasCensusMeta, 'Missing census metadata in generatedFrom');
  assert.ok(hasOsmMeta, 'Missing osm metadata in generatedFrom');
}

function runAll() {
  try {
    setup();
    testValidSeed();
    testMissingInput();
    testInvalidSeedShape();
    testDuplicateIds();
    testCreateOutputDir();
    testManifestUsage();
    testManifestDisabledUnsupported();
    testManifestEnabledUnsupported();
    testMissingManifest();
    testMultipleManualSeeds();
    testSeedScenarioMismatch();
    testPathlessManualSeed();
    testManifestCensusGridValid();
    testManifestCensusGridMissingOptions();
    testManifestCensusGridInvalidCsv();
    testManifestMixedSources();
    testManifestCensusGridDuplicateIds();
    testManifestWorkplaceAttractorsValid();
    testManifestWorkplaceAttractorsDuplicateIds();
    testHamburgManifest();
    console.log('--- All Generator Tests Passed ---');
  } finally {
    cleanup();
  }
}


runAll();
