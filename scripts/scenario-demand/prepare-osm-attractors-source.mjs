import fs from 'node:fs';
import path from 'node:path';
import { getGeoJsonRepresentativePoint } from './source-adapters/geojson-representative-point.mjs';

/**
 * Exit with an error message.
 * @param {string} msg
 */
function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  let scenarioPath = null;
  let inputPath = null;
  let outputPath = null;
  let manifestOutputPath = null;
  let allowFixtureResidential = false;
  let rejectUnsupportedGeometries = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario') {
      scenarioPath = args[i + 1];
      i++;
    } else if (args[i] === '--input') {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output') {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--manifest-output') {
      manifestOutputPath = args[i + 1];
      i++;
    } else if (args[i] === '--allow-fixture-residential') {
      allowFixtureResidential = true;
    } else if (args[i] === '--reject-unsupported-geometries') {
      rejectUnsupportedGeometries = true;
    }
  }

  if (!scenarioPath || !inputPath || !outputPath || !manifestOutputPath) {
    fail('Missing required arguments: --scenario, --input, --output, --manifest-output');
  }

  if (!fs.existsSync(scenarioPath)) {
    fail(`Scenario file not found: ${scenarioPath}`);
  }
  if (!fs.existsSync(inputPath)) {
    fail(`Input file not found: ${inputPath}`);
  }

  let scenario;
  try {
    scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
  } catch (err) {
    fail(`Failed to parse scenario JSON: ${err.message}`);
  }

  const bounds = scenario.playableBounds;
  if (!bounds) {
    fail('Scenario is missing playableBounds.');
  }

  let geojson;
  try {
    geojson = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (err) {
    fail(`Failed to parse input GeoJSON: ${err.message}`);
  }

  if (!geojson || typeof geojson !== 'object') {
    fail('GeoJSON root must be an object');
  }
  if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    fail('Input must be a GeoJSON FeatureCollection with a features array.');
  }

  const TAG_MAPPINGS = [
    { key: 'amenity', value: 'school', category: 'education', scale: 'district', weight: 200 },
    { key: 'amenity', value: 'university', category: 'education', scale: 'major', weight: 500 },
    { key: 'amenity', value: 'college', category: 'education', scale: 'district', weight: 300 },
    { key: 'amenity', value: 'hospital', category: 'health', scale: 'major', weight: 500 },
    { key: 'amenity', value: 'clinic', category: 'health', scale: 'district', weight: 150 },
    { key: 'amenity', value: 'townhall', category: 'civic', scale: 'district', weight: 100 },
    { key: 'office', value: '*', category: 'workplace-office', scale: 'district', weight: 100 },
    { key: 'shop', value: '*', category: 'retail', scale: 'local', weight: 50 },
    { key: 'tourism', value: 'attraction', category: 'leisure-tourism', scale: 'district', weight: 200 },
    { key: 'tourism', value: 'museum', category: 'leisure-tourism', scale: 'district', weight: 150 },
    { key: 'leisure', value: 'sports_centre', category: 'leisure-tourism', scale: 'district', weight: 100 },
    { key: 'leisure', value: 'stadium', category: 'leisure-tourism', scale: 'major', weight: 1000 },
    { key: 'landuse', value: 'commercial', category: 'workplace-commercial', scale: 'district', weight: 300 },
    { key: 'landuse', value: 'retail', category: 'retail', scale: 'district', weight: 300 },
    { key: 'landuse', value: 'industrial', category: 'workplace-industrial', scale: 'major', weight: 500 }
  ];

  const knownIds = new Set();
  const outputFeatures = [];

  for (let i = 0; i < geojson.features.length; i++) {
    const feature = geojson.features[i];
    if (!feature || typeof feature !== 'object') continue;

    const props = feature.properties || {};

    // Find matching tag mapping
    let bestMapping = null;
    let matchedKey = null;
    let matchedValue = null;

    for (const mapping of TAG_MAPPINGS) {
      if (props[mapping.key]) {
        if (mapping.value === '*' || props[mapping.key] === mapping.value) {
          bestMapping = mapping;
          matchedKey = mapping.key;
          matchedValue = props[mapping.key];
          break;
        }
      }
    }

    if (!bestMapping) continue;

    // Geometry handling
    let position = null;
    try {
      position = getGeoJsonRepresentativePoint(feature.geometry, `features[${i}]`);
    } catch (err) {
      if (rejectUnsupportedGeometries) {
        fail(`Feature at index ${i} failed geometry evaluation: ${err.message}`);
      } else {
        console.warn(`Skipping feature at index ${i} due to unsupported/invalid geometry: ${err.message}`);
        continue;
      }
    }

    const lng = position.longitude;
    const lat = position.latitude;

    // Bounds check
    if (lng < bounds.west || lng > bounds.east || lat < bounds.south || lat > bounds.north) {
      continue;
    }

    // Determine stable ID
    let id = props['@id'] || props['id'];
    const type = props['@type'] || 'node';
    if (id) {
      id = `${type}-${id}`;
    } else {
      id = `osm-${i}`;
    }

    if (knownIds.has(id)) {
      fail(`Duplicate stable ID detected: ${id}. Row context features[${i}].`);
    }
    knownIds.add(id);

    // Determine Name
    const name = props['name'] || props['operator'] || `${bestMapping.category}-${id}`;

    outputFeatures.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        id,
        name,
        category: bestMapping.category,
        scale: bestMapping.scale,
        weight: bestMapping.weight,
        sourceTag: `${matchedKey}=${matchedValue}`
      }
    });
  }

  // Write output GeoJSON
  const outputCollection = {
    type: 'FeatureCollection',
    features: outputFeatures
  };

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(outputCollection, null, 2), 'utf8');
  console.log(`Normalized attractor GeoJSON created: ${outputPath} (${outputFeatures.length} points retained)`);

  // Generate combined Manifest
  const scenarioId = scenario.scenarioId;
  const censusNormalizedPath = `data/generated/scenario-source-material/${scenarioId}/residential-grid.normalized.csv`;
  
  let censusSource = null;
  if (fs.existsSync(censusNormalizedPath)) {
    censusSource = {
      id: `${scenarioId}-residential-grid-local-census`,
      kind: 'census-grid',
      label: 'Local Census Grid',
      path: censusNormalizedPath,
      adapter: 'census-grid-csv',
      enabled: true,
      options: {
        idColumn: 'grid_id',
        longitudeColumn: 'lng',
        latitudeColumn: 'lat',
        populationColumn: 'population',
        delimiter: ','
      }
    };
  } else {
    if (!allowFixtureResidential) {
      fail(`Local census normalized file does not exist at ${censusNormalizedPath}.\nPlease run: pnpm scenario-demand:prepare-census:${scenarioId}`);
    }
  }

  const generatedManifest = {
    schemaVersion: 1,
    scenarioId,
    manifestId: `${scenarioId}-local-demand-source-material`,
    description: `Local manifest combining residential census points and OSM attractors for scenario ${scenarioId}.`,
    sources: [
      {
        id: `${scenarioId}-workplace-attractors-osm`,
        kind: 'workplace-attractors',
        label: 'OSM Workplace Attractors',
        path: outputPath,
        adapter: 'workplace-attractor-geojson',
        enabled: true,
        options: {
          idProperty: 'id',
          labelProperty: 'name',
          weightProperty: 'weight',
          scaleProperty: 'scale'
        }
      }
    ],
    output: {
      demandArtifactPath: `apps/web/public/generated/scenarios/${scenarioId}.demand.json`
    }
  };

  if (censusSource) {
    generatedManifest.sources.unshift(censusSource);
  }

  const manifestDir = path.dirname(manifestOutputPath);
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  fs.writeFileSync(manifestOutputPath, JSON.stringify(generatedManifest, null, 2), 'utf8');
  console.log(`Generated local manifest: ${manifestOutputPath}`);
}

main();
