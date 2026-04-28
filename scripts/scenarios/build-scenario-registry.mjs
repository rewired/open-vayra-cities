import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

const areasDir = path.join(rootDir, 'data/areas');
const scenariosDir = path.join(rootDir, 'data/scenarios');
const outputDir = path.join(rootDir, 'apps/web/public/generated/scenarios');
const outputFile = path.join(outputDir, 'scenario-registry.json');

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

// Ensure directories exist
if (!fs.existsSync(areasDir)) fail(`Areas directory missing: ${areasDir}`);
if (!fs.existsSync(scenariosDir)) fail(`Scenarios directory missing: ${scenariosDir}`);

// 1. Read Areas
const areaFiles = fs.readdirSync(areasDir).filter(f => f.endsWith('.area.json'));
const areas = new Map();

for (const file of areaFiles) {
  const filePath = path.join(areasDir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    fail(`Malformed JSON in area file ${file}: ${e.message}`);
  }

  // Validate shape
  if (!data.areaId) fail(`Missing areaId in ${file}`);
  if (!data.displayName) fail(`Missing displayName in ${file}`);
  if (areas.has(data.areaId)) fail(`Duplicate areaId: ${data.areaId}`);

  areas.set(data.areaId, {
    filePath,
    data
  });
}

// 2. Read Scenarios
const scenarioFiles = fs.readdirSync(scenariosDir).filter(f => f.endsWith('.scenario.json'));
const scenarios = [];
const scenarioIds = new Set();

for (const file of scenarioFiles) {
  const filePath = path.join(scenariosDir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    fail(`Malformed JSON in scenario file ${file}: ${e.message}`);
  }

  // Validate shape
  if (!data.scenarioId) fail(`Missing scenarioId in ${file}`);
  if (!data.title) fail(`Missing title in ${file}`);
  if (!data.areaId) fail(`Missing areaId in ${file}`);
  if (scenarioIds.has(data.scenarioId)) fail(`Duplicate scenarioId: ${data.scenarioId}`);

  scenarioIds.add(data.scenarioId);

  // Cross-check areaId
  if (!areas.has(data.areaId)) {
    fail(`Scenario ${data.scenarioId} references unknown areaId: ${data.areaId}`);
  }

  const area = areas.get(data.areaId).data;

  // Check assets
  const missingRequirements = [];
  
  // Check routing asset
  if (area.routing && area.routing.expectedBaseFile) {
    const routingPath = path.resolve(rootDir, area.routing.expectedBaseFile);
    if (!fs.existsSync(routingPath)) {
      missingRequirements.push('routing-osrm-base-file');
    }
  }

  // Check stop candidates asset
  if (area.stopCandidates && area.stopCandidates.expectedGeoJsonFile) {
    const stopCandidatesPath = path.resolve(rootDir, area.stopCandidates.expectedGeoJsonFile);
    if (!fs.existsSync(stopCandidatesPath)) {
      missingRequirements.push('osm-stop-candidates-geojson');
    }
  }

  const status = missingRequirements.length === 0 ? 'ready' : 'missing-assets';

  scenarios.push({
    scenarioId: data.scenarioId,
    title: data.title,
    description: data.description || '',
    areaId: data.areaId,
    status,
    missingRequirements,
    scenario: data
  });

  // Copy associated demand payload if present
  const demandFile = file.replace('.scenario.json', '.demand.json');
  const demandFilePath = path.join(scenariosDir, demandFile);
  if (fs.existsSync(demandFilePath)) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const publicDemandPath = path.join(outputDir, demandFile);
    fs.copyFileSync(demandFilePath, publicDemandPath);
  }
}


// 3. Generate Output
const registry = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scenarios
};

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(registry, null, 2), 'utf8');
console.log(`Successfully generated scenario registry with ${scenarios.length} scenarios.`);
