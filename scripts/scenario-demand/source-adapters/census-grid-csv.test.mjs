import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCensusGridCsv } from './census-grid-csv.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '../../../tmp/test-census-adapter');

function setup() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}

function cleanup() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function testValidFixture() {
  console.log('Testing valid CSV fixture...');
  const fixturePath = path.join(__dirname, 'census-grid-csv.fixture.csv');
  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population',
    delimiter: ',',
    sourceKind: 'census-grid'
  };

  const records = parseCensusGridCsv(fixturePath, config);
  assert.strictEqual(records.length, 3);
  
  assert.strictEqual(records[0].id, 'cell_01');
  assert.strictEqual(records[0].longitude, 10.0123);
  assert.strictEqual(records[0].latitude, 53.5511);
  assert.strictEqual(records[0].population, 150);

  assert.strictEqual(records[2].id, 'cell_03');
  assert.strictEqual(records[2].population, 0);
}

function testSemicolonDelimiter() {
  console.log('Testing semicolon delimiter...');
  const filePath = path.join(tempDir, 'semicolon.csv');
  fs.writeFileSync(filePath, 'grid_id;lon;lat;population\ncell_01;10.5;53.2;100\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population',
    delimiter: ';',
    sourceKind: 'census-grid'
  };

  const records = parseCensusGridCsv(filePath, config);
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].longitude, 10.5);
}

function testMissingFile() {
  console.log('Testing missing file fails clearly...');
  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv('non-existent.csv', config);
  }, /File not found/);
}

function testMissingConfiguredColumn() {
  console.log('Testing missing configured column fails...');
  const filePath = path.join(tempDir, 'missing-col.csv');
  fs.writeFileSync(filePath, 'grid_id,lon,lat\ncell_01,10,50\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv(filePath, config);
  }, /Missing configured column: population/);
}

function testInvalidCoordinates() {
  console.log('Testing invalid/non-finite coordinates fail...');
  const filePath = path.join(tempDir, 'invalid-coords.csv');
  fs.writeFileSync(filePath, 'grid_id,lon,lat,population\ncell_01,abc,50,100\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv(filePath, config);
  }, /Row 2: Invalid or non-finite longitude/);
}

function testOutOfRangeCoordinates() {
  console.log('Testing out-of-range coordinates fail...');
  const filePath = path.join(__dirname, 'census-grid-csv.invalid.fixture.csv');
  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv(filePath, config);
  }, /Latitude out of range/);
}

function testNegativePopulation() {
  console.log('Testing negative population fails...');
  const filePath = path.join(tempDir, 'neg-pop.csv');
  fs.writeFileSync(filePath, 'grid_id,lon,lat,population\ncell_01,10,50,-5\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv(filePath, config);
  }, /Row 2: Population cannot be negative/);
}

function testNonFinitePopulation() {
  console.log('Testing non-finite population fails...');
  const filePath = path.join(tempDir, 'non-finite-pop.csv');
  fs.writeFileSync(filePath, 'grid_id,lon,lat,population\ncell_01,10,50,Infinity\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv(filePath, config);
  }, /Row 2: Invalid or non-finite population/);
}

function testDuplicateGridIds() {
  console.log('Testing duplicate grid ids fail...');
  const filePath = path.join(tempDir, 'dup-ids.csv');
  fs.writeFileSync(filePath, 'grid_id,lon,lat,population\ncell_01,10,50,10\ncell_01,11,51,20\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv(filePath, config);
  }, /Row 3: Duplicate grid id detected: cell_01/);
}

function testEmptyLinesIgnored() {
  console.log('Testing empty lines are ignored safely...');
  const filePath = path.join(tempDir, 'empty-lines.csv');
  fs.writeFileSync(filePath, '\n\ngrid_id,lon,lat,population\n\ncell_01,10,50,100\n\n\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  const records = parseCensusGridCsv(filePath, config);
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].id, 'cell_01');
}

function testQuotedValues() {
  console.log('Testing quoted CSV fields...');
  const filePath = path.join(tempDir, 'quoted.csv');
  fs.writeFileSync(filePath, 'grid_id,lon,lat,population\n"cell,comma",10,50,100\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  const records = parseCensusGridCsv(filePath, config);
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].id, 'cell,comma');
}

function testUnclosedQuotes() {
  console.log('Testing unclosed quotes fail...');
  const filePath = path.join(tempDir, 'unclosed.csv');
  fs.writeFileSync(filePath, 'grid_id,lon,lat,population\n"cell_01,10,50,100\n', 'utf8');

  const config = {
    idColumn: 'grid_id',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    populationColumn: 'population'
  };

  assert.throws(() => {
    parseCensusGridCsv(filePath, config);
  }, /Row 2: Unclosed quotes/);
}

function runAll() {
  try {
    setup();
    testValidFixture();
    testSemicolonDelimiter();
    testMissingFile();
    testMissingConfiguredColumn();
    testInvalidCoordinates();
    testOutOfRangeCoordinates();
    testNegativePopulation();
    testNonFinitePopulation();
    testDuplicateGridIds();
    testEmptyLinesIgnored();
    testQuotedValues();
    testUnclosedQuotes();
    console.log('--- All Census Adapter Tests Passed ---');
  } finally {
    cleanup();
  }
}

runAll();
