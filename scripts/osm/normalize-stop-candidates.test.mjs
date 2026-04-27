import assert from 'node:assert';
import { 
    extractOsmNodeId, 
    parseOsmiumIntermediateText, 
    normalizeStopCandidateFeatures 
} from './normalize-stop-candidates.mjs';

function runTests() {
    console.log('--- Running Normalizer Tests ---');

    testExtractOsmNodeId();
    testParseOsmiumIntermediateText();
    testNormalizeStopCandidateFeatures();

    console.log('--- All Tests Passed ---');
}

function testExtractOsmNodeId() {
    console.log('Testing extractOsmNodeId...');

    // Accepts
    assert.strictEqual(extractOsmNodeId({ id: 123 }), '123');
    assert.strictEqual(extractOsmNodeId({ id: '123' }), '123');
    assert.strictEqual(extractOsmNodeId({ id: 'node/123' }), '123');
    assert.strictEqual(extractOsmNodeId({ id: 'n123' }), '123');
    assert.strictEqual(extractOsmNodeId({ properties: { id: 123 } }), '123');
    assert.strictEqual(extractOsmNodeId({ properties: { '@id': '123', '@type': 'node' } }), '123');
    assert.strictEqual(extractOsmNodeId({ properties: { '@id': '123' } }), '123'); // Default to node if @type missing

    // Rejects
    assert.strictEqual(extractOsmNodeId({ id: 'w123' }), null);
    assert.strictEqual(extractOsmNodeId({ id: 'a123' }), null);
    assert.strictEqual(extractOsmNodeId({ id: 'way/123' }), null);
    assert.strictEqual(extractOsmNodeId({ id: 'relation/123' }), null);
    assert.strictEqual(extractOsmNodeId({ properties: { '@id': '123', '@type': 'way' } }), null);
    assert.strictEqual(extractOsmNodeId({ id: 'abc' }), null);
    assert.strictEqual(extractOsmNodeId({}), null);
}

function testParseOsmiumIntermediateText() {
    console.log('Testing parseOsmiumIntermediateText...');

    // GeoJSONSeq with \u001e
    const seqInput = '\u001e{"type":"Feature","id":1}\n\u001e{"type":"Feature","id":2}';
    const seqResult = parseOsmiumIntermediateText(seqInput);
    assert.strictEqual(seqResult.length, 2);
    assert.strictEqual(seqResult[0].id, 1);

    // NDJSON
    const ndjsonInput = '{"type":"Feature","id":1}\n{"type":"Feature","id":2}';
    const ndjsonResult = parseOsmiumIntermediateText(ndjsonInput);
    assert.strictEqual(ndjsonResult.length, 2);

    // FeatureCollection
    const fcInput = JSON.stringify({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', id: 1 }, { type: 'Feature', id: 2 }]
    });
    const fcResult = parseOsmiumIntermediateText(fcInput);
    assert.strictEqual(fcResult.length, 2);
}

function testNormalizeStopCandidateFeatures() {
    console.log('Testing normalizeStopCandidateFeatures...');

    const features = [
        {
            type: 'Feature',
            id: 101,
            geometry: { type: 'Point', coordinates: [10, 50] },
            properties: { highway: 'bus_stop', name: 'Bus Stop A' }
        },
        {
            type: 'Feature',
            id: 102,
            geometry: { type: 'Point', coordinates: [10.1, 50.1] },
            properties: { public_transport: 'platform', bus: 'yes', name: 'Platform B' }
        },
        {
            type: 'Feature',
            id: 103,
            geometry: { type: 'Point', coordinates: [10.2, 50.2] },
            properties: { public_transport: 'platform', rail: 'yes', name: 'Train Platform' }
        },
        {
            type: 'Feature',
            id: 'n104',
            geometry: { type: 'Point', coordinates: [10.3, 50.3] },
            properties: { highway: 'bus_stop', name: 'Bus Stop C' }
        }
    ];

    const normalized = normalizeStopCandidateFeatures(features);
    assert.strictEqual(normalized.length, 3);
    assert.strictEqual(normalized[0].candidateId, 'osm:node:101');
    assert.strictEqual(normalized[0].label, 'Bus Stop A');
    assert.strictEqual(normalized[1].candidateId, 'osm:node:102');
    assert.strictEqual(normalized[2].candidateId, 'osm:node:104');
    assert.strictEqual(normalized[2].osmElementId, '104');
}

try {
    runTests();
} catch (err) {
    console.error('Test Failed:');
    console.error(err);
    process.exit(1);
}
