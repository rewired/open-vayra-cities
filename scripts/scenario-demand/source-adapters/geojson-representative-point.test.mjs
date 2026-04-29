import assert from 'node:assert';
import { getGeoJsonRepresentativePoint } from './geojson-representative-point.mjs';

function testValidPoint() {
  console.log('Testing valid Point...');
  const geom = {
    type: 'Point',
    coordinates: [10.0, 53.5]
  };
  const result = getGeoJsonRepresentativePoint(geom);
  assert.strictEqual(result.longitude, 10.0);
  assert.strictEqual(result.latitude, 53.5);
}

function testValidPolygon() {
  console.log('Testing valid Polygon...');
  const geom = {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
  };
  const result = getGeoJsonRepresentativePoint(geom);
  assert.strictEqual(result.longitude, 5);
  assert.strictEqual(result.latitude, 5);
}

function testValidMultiPolygon() {
  console.log('Testing valid MultiPolygon...');
  const geom = {
    type: 'MultiPolygon',
    coordinates: [
      [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
      [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
    ]
  };
  const result = getGeoJsonRepresentativePoint(geom);
  assert.strictEqual(result.longitude, 15);
  assert.strictEqual(result.latitude, 15);
}

function testMissingGeometry() {
  console.log('Testing missing geometry...');
  assert.throws(() => {
    getGeoJsonRepresentativePoint(null);
  }, /Missing or invalid geometry/);
}

function testUnsupportedGeometry() {
  console.log('Testing unsupported geometry...');
  const geom = {
    type: 'LineString',
    coordinates: [[0, 0], [10, 10]]
  };
  assert.throws(() => {
    getGeoJsonRepresentativePoint(geom);
  }, /Unsupported geometry type/);
}

function testMalformedCoordinates() {
  console.log('Testing malformed coordinates...');
  const geom = {
    type: 'Point',
    coordinates: [10.0]
  };
  assert.throws(() => {
    getGeoJsonRepresentativePoint(geom);
  }, /Malformed Point geometry/);
}

function testNonFiniteCoordinates() {
  console.log('Testing non-finite coordinates...');
  const geom = {
    type: 'Point',
    coordinates: [Infinity, 53.5]
  };
  assert.throws(() => {
    getGeoJsonRepresentativePoint(geom);
  }, /Non-finite longitude detected/);
}

function testOutOfBoundsCoordinates() {
  console.log('Testing out of bounds coordinates...');
  const geom = {
    type: 'Point',
    coordinates: [190.0, 53.5]
  };
  assert.throws(() => {
    getGeoJsonRepresentativePoint(geom);
  }, /Out-of-bounds longitude detected/);
}

function runAll() {
  testValidPoint();
  testValidPolygon();
  testValidMultiPolygon();
  testMissingGeometry();
  testUnsupportedGeometry();
  testMalformedCoordinates();
  testNonFiniteCoordinates();
  testOutOfBoundsCoordinates();
  console.log('--- All GeoJSON Representative Point Tests Passed ---');
}

runAll();
