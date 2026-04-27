import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';

/**
 * Extracts a numeric OSM node ID from a feature, handling various formats.
 * @param {object} feature 
 * @returns {string|null} The numeric ID as a string, or null if not found.
 */
export function extractOsmNodeId(feature) {
    // Priority 1: Top-level ID
    let id = feature.id;
    
    // Priority 2: properties.id
    if (id === undefined || id === null) {
        id = feature.properties?.id;
    }
    
    // Priority 3: properties['@id']
    if (id === undefined || id === null) {
        id = feature.properties?.['@id'];
    }

    if (id === undefined || id === null) return null;

    // Handle "node/123" format
    const idStr = String(id);
    const match = idStr.match(/(?:node\/)?(\d+)/);
    return match ? match[1] : null;
}

/**
 * Parses Osmium intermediate output text, supporting GeoJSONSeq, NDJSON, and FeatureCollection.
 * @param {string} text 
 * @returns {object[]} Array of GeoJSON Features.
 */
export function parseOsmiumIntermediateText(text) {
    if (!text.trim()) return [];

    // Try parsing as a single JSON object first (FeatureCollection)
    try {
        const parsed = JSON.parse(text);
        if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
            return parsed.features;
        }
    } catch {
        // Fall back to line-by-line parsing
    }

    const lines = text.split('\n');
    const features = [];
    let skipCount = 0;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Handle GeoJSONSeq ASCII Record Separator (\u001e)
        const normalizedLine = line.replace(/^\u001e+/, '').trim();
        if (!normalizedLine) continue;

        try {
            const feature = JSON.parse(normalizedLine);
            if (feature.type === 'Feature') {
                features.push(feature);
            } else {
                skipCount++;
            }
        } catch {
            skipCount++;
        }
    }

    if (skipCount > 0 && process.env.NODE_ENV !== 'test') {
        console.warn(`[normalizer] Skipped ${skipCount} invalid JSON lines/records`);
    }

    return features;
}

const EXPLICIT_NON_BUS_MODES = ['rail', 'subway', 'tram', 'ferry', 'light_rail', 'monorail'];

/**
 * Normalizes OSM features into stop candidates.
 * @param {object[]} features 
 * @returns {object[]} Array of stop candidates.
 */
export function normalizeStopCandidateFeatures(features) {
    const candidates = [];
    let skipNonPoint = 0;
    let skipNoId = 0;
    let skipNonBus = 0;
    let skipUnknown = 0;

    for (const feature of features) {
        if (feature.geometry?.type !== 'Point') {
            skipNonPoint++;
            continue;
        }

        const coords = feature.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) {
            skipNonPoint++;
            continue;
        }

        const [lng, lat] = coords;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
            skipNonPoint++;
            continue;
        }

        const id = extractOsmNodeId(feature);
        if (!id) {
            skipNoId++;
            continue;
        }

        const tags = feature.properties || {};
        const osmElementType = 'node'; // Based on extractOsmNodeId logic

        let kind = '';
        let candidateName = '';

        if (tags.highway === 'bus_stop') {
            kind = 'bus-stop';
            candidateName = tags.name || tags.ref || '';
        } else if (tags.public_transport === 'platform') {
            if (EXPLICIT_NON_BUS_MODES.some(mode => tags[mode] || tags.public_transport === mode)) {
                skipNonBus++;
                continue;
            }
            kind = 'public-transport-platform';
            candidateName = tags.name || tags.ref || '';
        } else if (tags.public_transport === 'stop_position') {
            if (EXPLICIT_NON_BUS_MODES.some(mode => tags[mode] || tags.public_transport === mode)) {
                skipNonBus++;
                continue;
            }
            kind = 'public-transport-stop-position';
            candidateName = tags.name || tags.ref || '';
        }

        if (!kind) {
            skipUnknown++;
            continue;
        }

        const label = candidateName || `OSM stop ${id}`;

        candidates.push({
            candidateId: `osm:node:${id}`,
            label,
            kind,
            source: 'osm',
            osmElementType,
            osmElementId: id,
            lat,
            lon: lng
        });
    }

    if (process.env.NODE_ENV !== 'test') {
        if (skipNonPoint > 0) console.warn(`[normalizer] Skipped ${skipNonPoint} features with non-Point geometry`);
        if (skipNoId > 0) console.warn(`[normalizer] Skipped ${skipNoId} features without numeric OSM ID`);
        if (skipNonBus > 0) console.warn(`[normalizer] Skipped ${skipNonBus} non-bus platforms/stops`);
        if (skipUnknown > 0) console.warn(`[normalizer] Skipped ${skipUnknown} features with unknown kind`);
    }

    return candidates;
}

/**
 * Builds a GeoJSON FeatureCollection from stop candidates.
 * @param {object[]} candidates 
 * @returns {object} GeoJSON FeatureCollection.
 */
export function buildStopCandidateFeatureCollection(candidates) {
    // Deduplicate by candidateId
    const seen = new Set();
    const deduplicated = [];
    
    // Sort to ensure stable output
    const sorted = [...candidates].sort((a, b) => {
        const idA = parseInt(a.osmElementId, 10);
        const idB = parseInt(b.osmElementId, 10);
        if (idA !== idB) return idA - idB;
        return a.label.localeCompare(b.label);
    });

    for (const c of sorted) {
        if (!seen.has(c.candidateId)) {
            seen.add(c.candidateId);
            deduplicated.push(c);
        }
    }

    const features = deduplicated.map(c => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [c.lon, c.lat]
        },
        properties: {
            candidateId: c.candidateId,
            label: c.label,
            kind: c.kind,
            source: c.source,
            osmElementType: c.osmElementType,
            osmElementId: c.osmElementId
        }
    }));

    return {
        type: 'FeatureCollection',
        features
    };
}

// CLI Entrypoint
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('normalize-stop-candidates.mjs')) {
    const args = process.argv.slice(2);
    let inputPath = '';
    let outputPath = '';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && args[i + 1]) inputPath = args[i + 1];
        if (args[i] === '--output' && args[i + 1]) outputPath = args[i + 1];
    }

    if (!inputPath || !outputPath) {
        console.error('Usage: node normalize-stop-candidates.mjs --input <geojsonseq-file> --output <geojson-file>');
        process.exit(1);
    }

    if (!existsSync(inputPath)) {
        console.error('Input file not found:', inputPath);
        process.exit(1);
    }

    try {
        const inputText = readFileSync(inputPath, 'utf8');
        const rawFeatures = parseOsmiumIntermediateText(inputText);
        const candidates = normalizeStopCandidateFeatures(rawFeatures);
        const geojson = buildStopCandidateFeatureCollection(candidates);

        const outputDir = dirname(outputPath);
        if (!existsSync(outputDir)) {
            console.error('Output directory does not exist:', outputDir);
            process.exit(1);
        }

        writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
        console.log(`[normalizer] Processed ${rawFeatures.length} records`);
        console.log(`[normalizer] Emitted ${geojson.features.length} stop candidates to ${outputPath}`);
    } catch (err) {
        console.error('[normalizer] Error processing candidates:', err.message);
        process.exit(1);
    }
}