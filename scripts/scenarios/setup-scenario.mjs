import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import child_process from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
let presetId = null;
let prepareAssets = false;
let force = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--preset') {
    presetId = args[i + 1];
    i++;
  } else if (args[i] === '--prepare-assets') {
    prepareAssets = true;
  } else if (args[i] === '--force') {
    force = true;
  }
}

if (!presetId) {
  fail('Missing required argument: --preset <presetId>');
}

if (presetId !== 'hamburg-core-mvp') {
  fail(`Unsupported preset: ${presetId}. Supported presets: hamburg-core-mvp`);
}

// Preset definitions
const PRESETS = {
  'hamburg-core-mvp': {
    areaId: 'hvv-mvp',
    sourceMaterialManifest: 'data/scenario-source-material/hamburg-core-mvp.source-material.json',
    areaJson: {
      schemaVersion: 1,
      areaId: 'hvv-mvp',
      displayName: 'Hamburg + HVV MVP Area',
      sourcePbfFile: 'data/osm/hvv-mvp.osm.pbf',
      routing: {
        engine: 'osrm',
        profile: 'car',
        algorithm: 'mld',
        baseName: 'hvv-mvp',
        expectedBaseFile: 'data/routing/osrm/hvv-mvp/hvv-mvp.osrm'
      },
      stopCandidates: {
        expectedGeoJsonFile: 'apps/web/public/generated/hvv-mvp/osm-stop-candidates.geojson'
      },
      bounds: {
        west: 9.45,
        south: 53.15,
        east: 10.65,
        north: 53.95
      },
      defaultViewport: {
        lng: 10.0,
        lat: 53.55,
        zoom: 10.5
      }
    },
    scenarioJson: {
      schemaVersion: 1,
      scenarioId: 'hamburg-core-mvp',
      title: 'Hamburg Core MVP',
      description: 'Build an initial bus network in central Hamburg.',
      areaId: 'hvv-mvp',
      requiredAssets: {
        routing: {
          areaId: 'hvv-mvp',
          engine: 'osrm',
          profile: 'car',
          algorithm: 'mld'
        },
        stopCandidates: {
          areaId: 'hvv-mvp'
        }
      },
      initialViewport: {
        lng: 10.0,
        lat: 53.55,
        zoom: 11
      },
      playableBounds: {
        west: 9.75,
        south: 53.43,
        east: 10.2,
        north: 53.7
      },
      startingBudget: 250000,
      simulationStart: {
        weekday: 'monday',
        time: '05:00'
      },
      demandProfileId: 'hamburg-core-synthetic-v1',
      demandAssets: {
        scenarioDemand: 'generated/scenarios/hamburg-core-mvp.demand.json'
      },
      objectives: [
        {
          objectiveId: 'serve-work-demand',
          label: 'Serve 35% of workplace demand'
        },
        {
          objectiveId: 'wait-under-12',
          label: 'Keep average wait below 12 minutes'
        }
      ]
    }
  }
};

const preset = PRESETS[presetId];

// Ensure directories exist
const dirs = [
  'data/areas',
  'data/scenarios',
  'data/osm',
  'data/generated/download-helpers'
];

for (const dir of dirs) {
  const fullPath = path.join(rootDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

// Helper to check if JSON matches
function jsonMatches(filePath, expectedObj) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return JSON.stringify(existing) === JSON.stringify(expectedObj);
  } catch (e) {
    return false;
  }
}

// Write Area JSON
const areaFilePath = path.join(rootDir, 'data/areas', `${preset.areaId}.area.json`);
let areaCreated = false;
if (!fs.existsSync(areaFilePath) || force) {
  fs.writeFileSync(areaFilePath, JSON.stringify(preset.areaJson, null, 2), 'utf8');
  areaCreated = true;
  console.log(`Area created/updated: ${preset.areaId}`);
} else {
  if (!jsonMatches(areaFilePath, preset.areaJson)) {
    console.warn(`Warning: Existing area JSON ${preset.areaId} differs from preset. Use --force to overwrite.`);
  } else {
    console.log(`Area verified: ${preset.areaId}`);
  }
}

// Write Scenario JSON
const scenarioFilePath = path.join(rootDir, 'data/scenarios', `${presetId}.scenario.json`);
let scenarioCreated = false;
if (!fs.existsSync(scenarioFilePath) || force) {
  fs.writeFileSync(scenarioFilePath, JSON.stringify(preset.scenarioJson, null, 2), 'utf8');
  scenarioCreated = true;
  console.log(`Scenario preset created/updated: ${presetId}`);
} else {
  if (!jsonMatches(scenarioFilePath, preset.scenarioJson)) {
    console.warn(`Warning: Existing scenario JSON ${presetId} differs from preset. Use --force to overwrite.`);
  } else {
    console.log(`Scenario verified: ${presetId}`);
  }
}

