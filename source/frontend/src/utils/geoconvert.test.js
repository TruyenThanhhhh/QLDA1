import { getBounds, swapLngLat, convertPoint, convertLineString, convertPolygon } from './geoconvert.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

console.log('\n=== getBounds Tests ===\n');

// Point
assert(
  deepEqual(getBounds([16.0544, 108.2022]), [[16.0544, 108.2022], [16.0544, 108.2022]]),
  'Point: single [lat, lng] returns degenerate bounds'
);

// LineString
assert(
  deepEqual(getBounds([[16.05, 108.20], [16.07, 108.22], [16.03, 108.25]]), [[16.03, 108.20], [16.07, 108.25]]),
  'LineString: array of [lat, lng] returns correct bounds'
);

// Polygon
assert(
  deepEqual(
    getBounds([[[16.03, 108.21], [16.07, 108.21], [16.07, 108.23], [16.03, 108.23], [16.03, 108.21]]]),
    [[16.03, 108.21], [16.07, 108.23]]
  ),
  'Polygon: nested [[[lat, lng], ...]] returns correct bounds'
);

// Polygon with hole
assert(
  deepEqual(
    getBounds([
      [[16.00, 108.00], [16.10, 108.00], [16.10, 108.30], [16.00, 108.30], [16.00, 108.00]],
      [[16.04, 108.10], [16.06, 108.10], [16.06, 108.20], [16.04, 108.20], [16.04, 108.10]],
    ]),
    [[16.00, 108.00], [16.10, 108.30]]
  ),
  'Polygon with hole: multiple rings returns bounds of all coords'
);

// Null/undefined
assert(getBounds(null) === null, 'null input returns null');
assert(getBounds(undefined) === null, 'undefined input returns null');
assert(getBounds([]) === null, 'empty array returns null');

console.log('\n=== swapLngLat Detection Tests ===\n');

assert(
  deepEqual(swapLngLat([108.2022, 16.0544]), [16.0544, 108.2022]),
  'Swaps [lng, lat] to [lat, lng]'
);

const danang = [16.0544, 108.2022];
const swapped = swapLngLat(danang);
assert(
  deepEqual(swapped, [108.2022, 16.0544]),
  'Double-swap returns original [lng, lat]'
);

function isLikelyLatLng(coords) {
  const [a, b] = coords;
  return Math.abs(a) <= 90 && Math.abs(b) > 90;
}

assert(isLikelyLatLng(danang) === true, 'Detects [lat, lng] format (lat<=90, lng>90)');
assert(isLikelyLatLng(swapped) === false, 'Detects [lng, lat] format is NOT [lat, lng]');

console.log('\n=== convertPoint Tests ===\n');

assert(
  deepEqual(convertPoint({ type: 'Point', coordinates: [108.2022, 16.0544] }), [16.0544, 108.2022]),
  'Converts Point from GeoJSON to Leaflet'
);

assert(convertPoint({ type: 'LineString', coordinates: [] }) === null, 'Returns null for non-Point');

console.log('\n=== convertLineString Tests ===\n');

assert(
  deepEqual(
    convertLineString({
      type: 'LineString',
      coordinates: [[108.20, 16.05], [108.22, 16.07], [108.25, 16.03]]
    }),
    [[16.05, 108.20], [16.07, 108.22], [16.03, 108.25]]
  ),
  'Converts LineString from GeoJSON to Leaflet'
);

console.log('\n=== convertPolygon Tests ===\n');

assert(
  deepEqual(
    convertPolygon({
      type: 'Polygon',
      coordinates: [[[108.21, 16.03], [108.23, 16.03], [108.23, 16.07], [108.21, 16.07], [108.21, 16.03]]]
    }),
    [[[16.03, 108.21], [16.03, 108.23], [16.07, 108.23], [16.07, 108.21], [16.03, 108.21]]]
  ),
  'Converts Polygon from GeoJSON to Leaflet'
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
}
