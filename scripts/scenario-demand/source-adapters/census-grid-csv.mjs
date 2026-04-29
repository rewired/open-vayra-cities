import fs from 'node:fs';

/**
 * Parses and normalizes a population grid CSV file into standard source records.
 *
 * @param {string} filePath - Absolute or relative path to the CSV source file.
 * @param {object} config - Mapping configuration specifying column indices/names.
 * @param {string} config.idColumn - Header label identifying the unique grid cell ID.
 * @param {string} config.longitudeColumn - Header label identifying the X / Longitude coordinate.
 * @param {string} config.latitudeColumn - Header label identifying the Y / Latitude coordinate.
 * @param {string} config.populationColumn - Header label identifying the grid cell population count.
 * @param {string} [config.delimiter=','] - The character used to separate values in the CSV.
 * 
 * @returns {Array<{id: string, longitude: number, latitude: number, population: number}>} 
 *          An array of standardized records mapping grid data cleanly.
 *
 * @throws {Error} When the file is missing, header mapping fails, columns are not found,
 *                 coordinate bounds are exceeded, or structural data anomalies occur.
 */
export function parseCensusGridCsv(filePath, config) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const delimiter = config.delimiter || ',';
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split(/\r?\n/);

  let headerRow = null;
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      headerRow = line;
      headerIndex = i;
      break;
    }
  }

  if (headerRow === null) {
    throw new Error('CSV file is empty or missing header row');
  }

  const headers = splitCsvLine(headerRow, delimiter);

  const idColIdx = headers.indexOf(config.idColumn);
  const lonColIdx = headers.indexOf(config.longitudeColumn);
  const latColIdx = headers.indexOf(config.latitudeColumn);
  const popColIdx = headers.indexOf(config.populationColumn);

  if (idColIdx === -1) throw new Error(`Missing configured column: ${config.idColumn}`);
  if (lonColIdx === -1) throw new Error(`Missing configured column: ${config.longitudeColumn}`);
  if (latColIdx === -1) throw new Error(`Missing configured column: ${config.latitudeColumn}`);
  if (popColIdx === -1) throw new Error(`Missing configured column: ${config.populationColumn}`);

  const records = [];
  const knownIds = new Set();

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; 

    const rowNumber = i + 1;
    let cols;
    try {
      cols = splitCsvLine(line, delimiter);
    } catch (err) {
      throw new Error(`Row ${rowNumber}: ${err.message}`);
    }

    if (cols.length < Math.max(idColIdx, lonColIdx, latColIdx, popColIdx) + 1) {
      throw new Error(`Row ${rowNumber}: row has fewer columns than required by header`);
    }

    const id = cols[idColIdx].trim();
    if (!id) {
      throw new Error(`Row ${rowNumber}: Grid ID is an empty string`);
    }

    if (knownIds.has(id)) {
      throw new Error(`Row ${rowNumber}: Duplicate grid id detected: ${id}`);
    }
    knownIds.add(id);

    const lonRaw = cols[lonColIdx].trim();
    const latRaw = cols[latColIdx].trim();
    const popRaw = cols[popColIdx].trim();

    const longitude = Number(lonRaw);
    const latitude = Number(latRaw);
    const population = Number(popRaw);

    if (!Number.isFinite(longitude)) {
      throw new Error(`Row ${rowNumber}: Invalid or non-finite longitude: ${lonRaw}`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(`Row ${rowNumber}: Longitude out of range [-180, 180]: ${longitude}`);
    }

    if (!Number.isFinite(latitude)) {
      throw new Error(`Row ${rowNumber}: Invalid or non-finite latitude: ${latRaw}`);
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Row ${rowNumber}: Latitude out of range [-90, 90]: ${latitude}`);
    }

    if (!Number.isFinite(population)) {
      throw new Error(`Row ${rowNumber}: Invalid or non-finite population: ${popRaw}`);
    }
    if (population < 0) {
      throw new Error(`Row ${rowNumber}: Population cannot be negative: ${population}`);
    }

    records.push({
      id,
      longitude,
      latitude,
      population
    });
  }

  return records;
}

/**
 * Internal helper splitting a CSV row securely. Supports optional quotes around fields.
 * 
 * @private
 */
function splitCsvLine(line, delimiter) {
  const result = [];
  let inQuotes = false;
  let currentStr = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(currentStr);
      currentStr = '';
    } else {
      currentStr += char;
    }
  }
  result.push(currentStr);

  if (inQuotes) {
    throw new Error('Unclosed quotes in CSV line');
  }

  return result;
}
