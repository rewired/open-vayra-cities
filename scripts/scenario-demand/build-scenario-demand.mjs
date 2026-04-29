import fs from 'fs';
import path from 'path';
import proj4 from 'proj4';
import { parseCensusGridCsv } from './source-adapters/census-grid-csv.mjs';
import { parseWorkplaceAttractorGeoJson } from './source-adapters/workplace-attractor-geojson.mjs';
import {
  RESIDENTIAL_GRID_SUBDIVISION_PER_AXIS,
  RESIDENTIAL_GRID_CELL_SIZE_METERS,
  WORKPLACE_RUNTIME_MAX_DESTINATION_NODES
} from './constants.mjs';

proj4.defs('EPSG:3035', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');


const CANONICAL_TIME_BANDS = [
  'morning-rush',
  'late-morning',
  'midday',
  'afternoon',
  'evening-rush',
  'evening',
  'night'
];

const CENSUS_GRID_RESIDENTIAL_TIME_BANDS = {
  'morning-rush': 1.5,
  'late-morning': 0.7,
  'midday': 0.4,
  'afternoon': 1.0,
  'evening-rush': 0.8,
  'evening': 0.5,
  'night': 0.1
};

const WORKPLACE_ATTRACTOR_TIME_BANDS = {
  'morning-rush': 1.5,
  'late-morning': 0.8,
  'midday': 1.0,
  'afternoon': 1.0,
  'evening-rush': 1.5,
  'evening': 0.5,
  'night': 0.1
};

const MAX_WORKPLACE_ATTRACTOR_SOURCE_FEATURES_FOR_DIRECT_PREVIEW = 5000;
const WORKPLACE_ATTRACTOR_AGGREGATION_CELL_METERS = 500;

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

  let finalScenarioId = null;
  let finalGeneratorName = 'open-vayra-cities-scenario-demand-generator';
  let finalNodes = [];
  let finalAttractors = [];
  let finalGateways = [];
  let finalGeneratedFrom = [];
  let finalNotes = '';
  let residentialSourceRows = 0;
  let residentialRuntimeNodes = 0;
  let residentialSourcePop = 0;
  let residentialRuntimePop = 0;
  let workplaceSourceAttractors = 0;
  let workplaceRuntimeNodes = 0;
  let workplaceAggregationMode = 'direct';

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

    finalScenarioId = manifest.scenarioId;
    if (!manifest.output || typeof manifest.output !== 'object') {
      fail('Manifest missing output object.');
    }
    if (typeof manifest.output.demandArtifactPath !== 'string') {
      fail('Manifest output missing demandArtifactPath.');
    }
    outputPath = manifest.output.demandArtifactPath;

    const enabledSources = manifest.sources.filter(s => s.enabled !== false);
    const supportedKinds = ['manual-seed', 'census-grid', 'workplace-attractors'];

    for (const src of enabledSources) {
      if (!src.kind || typeof src.kind !== 'string') fail(`Source ${src.id || 'unknown'} missing kind.`);
      if (!supportedKinds.includes(src.kind)) {
        fail(`Source kind ${src.kind} is configured but no adapter exists yet.`);
      }
    }

    const manualSeeds = enabledSources.filter(s => s.kind === 'manual-seed');
    if (manualSeeds.length > 1) {
      fail('Only one enabled manual seed is supported for now.');
    }

    for (const src of enabledSources) {
      if (src.kind === 'manual-seed') {
        if (!src.path || typeof src.path !== 'string') fail(`Source ${src.id} missing path.`);
        if (!fs.existsSync(src.path)) fail(`Input file not found: ${src.path}`);

        let seed;
        try {
          seed = JSON.parse(fs.readFileSync(src.path, 'utf8'));
        } catch (e) {
          fail(`Failed to parse input JSON: ${e.message}`);
        }

        if (!seed || typeof seed !== 'object' || Array.isArray(seed)) {
          fail(`Seed from source ${src.id} must be a JSON object.`);
        }
        if (seed.scenarioId !== finalScenarioId) {
          fail(`Seed scenarioId (${seed.scenarioId}) does not match manifest scenarioId (${finalScenarioId}).`);
        }

        if (seed.generatorName) finalGeneratorName = seed.generatorName;

        if (seed.sourceMetadata && Array.isArray(seed.sourceMetadata.generatedFrom)) {
          finalGeneratedFrom.push(...seed.sourceMetadata.generatedFrom);
        }
        finalGeneratedFrom.push({
          sourceKind: 'manual',
          label: src.label || 'Manual Seed',
          ...(src.attribution ? { attributionHint: src.attribution } : {}),
          ...(src.datasetYear ? { datasetYear: src.datasetYear } : {})
        });

        if (seed.sourceMetadata && seed.sourceMetadata.notes) {
          finalNotes = finalNotes ? `${finalNotes}\n${seed.sourceMetadata.notes}` : seed.sourceMetadata.notes;
        }

        if (Array.isArray(seed.nodes)) finalNodes.push(...seed.nodes);
        if (Array.isArray(seed.attractors)) finalAttractors.push(...seed.attractors);
        if (Array.isArray(seed.gateways)) finalGateways.push(...seed.gateways);

      } else if (src.kind === 'census-grid') {
        if (src.adapter !== 'census-grid-csv') {
          fail(`Unsupported adapter ${src.adapter || 'missing'} for kind census-grid.`);
        }
        if (!src.options || typeof src.options !== 'object') {
          fail(`census-grid source ${src.id} missing valid options object.`);
        }
        const opt = src.options;
        if (typeof opt.idColumn !== 'string' || !opt.idColumn) fail(`census-grid source ${src.id} missing idColumn option.`);
        if (typeof opt.longitudeColumn !== 'string' || !opt.longitudeColumn) fail(`census-grid source ${src.id} missing longitudeColumn option.`);
        if (typeof opt.latitudeColumn !== 'string' || !opt.latitudeColumn) fail(`census-grid source ${src.id} missing latitudeColumn option.`);
        if (typeof opt.populationColumn !== 'string' || !opt.populationColumn) fail(`census-grid source ${src.id} missing populationColumn option.`);

        if (!src.path || typeof src.path !== 'string') fail(`census-grid source ${src.id} missing path.`);
        if (!fs.existsSync(src.path)) fail(`CSV file not found: ${src.path}`);

        let records;
        try {
          records = parseCensusGridCsv(src.path, opt);
        } catch (err) {
          fail(`Adapter failure for source ${src.id}: ${err.message}`);
        }

        residentialSourceRows += records.length;
        const N = RESIDENTIAL_GRID_SUBDIVISION_PER_AXIS;
        const L = RESIDENTIAL_GRID_CELL_SIZE_METERS;
        const S = L / N;
        const offsetStart = -L / 2 + S / 2;

        for (const record of records) {
          residentialSourcePop += record.population;
          
          // Project WGS84 midpoint to EPSG:3035
          let x, y;
          try {
            const converted = proj4('EPSG:4326', 'EPSG:3035', [record.longitude, record.latitude]);
            x = converted[0];
            y = converted[1];
          } catch (err) {
            fail(`Failed to project coordinates for grid ${record.id}: ${err.message}`);
          }

          const subWeight = record.population / (N * N);

          for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
              const x_sub = x + offsetStart + i * S;
              const y_sub = y + offsetStart + j * S;

              let lng_sub, lat_sub;
              try {
                const converted = proj4('EPSG:3035', 'EPSG:4326', [x_sub, y_sub]);
                lng_sub = converted[0];
                lat_sub = converted[1];
              } catch (err) {
                fail(`Failed to project subnode coordinates for grid ${record.id} sub ${i}_${j}: ${err.message}`);
              }

              residentialRuntimeNodes++;
              residentialRuntimePop += subWeight;
              
              finalNodes.push({
                id: `${src.id}-${record.id}-sub-${i}-${j}`,
                position: { lng: lng_sub, lat: lat_sub },
                role: 'origin',
                class: 'residential',
                baseWeight: subWeight,
                timeBandWeights: CENSUS_GRID_RESIDENTIAL_TIME_BANDS,
                sourceTrace: {
                  sourceId: src.id,
                  gridId: record.id,
                  subnodeIndex: `${i}_${j}`
                }
              });
            }
          }
        }

        finalGeneratedFrom.push({
          sourceKind: 'census',
          label: src.label || 'Census Grid',
          ...(src.attribution ? { attributionHint: src.attribution } : {}),
          ...(src.datasetYear ? { datasetYear: src.datasetYear } : {})
        });

      } else if (src.kind === 'workplace-attractors') {
        if (src.adapter !== 'workplace-attractor-geojson') {
          fail(`Unsupported adapter ${src.adapter || 'missing'} for kind workplace-attractors.`);
        }
        const opt = src.options || {};

        if (!src.path || typeof src.path !== 'string') fail(`workplace-attractors source ${src.id} missing path.`);
        if (!fs.existsSync(src.path)) fail(`GeoJSON file not found: ${src.path}`);

        let records;
        try {
          records = parseWorkplaceAttractorGeoJson(src.path, opt);
        } catch (err) {
          fail(`Adapter failure for source ${src.id}: ${err.message}`);
        }

        workplaceSourceAttractors += records.length;
        let workplaceNodes = [];
        const sourceCount = records.length;
        let isAggregated = false;
        
        if (sourceCount > MAX_WORKPLACE_ATTRACTOR_SOURCE_FEATURES_FOR_DIRECT_PREVIEW) {
          isAggregated = true;
          workplaceAggregationMode = 'aggregated';
          let sumLat = 0;
          for (const rec of records) {
            sumLat += rec.latitude;
          }
          const avgLat = records.length > 0 ? sumLat / records.length : 53.5;
          const metersPerDegreeLat = 111320;
          const metersPerDegreeLng = 111320 * Math.cos(avgLat * Math.PI / 180);
          const latDelta = WORKPLACE_ATTRACTOR_AGGREGATION_CELL_METERS / metersPerDegreeLat;
          const lngDelta = WORKPLACE_ATTRACTOR_AGGREGATION_CELL_METERS / metersPerDegreeLng;
          
          const buckets = new Map();
          for (const record of records) {
            const bucketX = Math.floor(record.longitude / lngDelta);
            const bucketY = Math.floor(record.latitude / latDelta);
            const category = record.category || 'workplace';
            const bucketKey = `${bucketX}_${bucketY}_${category}`;
            
            if (!buckets.has(bucketKey)) {
              buckets.set(bucketKey, {
                bucketX,
                bucketY,
                category,
                sumLng: 0,
                sumLat: 0,
                count: 0,
                weight: 0
              });
            }
            const b = buckets.get(bucketKey);
            b.sumLng += record.longitude;
            b.sumLat += record.latitude;
            b.count++;
            b.weight += record.weight;
          }
          
          for (const b of buckets.values()) {
            const avgLng = b.sumLng / b.count;
            const avgLat = b.sumLat / b.count;
            workplaceNodes.push({
              id: `${finalScenarioId}-workplace-${b.bucketX}-${b.bucketY}-${b.category}`,
              position: { lng: avgLng, lat: avgLat },
              role: 'destination',
              class: 'workplace',
              baseWeight: b.weight,
              timeBandWeights: WORKPLACE_ATTRACTOR_TIME_BANDS,
              sourceTrace: {
                sourceId: src.id,
                bucketX: b.bucketX,
                bucketY: b.bucketY,
                category: b.category,
                aggregatedFeatureCount: b.count
              }
            });
          }
        } else {
          workplaceAggregationMode = 'direct';
          for (const record of records) {
            workplaceNodes.push({
              id: `${src.id}-${record.id}`,
              position: { lng: record.longitude, lat: record.latitude },
              role: 'destination',
              class: 'workplace',
              baseWeight: record.weight,
              timeBandWeights: WORKPLACE_ATTRACTOR_TIME_BANDS,
              sourceTrace: {
                sourceId: src.id,
                featureId: record.id
              }
            });
          }
        }
        
        if (workplaceNodes.length > WORKPLACE_RUNTIME_MAX_DESTINATION_NODES) {
          console.warn(`[Warning] Workplace node count (${workplaceNodes.length}) exceeds hard limit (${WORKPLACE_RUNTIME_MAX_DESTINATION_NODES}). Truncating deterministically.`);
          workplaceNodes.sort((a, b) => b.baseWeight - a.baseWeight);
          workplaceNodes = workplaceNodes.slice(0, WORKPLACE_RUNTIME_MAX_DESTINATION_NODES);
        }
        
        workplaceRuntimeNodes += workplaceNodes.length;
        finalNodes.push(...workplaceNodes);

        finalGeneratedFrom.push({
          sourceKind: 'osm',
          label: src.label || 'Workplace Attractors',
          ...(src.attribution ? { attributionHint: src.attribution } : {}),
          ...(src.datasetYear ? { datasetYear: src.datasetYear } : {})
        });
      }
    }

  } else {
    // Direct fallback
    if (!fs.existsSync(inputPath)) fail(`Input file not found: ${inputPath}`);

    let seed;
    try {
      seed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    } catch (e) {
      fail(`Failed to parse input JSON: ${e.message}`);
    }

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

    finalScenarioId = seed.scenarioId;
    if (seed.generatorName) finalGeneratorName = seed.generatorName;
    finalGeneratedFrom = [...seed.sourceMetadata.generatedFrom];
    if (seed.sourceMetadata.notes) {
      finalNotes = seed.sourceMetadata.notes;
    }

    finalNodes = seed.nodes;
    finalAttractors = seed.attractors;
    finalGateways = seed.gateways;
  }

  // Enforce unique IDs
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

  // Process and validate Nodes
  const nodes = finalNodes.map(n => {
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
      timeBandWeights: { ...n.timeBandWeights },
      ...(n.sourceTrace ? { sourceTrace: { ...n.sourceTrace } } : {})
    };
  });

  // Process and validate Attractors
  const attractors = finalAttractors.map(a => {
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
      ...(a.timeBandWeights ? { timeBandWeights: { ...a.timeBandWeights } } : {}),
      ...(a.sourceTrace ? { sourceTrace: { ...a.sourceTrace } } : {})
    };
  });

  // Process and validate Gateways
  const gateways = finalGateways.map(g => {
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
      timeBandWeights: { ...g.timeBandWeights },
      ...(g.sourceTrace ? { sourceTrace: { ...g.sourceTrace } } : {})
    };
  });

  const artifact = {
    schemaVersion: 1,
    scenarioId: finalScenarioId,
    generatedAt: new Date().toISOString(),
    sourceMetadata: {
      generatedFrom: finalGeneratedFrom,
      generatorName: finalGeneratorName,
      generatorVersion: '0.1.0',
      ...(finalNotes ? { notes: finalNotes } : {})
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
  console.log(`Residential source cells: ${residentialSourceRows}`);
  console.log(`Residential runtime nodes: ${residentialRuntimeNodes}`);
  console.log(`Residential subdivision: ${RESIDENTIAL_GRID_SUBDIVISION_PER_AXIS}x${RESIDENTIAL_GRID_SUBDIVISION_PER_AXIS}`);
  console.log(`Residential population weight: source=${residentialSourcePop} runtime=${residentialRuntimePop}`);
  console.log(`Workplace source features: ${workplaceSourceAttractors}`);
  console.log(`Workplace runtime destination nodes: ${workplaceRuntimeNodes}`);
  console.log(`Workplace aggregation: ${workplaceAggregationMode}`);
  console.log(`Generated demand artifact: ${outputPath}`);
}

main();
