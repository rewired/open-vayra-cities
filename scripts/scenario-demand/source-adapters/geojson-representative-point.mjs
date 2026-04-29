import * as turf from '@turf/turf';

/**
 * Derives a validated representative point for supported GeoJSON geometry types.
 * Supported: Point, Polygon, MultiPolygon.
 *
 * @param {object} geometry - A GeoJSON geometry-like object.
 * @param {string} [contextStr=''] - Optional diagnostic context (e.g., 'features[0]') for error messages.
 * @returns {{ longitude: number, latitude: number }} The derived point with finite coordinates.
 */
export function getGeoJsonRepresentativePoint(geometry, contextStr = '') {
  const suffix = contextStr ? ` at ${contextStr}` : '';

  if (!geometry || typeof geometry !== 'object') {
    throw new Error(`Missing or invalid geometry${suffix}`);
  }

  const type = geometry.type;
  const coords = geometry.coordinates;

  if (!type || typeof type !== 'string') {
    throw new Error(`Malformed geometry${suffix}: missing type`);
  }

  if (!Array.isArray(coords)) {
    throw new Error(`Malformed geometry${suffix}: missing or invalid coordinates`);
  }

  // Deep validation of coordinates
  if (type === 'Point') {
    if (coords.length < 2) {
      throw new Error(`Malformed Point geometry${suffix}: expected at least [lon, lat]`);
    }
    validateLonLat(coords[0], coords[1], suffix);
  } else if (type === 'Polygon') {
    if (coords.length === 0) {
      throw new Error(`Malformed Polygon geometry${suffix}: no rings found`);
    }
    for (let r = 0; r < coords.length; r++) {
      const ring = coords[r];
      if (!Array.isArray(ring)) {
        throw new Error(`Malformed Polygon ring at index ${r}${suffix}: not an array`);
      }
      for (let p = 0; p < ring.length; p++) {
        const pt = ring[p];
        if (!Array.isArray(pt) || pt.length < 2) {
          throw new Error(`Malformed Polygon coordinate at ring ${r}, index ${p}${suffix}: expected [lon, lat]`);
        }
        validateLonLat(pt[0], pt[1], suffix);
      }
    }
  } else if (type === 'MultiPolygon') {
    if (coords.length === 0) {
      throw new Error(`Malformed MultiPolygon geometry${suffix}: no polygons found`);
    }
    for (let p = 0; p < coords.length; p++) {
      const poly = coords[p];
      if (!Array.isArray(poly)) {
        throw new Error(`Malformed MultiPolygon element at index ${p}${suffix}: not an array`);
      }
      for (let r = 0; r < poly.length; r++) {
        const ring = poly[r];
        if (!Array.isArray(ring)) {
          throw new Error(`Malformed MultiPolygon ring at poly ${p}, ring ${r}${suffix}: not an array`);
        }
        for (let ptIdx = 0; ptIdx < ring.length; ptIdx++) {
          const pt = ring[ptIdx];
          if (!Array.isArray(pt) || pt.length < 2) {
            throw new Error(`Malformed MultiPolygon coordinate at poly ${p}, ring ${r}, index ${ptIdx}${suffix}: expected [lon, lat]`);
          }
          validateLonLat(pt[0], pt[1], suffix);
        }
      }
    }
  } else {
    throw new Error(`Unsupported geometry type${suffix}: ${type}`);
  }

  let resultLon;
  let resultLat;

  if (type === 'Point') {
    resultLon = coords[0];
    resultLat = coords[1];
  } else {
    // Polygon or MultiPolygon
    const feature = {
      type: 'Feature',
      geometry: geometry,
      properties: {}
    };

    let centroidPoint;
    try {
      centroidPoint = turf.centroid(feature);
    } catch (err) {
      throw new Error(`Turf failed to compute centroid${suffix}: ${err.message}`);
    }

    if (!centroidPoint || !centroidPoint.geometry || !centroidPoint.geometry.coordinates) {
      throw new Error(`Turf failed to return a valid centroid point${suffix}`);
    }

    [resultLon, resultLat] = centroidPoint.geometry.coordinates;
  }

  // Validate final derived coordinates just in case
  validateLonLat(resultLon, resultLat, ` (derived point${suffix})`);

  return { longitude: resultLon, latitude: resultLat };
}

/**
 * Validates that coordinates are finite numbers within standard geospatial bounds.
 *
 * @private
 */
function validateLonLat(lon, lat, context) {
  if (typeof lon !== 'number' || !Number.isFinite(lon)) {
    throw new Error(`Non-finite longitude detected${context}: ${lon}`);
  }
  if (typeof lat !== 'number' || !Number.isFinite(lat)) {
    throw new Error(`Non-finite latitude detected${context}: ${lat}`);
  }
  if (lon < -180 || lon > 180) {
    throw new Error(`Out-of-bounds longitude detected${context}: ${lon}`);
  }
  if (lat < -90 || lat > 90) {
    throw new Error(`Out-of-bounds latitude detected${context}: ${lat}`);
  }
}
