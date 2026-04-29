import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const scriptPath = path.join(rootDir, 'scripts', 'scenario-demand', 'prepare-osm-attractors-source.ps1');

function runWrapper(args) {
  const result = child_process.spawnSync('powershell', [
    '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath,
    ...args
  ], { encoding: 'utf8' });
  return result;
}

function testDryRunDefaults() {
  console.log('Testing wrapper defaults via DryRun...');
  const result = runWrapper([
    '-ScenarioId', 'test-scenario',
    '-Area', 'test-area',
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  const stdout = result.stdout;

  assert.ok(stdout.includes('DRY RUN: Resolved paths'));
  assert.ok(stdout.includes('ScenarioId: test-scenario'));
  assert.ok(stdout.includes('Area: test-area'));
  assert.ok(stdout.includes(`InputPbf: ${path.join(rootDir, 'data', 'osm', 'test-area.osm.pbf')}`));
  assert.ok(stdout.includes(`OutputGeoJson: ${path.join(rootDir, 'data', 'generated', 'scenario-source-material', 'test-scenario', 'osm-attractors.raw.geojson')}`));
}

function testOverrides() {
  console.log('Testing wrapper parameter overrides...');
  const customInput = path.join(rootDir, 'data', 'custom', 'input.osm.pbf');
  const customOutput = path.join(rootDir, 'data', 'custom', 'output.geojson');
  
  const result = runWrapper([
    '-ScenarioId', 'ignored-scenario',
    '-Area', 'ignored-area',
    '-InputPbf', customInput,
    '-OutputGeoJson', customOutput,
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  const stdout = result.stdout;

  assert.ok(stdout.includes(`InputPbf: ${customInput}`));
  assert.ok(stdout.includes(`OutputGeoJson: ${customOutput}`));
}

function testFailureMissingScenario() {
  console.log('Testing wrapper failure when missing ScenarioId...');
  const result = runWrapper([
    '-Area', 'test-area',
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('ScenarioId is required'));
}

function testFailureMissingArea() {
  console.log('Testing wrapper failure when missing Area...');
  const result = runWrapper([
    '-ScenarioId', 'test-scenario',
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 1);
  assert.ok(result.stderr.includes('Area is required'));
}

function testSuccessWithoutScenarioWithExplicitOutput() {
  console.log('Testing wrapper success without ScenarioId if OutputGeoJson provided...');
  const customOutput = path.join(rootDir, 'data', 'custom', 'output.geojson');
  const result = runWrapper([
    '-Area', 'test-area',
    '-OutputGeoJson', customOutput,
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  assert.ok(result.stdout.includes(`OutputGeoJson: ${customOutput}`));
}

function testSuccessWithoutAreaWithExplicitInput() {
  console.log('Testing wrapper success without Area if InputPbf provided...');
  const customInput = path.join(rootDir, 'data', 'custom', 'input.osm.pbf');
  const result = runWrapper([
    '-ScenarioId', 'test-scenario',
    '-InputPbf', customInput,
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  assert.ok(result.stdout.includes(`InputPbf: ${customInput}`));
}

function testImageEnsureDryRun() {
  console.log('Testing image ensure logic via DryRun...');
  const result = runWrapper([
    '-ScenarioId', 'test-scenario',
    '-Area', 'test-area',
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  const stdout = result.stdout;

  assert.ok(stdout.includes('ImageName: open-vayra-osmium-tooling:local'), 'Should use default image name');
  assert.ok(stdout.includes('DRY RUN: Would ensure default image open-vayra-osmium-tooling:local before extraction'), 'Should plan image ensure');
}

function testCustomImageDryRun() {
  console.log('Testing custom image skip ensure via DryRun...');
  const result = runWrapper([
    '-ScenarioId', 'test-scenario',
    '-Area', 'test-area',
    '-ImageName', 'custom-osmium-image',
    '-DryRun'
  ]);

  assert.strictEqual(result.status, 0, `Script failed: ${result.stderr}`);
  const stdout = result.stdout;

  assert.ok(stdout.includes('ImageName: custom-osmium-image'), 'Should preserve custom image name');
  assert.ok(stdout.includes('DRY RUN: Custom image custom-osmium-image provided, skipping automatic ensure'), 'Should skip image ensure for custom image');
}

function testNoCityopsName() {
  console.log('Verifying no cityops names in relevant files...');
  const pkgPath = path.join(rootDir, 'package.json');
  const pkgContent = fs.readFileSync(pkgPath, 'utf8');
  assert.ok(!pkgContent.includes('cityops'), 'package.json should not contain cityops');

  const wrapperPath = path.join(rootDir, 'scripts', 'scenario-demand', 'prepare-osm-attractors-source.ps1');
  const wrapperContent = fs.readFileSync(wrapperPath, 'utf8');
  assert.ok(!wrapperContent.includes('cityops'), 'prepare-osm-attractors-source.ps1 should not contain cityops');
}

function runAll() {
  try {
    testDryRunDefaults();
    testOverrides();
    testFailureMissingScenario();
    testFailureMissingArea();
    testSuccessWithoutScenarioWithExplicitOutput();
    testSuccessWithoutAreaWithExplicitInput();
    testImageEnsureDryRun();
    testCustomImageDryRun();
    testNoCityopsName();
    console.log('--- All prepare-osm-attractors-source.ps1 Wrapper Tests Passed ---');
  } catch (err) {
    console.error('Test suite failed:');
    console.error(err);
    process.exit(1);
  }
}

runAll();
