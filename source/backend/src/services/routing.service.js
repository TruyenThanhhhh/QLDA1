const axios = require('axios');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Asset = require('../models/Asset');

/**
 * Thuật toán Nearest Neighbor cơ bản để giải bài toán TSP (Người chào hàng)
 * Đầu vào: Ma trận khoảng cách (distance matrix)
 * Đầu ra: Mảng chỉ mục thứ tự các điểm tối ưu
 */
const nearestNeighbor = (distanceMatrix) => {
  const n = distanceMatrix.length;
  if (n <= 1) return [0];

  const visited = new Array(n).fill(false);
  const route = [0]; // Bắt đầu từ điểm đầu tiên
  visited[0] = true;

  let currentPos = 0;

  for (let step = 1; step < n; step++) {
    let nearestDist = Infinity;
    let nearestIdx = -1;

    for (let i = 0; i < n; i++) {
      if (!visited[i] && distanceMatrix[currentPos][i] !== null && distanceMatrix[currentPos][i] < nearestDist) {
        nearestDist = distanceMatrix[currentPos][i];
        nearestIdx = i;
      }
    }

    // Nếu tìm thấy điểm gần nhất
    if (nearestIdx !== -1) {
      visited[nearestIdx] = true;
      route.push(nearestIdx);
      currentPos = nearestIdx;
    } else {
      // Trường hợp không thể kết nối tới các điểm còn lại
      break;
    }
  }

  // Thêm các điểm chưa được thăm (nếu bị cô lập)
  for (let i = 0; i < n; i++) {
    if (!visited[i]) route.push(i);
  }

  return route;
};

/**
 * Tối ưu hóa lộ trình làm việc cho các sự cố đang mở (Open Incidents)
 */
const optimizeRoute = async (userLocation = null) => {
  // Lấy các sự cố đang mở
  const incidents = await MaintenanceRecord.find({ 
    status: { $in: ['open', 'in_progress'] } 
  })
  .populate('assetId', 'name assetCode geometry')
  .limit(20); // Giới hạn 20 điểm để gọi OSRM không bị lỗi URL quá dài

  if (!incidents || incidents.length === 0) {
    return { route: [], polylines: [] };
  }

  // Lọc ra các sự cố có tọa độ hợp lệ
  const validIncidents = incidents.filter(inc => 
    inc.assetId && 
    inc.assetId.geometry && 
    inc.assetId.geometry.type === 'Point'
  );

  if (validIncidents.length <= 1) {
    return { route: validIncidents, polylines: [] };
  }

  // Format: lon,lat;lon,lat
  const coordinatesStr = validIncidents.map(inc => {
    const coords = inc.assetId.geometry.coordinates;
    return `${coords[0]},${coords[1]}`;
  }).join(';');

  try {
    // 1. Lấy ma trận khoảng cách từ OSRM
    const osrmTableUrl = `http://router.project-osrm.org/table/v1/driving/${coordinatesStr}`;
    const tableResponse = await axios.get(osrmTableUrl);
    const distanceMatrix = tableResponse.data.durations; // Tối ưu theo thời gian di chuyển

    // 2. Chạy thuật toán TSP (Nearest Neighbor)
    const optimalOrder = nearestNeighbor(distanceMatrix);

    // 3. Sắp xếp lại danh sách sự cố theo lộ trình tối ưu
    const optimizedIncidents = optimalOrder.map(idx => validIncidents[idx]);

    // 4. Lấy geometry polyline đường đi thực tế từ OSRM Route API
    const sortedCoordsStr = optimizedIncidents.map(inc => {
      const coords = inc.assetId.geometry.coordinates;
      return `${coords[0]},${coords[1]}`;
    }).join(';');

    const osrmRouteUrl = `http://router.project-osrm.org/route/v1/driving/${sortedCoordsStr}?geometries=geojson&overview=full`;
    const routeResponse = await axios.get(osrmRouteUrl);
    
    let polyline = null;
    if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
      polyline = routeResponse.data.routes[0].geometry; // GeoJSON LineString
    }

    return {
      route: optimizedIncidents,
      polyline: polyline,
      distance: routeResponse.data.routes[0]?.distance || 0,
      duration: routeResponse.data.routes[0]?.duration || 0,
    };
  } catch (err) {
    console.error('Lỗi khi gọi OSRM API:', err.message);
    // Fallback: Trả về danh sách chưa tối ưu nếu API lỗi
    return { route: validIncidents, polylines: null };
  }
};

const getCustomRoute = async (start, end) => {
  if (!start || !end) {
    throw Object.assign(new Error('Thiếu điểm bắt đầu hoặc kết thúc'), { statusCode: 400 });
  }

  const osrmRouteUrl = `http://router.project-osrm.org/route/v1/driving/${start};${end}?geometries=geojson&overview=full`;

  try {
    const response = await axios.get(osrmRouteUrl);
    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('Không thể tìm thấy lộ trình');
    }

    const route = response.data.routes[0];
    const polyline = route.geometry;

    const damagedAssets = await Asset.find({ status: 'damaged', isDeleted: false });
    const warnings = [];

    if (polyline && polyline.coordinates) {
      damagedAssets.forEach(asset => {
        if (asset.geometry && asset.geometry.type === 'Point') {
          const [assetLon, assetLat] = asset.geometry.coordinates;

          let minDist = Infinity;
          polyline.coordinates.forEach(([routeLon, routeLat]) => {
            const dist = Math.sqrt(Math.pow(assetLon - routeLon, 2) + Math.pow(assetLat - routeLat, 2));
            if (dist < minDist) minDist = dist;
          });

          if (minDist < 0.002) {
            warnings.push({
              id: asset.id,
              name: asset.name,
              assetCode: asset.assetCode,
              assetType: asset.assetType,
              coordinates: asset.geometry.coordinates,
              distanceApproxMeters: Math.round(minDist * 111000)
            });
          }
        }
      });
    }

    return {
      polyline: polyline,
      distance: route.distance,
      duration: route.duration,
      warnings: warnings
    };
  } catch (err) {
    console.error('Lỗi khi gọi OSRM Route:', err.message);
    throw err;
  }
};

module.exports = {
  optimizeRoute,
  getCustomRoute
};
