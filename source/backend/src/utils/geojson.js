const validateGeoJSON = (geometry) => {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return { valid: false, message: 'Geometry phải có type và coordinates' };
  }

  if (!['Point', 'LineString', 'Polygon'].includes(geometry.type)) {
    return { valid: false, message: 'Chỉ hỗ trợ Point, LineString và Polygon' };
  }

  if (geometry.type === 'Point') {
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length !== 2) {
      return { valid: false, message: 'Point phải có [longitude, latitude]' };
    }
    const [lng, lat] = geometry.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return { valid: false, message: 'Toạ độ phải là số' };
    }
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return { valid: false, message: 'Toạ độ ngoài phạm vi hợp lệ' };
    }
  }

  if (geometry.type === 'LineString') {
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
      return { valid: false, message: 'LineString phải có ít nhất 2 điểm' };
    }
    for (const coord of geometry.coordinates) {
      if (!Array.isArray(coord) || coord.length !== 2) {
        return { valid: false, message: 'Mỗi điểm trong LineString phải có [lng, lat]' };
      }
      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        return { valid: false, message: 'Toạ độ phải là số' };
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return { valid: false, message: 'Toạ độ ngoài phạm vi hợp lệ' };
      }
    }
  }

  if (geometry.type === 'Polygon') {
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      return { valid: false, message: 'Polygon phải có ít nhất 1 ring' };
    }
    const outerRing = geometry.coordinates[0];
    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      return { valid: false, message: 'Polygon ring phải có ít nhất 4 điểm (3 đỉnh + điểm đóng)' };
    }
    const first = outerRing[0];
    const last = outerRing[outerRing.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return { valid: false, message: 'Polygon ring phải đóng kín (điểm đầu = điểm cuối)' };
    }
    for (const coord of outerRing) {
      if (!Array.isArray(coord) || coord.length !== 2) {
        return { valid: false, message: 'Mỗi điểm trong Polygon phải có [lng, lat]' };
      }
      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        return { valid: false, message: 'Toạ độ phải là số' };
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return { valid: false, message: 'Toạ độ ngoài phạm vi hợp lệ' };
      }
    }
  }

  return { valid: true };
};

module.exports = { validateGeoJSON };
