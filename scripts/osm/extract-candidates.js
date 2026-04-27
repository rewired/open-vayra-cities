const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
let inputPbf = '';
let outputPath = '';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) inputPbf = args[i + 1];
    if (args[i] === '--output' && args[i + 1]) outputPath = args[i + 1];
}

if (!inputPbf || !outputPath) {
    console.error('Usage: node extract-candidates.js --input <pbf-file> --output <geojson-file>');
    process.exit(1);
}

if (!fs.existsSync(inputPbf)) {
    console.error('Input PBF not found:', inputPbf);
    process.exit(1);
}

const fileBuffer = fs.readFileSync(inputPbf);
const dataView = new DataView(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);

const HEADER_SIZE = 8;
const BLOB_HEADER_SIZE = 4;

function readUInt32BE(buffer, offset) {
    return (buffer.getUint8(offset) << 24) |
        (buffer.getUint8(offset + 1) << 16) |
        (buffer.getUint8(offset + 2) << 8) |
        (buffer.getUint8(offset + 3));
}

function readString(buffer, offset, length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        const char = buffer.getUint8(offset + i);
        if (char === 0) break;
        result += String.fromCharCode(char);
    }
    return result;
}

const magic = readString(dataView, 0, 4);
if (magic !== 'OSM') {
    console.error('Invalid OSM PBF file');
    process.exit(1);
}

const candidates = [];
let offset = HEADER_SIZE;

const processOSMXML = (xmlString) => {
    const lines = xmlString.split('\n');
    let inNode = false;
    let currentTags = {};
    let nodeId = '';
    let nodeLat = 0;
    let nodeLon = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('<node ')) {
            const idMatch = trimmed.match(/id="(\d+)"/);
            const latMatch = trimmed.match(/lat="([^"]+)"/);
            const lonMatch = trimmed.match(/lon="([^"]+)"/);

            if (idMatch) nodeId = idMatch[1];
            if (latMatch) nodeLat = parseFloat(latMatch[1]);
            if (lonMatch) nodeLon = parseFloat(lonMatch[1]);

            inNode = true;
            currentTags = {};
        } else if (trimmed === '</node>' && inNode) {
            let name = '';
            let highway = '';
            let publicTransport = '';

            for (const [key, value] of Object.entries(currentTags)) {
                if (key === 'name') name = value;
                if (key === 'highway') highway = value;
                if (key === 'public_transport') publicTransport = value;
            }

            let kind = '';
            if (highway === 'bus_stop') kind = 'bus-stop';
            else if (publicTransport === 'platform') kind = 'public-transport-platform';
            else if (publicTransport === 'stop_position') kind = 'public-transport-stop-position';

            if (name && kind) {
                candidates.push({
                    candidateId: 'osm:node:' + nodeId,
                    label: name,
                    kind: kind,
                    source: 'osm',
                    osmElementType: 'node',
                    osmElementId: nodeId,
                    lat: nodeLat,
                    lon: nodeLon
                });
            }

            inNode = false;
            nodeId = '';
            currentTags = {};
        } else if (trimmed.startsWith('<tag ')) {
            const kMatch = trimmed.match(/k="([^"]+)"/);
            const vMatch = trimmed.match(/v="([^"]+)"/);

            if (kMatch && vMatch) {
                currentTags[kMatch[1]] = vMatch[1];
            }
        }
    }
};

while (offset < fileBuffer.length) {
    if (offset + BLOB_HEADER_SIZE > fileBuffer.length) break;

    const blobSize = readUInt32BE(dataView, offset);

    if (offset + BLOB_HEADER_SIZE + blobSize > fileBuffer.length) break;

    offset += BLOB_HEADER_SIZE;

    const rawDataOffset = offset + 4;
    const compressedSize = blobSize - 4;
    const compressedData = fileBuffer.slice(rawDataOffset, rawDataOffset + compressedSize);

    try {
        const decompressed = zlib.inflateSync(compressedData);
        const rawData = decompressed.toString('utf8');
        processOSMXML(rawData);
    } catch {
        // Skip invalid blobs
    }

    offset += blobSize;
}

const features = candidates.map((c) => ({
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

const geojson = {
    type: 'FeatureCollection',
    features: features
};

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
console.log('Extracted ' + candidates.length + ' stop candidates to ' + outputPath);