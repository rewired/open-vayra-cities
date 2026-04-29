import fs from 'fs';
import path from 'path';

const CANONICAL_TIME_BANDS = [
  'morning-rush',
  'late-morning',
  'midday',
  'afternoon',
  'evening-rush',
  'evening',
  'night'
];

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function validateTimeBandWeights(weights, context) {
  if (!weights || typeof weights !== 'object') {
    fail(`${context} must have a timeBandWeights object.`);
  }
  for (const band of CANONICAL_TIME_BANDS) {
    const val = weights[band];
    if (val === undefined || typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
      fail(`${context} missing or invalid non-negative weight for time band ${band}.`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outputPath = null;
  let manifestPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output') {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--manifest') {
      manifestPath = args[i + 1];
      i++;
    }
  }

  if (!manifestPath && (!inputPath || !outputPath)) {
    fail('Missing required arguments: --manifest <path> OR (--input <path> --output <path>)');
  }

  if (manifestPath) {
    if (!fs.existsSync(manifestPath)) {
      fail(`Manifest file not found: ${manifestPath}`);
    }
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      fail(`Failed to parse manifest JSON: ${e.message}`);
    }

    if (!manifest || typeof manifest !== 'object') fail('Manifest must be an object.');
    if (typeof manifest.schemaVersion !== 'number') fail('Manifest missing valid schemaVersion.');
    if (typeof manifest.scenarioId !== 'string') fail('Manifest missing valid scenarioId.');
    if (!Array.isArray(manifest.sources)) fail('Manifest missing sources array.');

    const enabledSources = manifest.sources.filter(s => s.enabled !== false);
    const supportedKinds = ['manual-seed'];

    for (const src of enabledSources) {
      if (!src.kind || typeof src.kind !== 'string') fail(`Source ${src.id || 'unknown'} missing kind.`);
      if (!supportedKinds.includes(src.kind)) {
        fail(`Source kind ${src.kind} is configured but no adapter exists yet.`);
      }
    }

    const seedSource = enabledSources.find(s => s.kind === 'manual-seed');
    if (!seedSource) {
      fail('No enabled manual-seed source found in manifest.');
    }

    if (!seedSource.path || typeof seedSource.path !== 'string') {
      fail(`Source ${seedSource.id} missing path.`);
    }

    inputPath = seedSource.path;

    if (!manifest.output || typeof manifest.output !== 'object') {
      fail('Manifest missing output object.');
    }
    if (typeof manifest.output.demandArtifactPath !== 'string') {
      fail('Manifest output missing demandArtifactPath.');
    }
    outputPath = manifest.output.demandArtifactPath;
  }

  if (!fs.existsSync(inputPath)) {
    fail(`Input file not found: ${inputPath}`);
  }

  let seed;
  try {
    seed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (e) {
    fail(`Failed to parse input JSON: ${e.message}`);
  }

  // Validation
  if (!seed || typeof seed !== 'object' || Array.isArray(seed)) {
    fail('Seed must be a JSON object.');
  }

  if (typeof seed.scenarioId !== 'string' || !seed.scenarioId) {
    fail('Seed missing valid scenarioId.');
  }

  if (!seed.sourceMetadata || typeof seed.sourceMetadata !== 'object') {
    fail('Seed missing valid sourceMetadata.');
  }

  if (!Array.isArray(seed.sourceMetadata.generatedFrom)) {
    fail('sourceMetadata missing generatedFrom array.');
  }

  const arrays = ['nodes', 'attractors', 'gateways'];
  for (const key of arrays) {
    if (!Array.isArray(seed[key])) {
      fail(`Seed missing valid ${key} array.`);
    }
  }

  const knownIds = new Set();

  const validateEntity = (entity, type) => {
    if (!entity || typeof entity !== 'object') {
      fail(`Invalid ${type} entry.`);
    }
    if (typeof entity.id !== 'string' || !entity.id) {
      fail(`${type} missing valid id.`);
    }
    if (knownIds.has(entity.id)) {
      fail(`Duplicate entity ID detected: ${entity.id}`);
    }
    knownIds.add(entity.id);

    if (!entity.position || typeof entity.position !== 'object') {
      fail(`${type} ${entity.id} missing position.`);
    }
    const { lng, lat } = entity.position;
    if (typeof lng !== 'number' || !Number.isFinite(lng) || typeof lat !== 'number' || !Number.isFinite(lat)) {
      fail(`${type} ${entity.id} has invalid coordinates.`);
    }
  };

  // Process Nodes
  const nodes = seed.nodes.map(n => {
    validateEntity(n, 'Node');
    if (typeof n.baseWeight !== 'number' || !Number.isFinite(n.baseWeight) || n.baseWeight < 0) {
      fail(`Node ${n.id} has invalid baseWeight.`);
    }
    validateTimeBandWeights(n.timeBandWeights, `Node ${n.id}`);
    return {
      id: n.id,
      position: { lng: n.position.lng, lat: n.position.lat },
      role: n.role,
      class: n.class,
      baseWeight: n.baseWeight,
      timeBandWeights: { ...n.timeBandWeights }
    };
  });

  // Process Attractors
  const attractors = seed.attractors.map(a => {
    validateEntity(a, 'Attractor');
    if (typeof a.sourceWeight !== 'number' || !Number.isFinite(a.sourceWeight) || a.sourceWeight < 0) {
      fail(`Attractor ${a.id} has invalid sourceWeight.`);
    }
    if (typeof a.sinkWeight !== 'number' || !Number.isFinite(a.sinkWeight) || a.sinkWeight < 0) {
      fail(`Attractor ${a.id} has invalid sinkWeight.`);
    }
    if (a.timeBandWeights) {
      validateTimeBandWeights(a.timeBandWeights, `Attractor ${a.id}`);
    }
    return {
      id: a.id,
      position: { lng: a.position.lng, lat: a.position.lat },
      category: a.category,
      scale: a.scale,
      sourceWeight: a.sourceWeight,
      sinkWeight: a.sinkWeight,
      ...(a.timeBandWeights ? { timeBandWeights: { ...a.timeBandWeights } } : {})
    };
  });

  // Process Gateways
  const gateways = seed.gateways.map(g => {
    validateEntity(g, 'Gateway');
    if (typeof g.sourceWeight !== 'number' || !Number.isFinite(g.sourceWeight) || g.sourceWeight < 0) {
      fail(`Gateway ${g.id} has invalid sourceWeight.`);
    }
    if (typeof g.sinkWeight !== 'number' || !Number.isFinite(g.sinkWeight) || g.sinkWeight < 0) {
      fail(`Gateway ${g.id} has invalid sinkWeight.`);
    }
    if (typeof g.transferWeight !== 'number' || !Number.isFinite(g.transferWeight) || g.transferWeight < 0) {
      fail(`Gateway ${g.id} has invalid transferWeight.`);
    }
    validateTimeBandWeights(g.timeBandWeights, `Gateway ${g.id}`);
    return {
      id: g.id,
      position: { lng: g.position.lng, lat: g.position.lat },
      kind: g.kind,
      scale: g.scale,
      sourceWeight: g.sourceWeight,
      sinkWeight: g.sinkWeight,
      transferWeight: g.transferWeight,
      timeBandWeights: { ...g.timeBandWeights }
    };
  });

  const artifact = {
    schemaVersion: 1,
    scenarioId: seed.scenarioId,
    generatedAt: new Date().toISOString(),
    sourceMetadata: {
      generatedFrom: seed.sourceMetadata.generatedFrom,
      generatorName: seed.generatorName || 'open-vayra-cities-scenario-demand-generator',
      generatorVersion: '0.1.0',
      notes: seed.sourceMetadata.notes
    },
    nodes,
    attractors,
    gateways
  };

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2), 'utf8');
  console.log(`Generated scenario demand artifact: ${outputPath}`);
}

main();
