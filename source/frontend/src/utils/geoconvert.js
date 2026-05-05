/**
 * GeoJSON to Leaflet coordinate converter
 * 
 * MongoDB stores: [longitude, latitude]
 * Leaflet requires: [latitude, longitude]
 */

export function swapLngLat(coord) {
  if (!coord || coord.length < 2) return null;
  return [coord[1], coord[0]];
}

export function convertPoint(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Point') {
    return swapLngLat(geometry.coordinates);
  }
  return null;
}

export function convertLineString(geometry) {
  if (!geometry || geometry.type !== 'LineString') return null;
  if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) return null;
  return geometry.coordinates.map(swapLngLat);
}

export function convertPolygon(geometry) {
  if (!geometry || geometry.type !== 'Polygon') return null;
  if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) return null;
  return geometry.coordinates.map(ring => ring.map(swapLngLat));
}

export function convertMultiLineString(geometry) {
  if (!geometry || geometry.type !== 'MultiLineString') return null;
  if (!geometry.coordinates) return null;
  return geometry.coordinates.map(line => line.map(swapLngLat));
}

export function convertMultiPolygon(geometry) {
  if (!geometry || geometry.type !== 'MultiPolygon') return null;
  if (!geometry.coordinates) return null;
  return geometry.coordinates.map(polygon =>
    polygon.map(ring => ring.map(swapLngLat))
  );
}

export function convertGeometry(geometry) {
  if (!geometry) return null;

  switch (geometry.type) {
    case 'Point':
      return convertPoint(geometry);
    case 'LineString':
      return convertLineString(geometry);
    case 'Polygon':
      return convertPolygon(geometry);
    case 'MultiLineString':
      return convertMultiLineString(geometry);
    case 'MultiPolygon':
      return convertMultiPolygon(geometry);
    default:
      return null;
  }
}

export function getBounds(positions) {
  if (!positions) return null;

  function flatten(coords) {
    if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [coords];
    }
    return coords.reduce((acc, p) => acc.concat(flatten(p)), []);
  }

  const flatPositions = flatten(positions);
  if (flatPositions.length === 0) return null;

  const lats = flatPositions.map(p => p[0]);
  const lngs = flatPositions.map(p => p[1]);

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

export function getGeometryType(geometry) {
  return geometry?.type || null;
}

export function isPoint(geometry) {
  return geometry?.type === 'Point';
}

export function isLineString(geometry) {
  return geometry?.type === 'LineString';
}

export function isPolygon(geometry) {
  return geometry?.type === 'Polygon';
}

export function isMultiLineString(geometry) {
  return geometry?.type === 'MultiLineString';
}

export function isMultiPolygon(geometry) {
  return geometry?.type === 'MultiPolygon';
}
