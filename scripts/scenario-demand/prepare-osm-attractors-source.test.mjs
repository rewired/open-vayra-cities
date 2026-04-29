import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const scriptPath = path.join(__dirname, 'prepare-osm-attractors-source.mjs');
const tempDir = path.join(rootDir, 'tmp', 'test-prepare-osm');

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

function runScript(args) {
  const result = child_process.spawnSync('node', [scriptPath, ...args], { encoding: 'utf8' });
  return result;
}

function testOsmPointFeature() {
  console.log('Testing OSM Point Feature normalization...');
  const scenarioPath = path.join(tempDir, 'test.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-scenario',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10.0, 53.5] },
        properties: { '@type': 'node', '@id': '1234', name: 'Test School', amenity: 'school' }
      }
    ]
  };
  fs.writeFileSync(inputPath, JSON.stringify(geojson, null, 2));

  const result = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath,
    '--allow-fixture-residential'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath));

  const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(output.features.length, 1);
  assert.strictEqual(output.features[0].properties.id, 'node-1234');
  assert.strictEqual(output.features[0].properties.category, 'education');
  assert.strictEqual(output.features[0].properties.scale, 'district');
  assert.strictEqual(output.features[0].properties.weight, 200);
}

function testOsmPolygonFeature() {
  console.log('Testing OSM Polygon Feature normalization...');
  const scenarioPath = path.join(tempDir, 'test.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-scenario',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[10.0, 53.5], [10.1, 53.5], [10.1, 53.6], [10.0, 53.6], [10.0, 53.5]]]
        },
        properties: { '@type': 'way', '@id': '5678', office: 'it' }
      }
    ]
  };
  fs.writeFileSync(inputPath, JSON.stringify(geojson, null, 2));

  const result = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath,
    '--allow-fixture-residential'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(output.features.length, 1);
  assert.strictEqual(output.features[0].properties.id, 'way-5678');
  assert.strictEqual(output.features[0].properties.category, 'workplace-office');
}

function testUnsupportedGeometry() {
  console.log('Testing unsupported geometry options...');
  const scenarioPath = path.join(tempDir, 'test.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-scenario',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[10.0, 53.5], [10.1, 53.6]] },
        properties: { amenity: 'hospital' }
      }
    ]
  };
  fs.writeFileSync(inputPath, JSON.stringify(geojson, null, 2));

  // Default mode skips it
  const resultSkip = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath,
    '--allow-fixture-residential'
  ]);
  assert.strictEqual(resultSkip.status, 0);
  let output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(output.features.length, 0);

  // Reject mode fails clearly
  const resultReject = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath,
    '--allow-fixture-residential',
    '--reject-unsupported-geometries'
  ]);
  assert.strictEqual(resultReject.status, 1);
  assert.ok(resultReject.stderr.includes('failed geometry evaluation'));
}

function testOutOfBoundsFeatures() {
  console.log('Testing out-of-bounds exclusion...');
  const scenarioPath = path.join(tempDir, 'test.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-scenario',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [9.0, 53.5] }, // West of bounds
        properties: { amenity: 'townhall' }
      }
    ]
  };
  fs.writeFileSync(inputPath, JSON.stringify(geojson, null, 2));

  const result = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath,
    '--allow-fixture-residential'
  ]);

  assert.strictEqual(result.status, 0);
  const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(output.features.length, 0);
}

function testDuplicateIds() {
  console.log('Testing duplicate stable ID checks...');
  const scenarioPath = path.join(tempDir, 'test.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-scenario',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10.0, 53.5] },
        properties: { '@type': 'node', '@id': '1234', shop: 'supermarket' }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10.1, 53.5] },
        properties: { '@type': 'node', '@id': '1234', shop: 'bakery' }
      }
    ]
  };
  fs.writeFileSync(inputPath, JSON.stringify(geojson, null, 2));

  const result = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath,
    '--allow-fixture-residential'
  ]);

  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Duplicate stable ID detected'));
}

function testManifestReferences() {
  console.log('Testing manifest references and rules...');
  const scenarioPath = path.join(tempDir, 'test-scenario.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-scenario',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  // Create a fake normalized census grid
  const censusDir = path.join(rootDir, 'data', 'generated', 'scenario-source-material', 'test-scenario');
  if (!fs.existsSync(censusDir)) {
    fs.mkdirSync(censusDir, { recursive: true });
  }
  const censusPath = path.join(censusDir, 'residential-grid.normalized.csv');
  fs.writeFileSync(censusPath, 'grid_id,lng,lat,population\ng1,10.0,53.5,100');

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10.0, 53.5] },
        properties: { amenity: 'clinic' }
      }
    ]
  };
  fs.writeFileSync(inputPath, JSON.stringify(geojson, null, 2));

  const result = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.scenarioId, 'test-scenario');
  assert.ok(!manifest.sources.some(s => s.kind === 'manual-seed'));
  assert.strictEqual(manifest.sources.length, 2);
  assert.strictEqual(manifest.sources[0].kind, 'census-grid');
  assert.strictEqual(manifest.sources[1].kind, 'workplace-attractors');
}

function testPackageScripts() {
  console.log('Testing package scripts existence...');
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts || {};
  
  assert.ok(scripts['scenario-demand:prepare-osm-attractors:hamburg-core-mvp']);
  assert.ok(scripts['scenario-demand:build:hamburg-core-mvp:local-demand']);
}

function testMissingCensusCsvFailure() {
  console.log('Testing missing census CSV failure...');
  const scenarioPath = path.join(tempDir, 'test-missing.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-missing',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10.0, 53.5] },
        properties: { amenity: 'school' }
      }
    ]
  };
  fs.writeFileSync(inputPath, JSON.stringify(geojson, null, 2));

  const result = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath
  ]);

  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Local census normalized file does not exist'));
  assert.ok(result.stderr.includes('pnpm scenario-demand:prepare-census:test-missing'));
}

function testInvalidGeoJsonFailure() {
  console.log('Testing invalid GeoJSON failure...');
  const scenarioPath = path.join(tempDir, 'test-invalid.scenario.json');
  const inputPath = path.join(tempDir, 'input.geojson');
  const outputPath = path.join(tempDir, 'output.geojson');
  const manifestPath = path.join(tempDir, 'manifest.json');

  const scenario = {
    scenarioId: 'test-invalid',
    playableBounds: { west: 9.5, south: 53.0, east: 10.5, north: 54.0 }
  };
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));

  fs.writeFileSync(inputPath, 'not a geojson');

  const result = runScript([
    '--scenario', scenarioPath,
    '--input', inputPath,
    '--output', outputPath,
    '--manifest-output', manifestPath,
    '--allow-fixture-residential'
  ]);

  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Failed to parse input GeoJSON'));
}

function runAll() {

  try {
    setup();
    testPackageScripts();
    testOsmPointFeature();
    testOsmPolygonFeature();
    testUnsupportedGeometry();
    testOutOfBoundsFeatures();
    testDuplicateIds();
    testMissingCensusCsvFailure();
    testInvalidGeoJsonFailure();
    testManifestReferences();

    console.log('--- All Prepare OSM Script Tests Passed ---');
  } finally {
    cleanup();
  }
}

runAll();