// Generate BBBike Helper
const helperPath = path.join(rootDir, 'data/generated/download-helpers', `${preset.areaId}-bbbike-download.html`);
const helperHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BBBike Download Helper - ${preset.areaId}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        .bbox { background: #eef; padding: 10px; border-left: 4px solid #33f; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>BBBike Download Helper</h1>
    <p>This helper assists you in downloading the required OpenStreetMap data for the <strong>${preset.areaId}</strong> area.</p>
    
    <h2>Instructions</h2>
    <ol>
        <li>Open the <a href="https://extract.bbbike.org/" target="_blank">BBBike extract service</a>.</li>
        <li>Create or select the bounding box using the following coordinates:
            <div class="bbox">
                <strong>West:</strong> ${preset.areaJson.bounds.west}<br>
                <strong>South:</strong> ${preset.areaJson.bounds.south}<br>
                <strong>East:</strong> ${preset.areaJson.bounds.east}<br>
                <strong>North:</strong> ${preset.areaJson.bounds.north}
            </div>
        </li>
        <li>Select Format: <strong>Protocolbuffer (PBF)</strong></li>
        <li>Name of area to extract: <code>${preset.areaId}</code></li>
        <li>Enter your email address.</li>
        <li>Click <strong>extract</strong>.</li>
        <li>Wait for the email and download the resulting <code>.osm.pbf</code> file.</li>
        <li>Save or rename the file exactly to: <code>data/osm/${preset.areaId}.osm.pbf</code></li>
        <li>Run the setup command again: <code>pnpm scenario:setup:hamburg</code></li>
    </ol>
    
    <p><em>Note: A convenience URL with query parameters might be: <a href="https://extract.bbbike.org/?sw_lng=${preset.areaJson.bounds.west}&sw_lat=${preset.areaJson.bounds.south}&ne_lng=${preset.areaJson.bounds.east}&ne_lat=${preset.areaJson.bounds.north}&format=pbf&name=${preset.areaId}" target="_blank">BBBike with coordinates</a> (best-effort only).</em></p>
</body>
</html>`;

fs.writeFileSync(helperPath, helperHtml, 'utf8');

// Always run build-scenario-registry.mjs
console.log('Running build-scenario-registry.mjs...');
const registryResult = child_process.spawnSync('node', ['scripts/scenarios/build-scenario-registry.mjs'], { stdio: 'inherit', cwd: rootDir });
if (registryResult.status !== 0) {
  fail('Failed to rebuild scenario registry.');
}

// Generate scenario demand
if (preset.sourceMaterialManifest) {
  const manifestPath = path.join(rootDir, preset.sourceMaterialManifest);
  if (!fs.existsSync(manifestPath)) {
    fail(`Required source-material manifest missing: ${preset.sourceMaterialManifest}\nExpected it to exist for preset ${presetId}.`);
  }
  console.log(`Running build-scenario-demand.mjs with manifest for ${presetId}...`);
  const demandResult = child_process.spawnSync('node', [
    'scripts/scenario-demand/build-scenario-demand.mjs',
    '--manifest', preset.sourceMaterialManifest
  ], { stdio: 'inherit', cwd: rootDir });
  if (demandResult.status !== 0) {
    fail(`Failed to generate scenario demand for ${presetId} via manifest.`);
  }
} else {
  const seedPath = path.join(rootDir, 'data/scenario-demand', `${presetId}.seed.json`);
  if (fs.existsSync(seedPath)) {
    console.log(`Running build-scenario-demand.mjs for ${presetId}...`);
    const demandOut = path.join(rootDir, 'apps/web/public/generated/scenarios', `${presetId}.demand.json`);
    const demandResult = child_process.spawnSync('node', [
      'scripts/scenario-demand/build-scenario-demand.mjs',
      '--input', seedPath,
      '--output', demandOut
    ], { stdio: 'inherit', cwd: rootDir });
    if (demandResult.status !== 0) {
      fail(`Failed to generate scenario demand for ${presetId}.`);
    }
  }
}


const pbfPath = path.join(rootDir, preset.areaJson.sourcePbfFile);
const pbfExists = fs.existsSync(pbfPath);

if (!prepareAssets) {
  if (!pbfExists) {
    console.log(`\nMissing required source PBF:\n  ${preset.areaJson.sourcePbfFile}`);
    console.log(`\nOpen the BBBike helper:\n  data/generated/download-helpers/${preset.areaId}-bbbike-download.html`);
    console.log(`\nAfter downloading, save the file as:\n  ${preset.areaJson.sourcePbfFile}`);
  }
  console.log(`\nTo prepare assets, run again with --prepare-assets or:\n  pnpm scenario:setup:hamburg`);
  process.exit(0);
}

if (!pbfExists) {
  console.log(`\nSource PBF missing. Skipping asset preparation.`);
  console.log(`Missing required source PBF:\n  ${preset.areaJson.sourcePbfFile}`);
  console.log(`\nOpen the BBBike helper:\n  data/generated/download-helpers/${preset.areaId}-bbbike-download.html`);
  console.log(`\nAfter downloading, save the file as:\n  ${preset.areaJson.sourcePbfFile}`);
  console.log(`\nThen run again:\n  pnpm scenario:setup:hamburg`);
  process.exit(0);
}

console.log(`\nSource PBF found.`);
console.log(`Preparing local assets for area ${preset.areaId}...`);

const assetResult = child_process.spawnSync('node', ['scripts/local-assets/prepare-local-assets.mjs', '--area', preset.areaId], { stdio: 'inherit', cwd: rootDir });
if (assetResult.status !== 0) {
  fail(`Failed to prepare local assets for area ${preset.areaId}.`);
}

console.log(`\nSetup complete for preset ${presetId}.`);
