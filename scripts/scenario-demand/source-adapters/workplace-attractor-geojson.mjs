import fs from 'node:fs';
import { getGeoJsonRepresentativePoint } from './geojson-representative-point.mjs';

/**
 * Parses and normalizes a workplace attractor GeoJSON file into standard source records.
 *
 * @param {string} filePath - Absolute or relative path to the GeoJSON source file.
 * @param {object} config - Property name mappings and default fallback overrides.
 * @param {string} [config.idProperty='id'] - Feature property name for a unique attractor ID.
 * @param {string} [config.labelProperty='name'] - Feature property name for the attractor name/label.
 * @param {string} [config.weightProperty='weight'] - Feature property name for the baseline attractor weight.
 * @param {string} [config.scaleProperty='scale'] - Feature property name for catchment scale.
 * @param {number} [config.defaultWeight=100] - Fallback weight if missing or omitted.
 * @param {string} [config.defaultScale='district'] - Fallback tier if missing or omitted.
 * 
 * @returns {Array<{id: string, longitude: number, latitude: number, weight: number, scale: 'local'|'district'|'major'|'metropolitan', label?: string}>}
 */
export function parseWorkplaceAttractorGeoJson(filePath, config = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let geojson;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    geojson = JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse GeoJSON: ${err.message}`);
  }

  if (!geojson || typeof geojson !== 'object') {
    throw new Error('GeoJSON root must be an object');
  }
  if (geojson.type !== 'FeatureCollection') {
    throw new Error(`Unsupported GeoJSON root type: ${geojson.type || 'unknown'}. Expected FeatureCollection.`);
  }
  if (!Array.isArray(geojson.features)) {
    throw new Error('GeoJSON FeatureCollection must contain a "features" array.');
  }

  const idProperty = config.idProperty || 'id';
  const labelProperty = config.labelProperty || 'name';
  const weightProperty = config.weightProperty || 'weight';
  const scaleProperty = config.scaleProperty || 'scale';
  const defaultWeight = typeof config.defaultWeight === 'number' ? config.defaultWeight : 100;
  const defaultScale = config.defaultScale || 'district';

  const validScales = ['local', 'district', 'major', 'metropolitan'];
  if (!validScales.includes(defaultScale)) {
    throw new Error(`Invalid configured defaultScale: ${defaultScale}`);
  }
  if (defaultWeight < 0 || !Number.isFinite(defaultWeight)) {
    throw new Error(`Invalid configured defaultWeight: ${defaultWeight}`);
  }

  const records = [];
  const knownIds = new Set();

  for (let i = 0; i < geojson.features.length; i++) {
    const feature = geojson.features[i];
    const featureIndexStr = `features[${i}]`;

    if (!feature || typeof feature !== 'object') {
      throw new Error(`Malformed feature at index ${i}: not an object`);
    }
    if (feature.type !== 'Feature') {
      throw new Error(`Malformed feature at index ${i}: missing or invalid type '${feature.type || 'unknown'}'`);
    }
    if (!feature.geometry || typeof feature.geometry !== 'object') {
      throw new Error(`Malformed feature at index ${i}: missing geometry`);
    }

    const geom = feature.geometry;
    const type = geom.type;
    const coords = geom.coordinates;

    if (!type || typeof type !== 'string') {
      throw new Error(`Malformed geometry at ${featureIndexStr}: missing type`);
    }
    if (!Array.isArray(coords)) {
      throw new Error(`Malformed geometry at ${featureIndexStr}: missing or invalid coordinates`);
    }

    let position = null;
    try {
      position = getGeoJsonRepresentativePoint(geom, featureIndexStr);
    } catch (err) {
      if (err.message.includes('Unsupported geometry type')) {
        throw new Error(`Unsupported geometry type at ${featureIndexStr}: ${type}`);
      }
      if (err.message.includes('Out-of-bounds longitude') || err.message.includes('Non-finite longitude')) {
        throw new Error(`Invalid longitude at ${featureIndexStr}: ${coords[0]}`);
      }
      if (err.message.includes('Out-of-bounds latitude') || err.message.includes('Non-finite latitude')) {
        throw new Error(`Invalid latitude at ${featureIndexStr}: ${coords[1]}`);
      }
      throw err;
    }

    if (!Number.isFinite(position.longitude) || position.longitude < -180 || position.longitude > 180) {
      throw new Error(`Invalid longitude at ${featureIndexStr}: ${position.longitude}`);
    }
    if (!Number.isFinite(position.latitude) || position.latitude < -90 || position.latitude > 90) {
      throw new Error(`Invalid latitude at ${featureIndexStr}: ${position.latitude}`);
    }

    const props = feature.properties || {};
    
    let id = props[idProperty];
    if (id === undefined || id === null || id === '') {
      id = `feature-${i}`;
    } else {
      id = String(id).trim();
    }

    if (!id) {
      throw new Error(`Missing or empty ID for feature at ${featureIndexStr}`);
    }
    if (knownIds.has(id)) {
      throw new Error(`Duplicate feature ID detected at ${featureIndexStr}: ${id}`);
    }
    knownIds.add(id);

    let weight = defaultWeight;
    if (props[weightProperty] !== undefined && props[weightProperty] !== null) {
      weight = Number(props[weightProperty]);
      if (!Number.isFinite(weight) || weight < 0) {
        throw new Error(`Invalid non-negative weight for feature at ${featureIndexStr}: ${props[weightProperty]}`);
      }
    }

    let scale = defaultScale;
    if (props[scaleProperty] !== undefined && props[scaleProperty] !== null) {
      scale = String(props[scaleProperty]).trim();
      if (!validScales.includes(scale)) {
        throw new Error(`Invalid scale for feature at ${featureIndexStr}: ${scale}`);
      }
    }

    let label = undefined;
    if (props[labelProperty] !== undefined && props[labelProperty] !== null) {
      label = String(props[labelProperty]).trim();
    }

    records.push({
      id,
      longitude: position.longitude,
      latitude: position.latitude,
      weight,
      scale,
      ...(label ? { label } : {})
    });
  }

  return records;
}


