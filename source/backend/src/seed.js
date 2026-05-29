require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Area = require('./models/Area');
const Asset = require('./models/Asset');
const MaintenanceRecord = require('./models/MaintenanceRecord');

const areas = [
  {
    code: 'HC',
    name: 'Quan Hai Chau',
    geometry: {
      type: 'Polygon',
      coordinates: [[[108.21, 16.03], [108.23, 16.03], [108.23, 16.07], [108.21, 16.07], [108.21, 16.03]]],
    },
  },
  {
    code: 'TK',
    name: 'Quan Thanh Khe',
    geometry: {
      type: 'Polygon',
      coordinates: [[[108.17, 16.05], [108.205, 16.05], [108.205, 16.08], [108.17, 16.08], [108.17, 16.05]]],
    },
  },
  {
    code: 'ST',
    name: 'Quan Son Tra',
    geometry: {
      type: 'Polygon',
      coordinates: [[[108.235, 16.05], [108.27, 16.05], [108.27, 16.12], [108.235, 16.12], [108.235, 16.05]]],
    },
  },
  {
    code: 'NHS',
    name: 'Quan Ngu Hanh Son',
    geometry: {
      type: 'Polygon',
      coordinates: [[[108.24, 15.98], [108.28, 15.98], [108.28, 16.045], [108.24, 16.045], [108.24, 15.98]]],
    },
  },
  {
    code: 'LC',
    name: 'Quan Lien Chieu',
    geometry: {
      type: 'Polygon',
      coordinates: [[[108.12, 16.06], [108.17, 16.06], [108.17, 16.14], [108.12, 16.14], [108.12, 16.06]]],
    },
  },
];

const users = [
  { username: 'admin', fullName: 'Nguyen Van Admin', role: 'admin', passwordHash: 'admin123' },
  { username: 'lanhdao', fullName: 'Tran Van Lanh Dao', role: 'leader', passwordHash: 'leader123' },
  { username: 'kythuat', fullName: 'Tran Thi Ky Thuat', role: 'technician', passwordHash: 'kythuat123' },
  { username: 'nhandan', fullName: 'Le Van Dan', role: 'user', passwordHash: 'user123' },
];

const roadDefinitions = [
  { name: 'Duong Bach Dang', area: 0, coords: [
    [108.2169, 16.0548], [108.2182, 16.0578], [108.2201, 16.0604],
    [108.2220, 16.0631], [108.2240, 16.0658], [108.2258, 16.0685], [108.2272, 16.0708]
  ]},
  { name: 'Duong Tran Phu', area: 0, coords: [
    [108.2145, 16.0542], [108.2168, 16.0573], [108.2190, 16.0602],
    [108.2212, 16.0632], [108.2232, 16.0660], [108.2250, 16.0686]
  ]},
  { name: 'Duong Nguyen Van Linh', area: 0, coords: [
    [108.1918, 16.0632], [108.1965, 16.0634], [108.2012, 16.0635], [108.2058, 16.0636],
    [108.2105, 16.0637], [108.2152, 16.0638], [108.2198, 16.0639], [108.2245, 16.0640]
  ]},
  { name: 'Duong Le Duan', area: 0, coords: [
    [108.1975, 16.0692], [108.2020, 16.0693], [108.2065, 16.0694], [108.2110, 16.0695],
    [108.2155, 16.0696], [108.2200, 16.0697], [108.2245, 16.0698]
  ]},
  { name: 'Duong Hung Vuong', area: 0, coords: [
    [108.2000, 16.0658], [108.2045, 16.0659], [108.2090, 16.0660],
    [108.2135, 16.0661], [108.2180, 16.0662], [108.2225, 16.0663]
  ]},
  { name: 'Cau Rong', area: 0, coords: [
    [108.2215, 16.0548], [108.2238, 16.0549], [108.2261, 16.0550], [108.2284, 16.0551]
  ]},
  { name: 'Cau Song Han', area: 0, coords: [
    [108.2188, 16.0718], [108.2212, 16.0719], [108.2236, 16.0720], [108.2260, 16.0721]
  ]},
  { name: 'Duong Phan Chau Trinh', area: 0, coords: [
    [108.2155, 16.0535], [108.2162, 16.0565], [108.2169, 16.0595],
    [108.2176, 16.0625], [108.2183, 16.0655]
  ]},
  { name: 'Duong 2 Thang 9', area: 0, coords: [
    [108.2178, 16.0295], [108.2185, 16.0358], [108.2192, 16.0421],
    [108.2199, 16.0484], [108.2206, 16.0547]
  ]},
  { name: 'Duong Dien Bien Phu', area: 1, coords: [
    [108.1748, 16.0655], [108.1795, 16.0658], [108.1842, 16.0661], [108.1889, 16.0664],
    [108.1936, 16.0667], [108.1983, 16.0670], [108.2030, 16.0673], [108.2077, 16.0676]
  ]},
  { name: 'Duong Ha Huy Tap', area: 1, coords: [
    [108.1790, 16.0528], [108.1798, 16.0568], [108.1806, 16.0608],
    [108.1814, 16.0648], [108.1822, 16.0688]
  ]},
  { name: 'Duong Hung Vuong TK', area: 1, coords: [
    [108.1845, 16.0638], [108.1890, 16.0639], [108.1935, 16.0640],
    [108.1980, 16.0641], [108.2025, 16.0642]
  ]},
  { name: 'Duong Vo Nguyen Giap', area: 2, coords: [
    [108.2438, 16.0268], [108.2448, 16.0338], [108.2458, 16.0408], [108.2468, 16.0478],
    [108.2478, 16.0548], [108.2488, 16.0618], [108.2498, 16.0688], [108.2508, 16.0758],
    [108.2518, 16.0828], [108.2528, 16.0898]
  ]},
  { name: 'Duong Pham Van Dong', area: 2, coords: [
    [108.2298, 16.0708], [108.2325, 16.0709], [108.2352, 16.0710], [108.2379, 16.0711],
    [108.2406, 16.0712], [108.2433, 16.0713], [108.2460, 16.0714], [108.2487, 16.0715]
  ]},
  { name: 'Duong Vo Van Kiet', area: 2, coords: [
    [108.2288, 16.0595], [108.2315, 16.0596], [108.2342, 16.0597], [108.2369, 16.0598],
    [108.2396, 16.0599], [108.2423, 16.0600], [108.2450, 16.0601], [108.2477, 16.0602]
  ]},
  { name: 'Duong Hoang Sa', area: 2, coords: [
    [108.2485, 16.0885], [108.2515, 16.0912], [108.2545, 16.0939],
    [108.2575, 16.0966], [108.2605, 16.0993]
  ]},
  { name: 'Duong Le Van Hien', area: 3, coords: [
    [108.2445, 15.9838], [108.2452, 15.9885], [108.2459, 15.9932], [108.2466, 15.9979],
    [108.2473, 16.0026], [108.2480, 16.0073], [108.2487, 16.0120]
  ]},
  { name: 'Duong Nguyen Huu Tho', area: 3, coords: [
    [108.2035, 16.0185], [108.2042, 16.0232], [108.2049, 16.0279],
    [108.2056, 16.0326], [108.2063, 16.0373], [108.2070, 16.0420]
  ]},
  { name: 'Duong Nguyen Luong Bang', area: 4, coords: [
    [108.1248, 16.0658], [108.1295, 16.0659], [108.1342, 16.0660], [108.1389, 16.0661],
    [108.1436, 16.0662], [108.1483, 16.0663], [108.1530, 16.0664]
  ]},
  { name: 'Duong Ton Duc Thang', area: 4, coords: [
    [108.1608, 16.0658], [108.1645, 16.0659], [108.1682, 16.0660],
    [108.1719, 16.0661], [108.1756, 16.0662], [108.1793, 16.0663]
  ]},
];

const sidewalkDefinitions = [
  { name: 'Via he Bach Dang trai', area: 0, coords: [
    [108.2165, 16.0551], [108.2178, 16.0581], [108.2197, 16.0607],
    [108.2216, 16.0634], [108.2236, 16.0661], [108.2254, 16.0688]
  ]},
  { name: 'Via he Bach Dang phai', area: 0, coords: [
    [108.2173, 16.0545], [108.2186, 16.0575], [108.2205, 16.0601],
    [108.2224, 16.0628], [108.2244, 16.0655], [108.2262, 16.0682]
  ]},
  { name: 'Via he Nguyen Van Linh nam', area: 0, coords: [
    [108.1920, 16.0635], [108.1967, 16.0636], [108.2014, 16.0637], [108.2060, 16.0638],
    [108.2107, 16.0639], [108.2154, 16.0640], [108.2200, 16.0641], [108.2247, 16.0642]
  ]},
  { name: 'Via he Le Duan bac', area: 0, coords: [
    [108.1978, 16.0695], [108.2023, 16.0696], [108.2068, 16.0697], [108.2113, 16.0698],
    [108.2158, 16.0699], [108.2203, 16.0700], [108.2248, 16.0701]
  ]},
  { name: 'Via he Dien Bien Phu tay', area: 1, coords: [
    [108.1752, 16.0658], [108.1799, 16.0661], [108.1846, 16.0664], [108.1893, 16.0667],
    [108.1940, 16.0670], [108.1987, 16.0673], [108.2034, 16.0676], [108.2081, 16.0679]
  ]},
  { name: 'Via he Vo Nguyen Giap bien', area: 2, coords: [
    [108.2442, 16.0271], [108.2452, 16.0341], [108.2462, 16.0411], [108.2472, 16.0481],
    [108.2482, 16.0551], [108.2492, 16.0621], [108.2502, 16.0691], [108.2512, 16.0761],
    [108.2522, 16.0831], [108.2532, 16.0901]
  ]},
  { name: 'Via he Vo Van Kiet bac', area: 2, coords: [
    [108.2292, 16.0598], [108.2319, 16.0599], [108.2346, 16.0600], [108.2373, 16.0601],
    [108.2400, 16.0602], [108.2427, 16.0603], [108.2454, 16.0604], [108.2481, 16.0605]
  ]},
  { name: 'Via he Pham Van Dong nam', area: 2, coords: [
    [108.2302, 16.0711], [108.2329, 16.0712], [108.2356, 16.0713], [108.2383, 16.0714],
    [108.2410, 16.0715], [108.2437, 16.0716], [108.2464, 16.0717], [108.2491, 16.0718]
  ]},
  { name: 'Via he Le Van Hien tay', area: 3, coords: [
    [108.2448, 15.9841], [108.2455, 15.9888], [108.2462, 15.9935], [108.2469, 15.9982],
    [108.2476, 16.0029], [108.2483, 16.0076], [108.2490, 16.0123]
  ]},
  { name: 'Via he Ton Duc Thang dong', area: 4, coords: [
    [108.1612, 16.0661], [108.1649, 16.0662], [108.1686, 16.0663],
    [108.1723, 16.0664], [108.1760, 16.0665], [108.1797, 16.0666]
  ]},
];

const signLocations = [
  { name: 'Bien cam re trai Bach Dang', coords: [108.2240, 16.0658], area: 0 },
  { name: 'Bien gioi han 40 NV Linh', coords: [108.2058, 16.0636], area: 0 },
  { name: 'Bien huong dan Cau Rong', coords: [108.2272, 16.0708], area: 0 },
  { name: 'Bien cam do Tran Phu', coords: [108.2232, 16.0660], area: 0 },
  { name: 'Bien dung lai Le Duan', coords: [108.2110, 16.0695], area: 0 },
  { name: 'Bien bao nguy hiem DBP', coords: [108.1936, 16.0667], area: 1 },
  { name: 'Bien cam xe tai HHT', coords: [108.1798, 16.0568], area: 1 },
  { name: 'Bien truong hoc Hung Vuong', coords: [108.2045, 16.0659], area: 1 },
  { name: 'Bien toc do 60 Vo Nguyen Giap', coords: [108.2478, 16.0548], area: 2 },
  { name: 'Bien huong dan Pham Van Dong', coords: [108.2406, 16.0712], area: 2 },
  { name: 'Bien cam quay dau Vo Van Kiet', coords: [108.2396, 16.0599], area: 2 },
  { name: 'Bien benh vien Le Van Hien', coords: [108.2459, 15.9932], area: 3 },
  { name: 'Bien gioi han Nguyen Huu Tho', coords: [108.2049, 16.0279], area: 3 },
  { name: 'Bien bao pha Nguyen Luong Bang', coords: [108.1389, 16.0661], area: 4 },
  { name: 'Bien dung lai Ton Duc Thang', coords: [108.1719, 16.0661], area: 4 },
];

const trafficLights = [
  { name: 'Den TH NV Linh Bach Dang', coords: [108.2198, 16.0639], area: 0 },
  { name: 'Den TH Le Duan Tran Phu', coords: [108.2212, 16.0632], area: 0 },
  { name: 'Den TH Hung Vuong Phan Chau Trinh', coords: [108.2176, 16.0625], area: 0 },
  { name: 'Den TH DBP HHT', coords: [108.1814, 16.0648], area: 1 },
  { name: 'Den TH Nguyen Huu Tho', coords: [108.2056, 16.0373], area: 1 },
  { name: 'Den TH Vo Van Kiet Vo Nguyen Giap', coords: [108.2423, 16.0600], area: 2 },
  { name: 'Den TH Pham Van Dong Ngo Quyen', coords: [108.2352, 16.0710], area: 2 },
  { name: 'Den TH Le Van Hien Phan Dinh', coords: [108.2466, 15.9979], area: 3 },
  { name: 'Den TH Nguyen Luong Bang Au Co', coords: [108.1436, 16.0662], area: 4 },
  { name: 'Den TH Ton Duc Thang Yen The', coords: [108.1719, 16.0661], area: 4 },
];

const manholes = [
  { name: 'Nap cong BD-01', coords: [108.2240, 16.0658], area: 0 },
  { name: 'Nap cong TP-01', coords: [108.2212, 16.0602], area: 0 },
  { name: 'Nap cong NVL-01', coords: [108.2105, 16.0637], area: 0 },
  { name: 'Nap cong DBP-01', coords: [108.1842, 16.0661], area: 1 },
  { name: 'Nap cong HHT-01', coords: [108.1806, 16.0608], area: 1 },
  { name: 'Nap cong VNG-01', coords: [108.2478, 16.0548], area: 2 },
  { name: 'Nap cong PVD-01', coords: [108.2379, 16.0711], area: 2 },
  { name: 'Nap cong LVH-01', coords: [108.2459, 15.9932], area: 3 },
  { name: 'Nap cong NLB-01', coords: [108.1389, 16.0661], area: 4 },
  { name: 'Nap cong TDT-01', coords: [108.1719, 16.0661], area: 4 },
];

const lampPosts = [
  { name: 'Cot den BD-01', coords: [108.2201, 16.0604], area: 0 },
  { name: 'Cot den BD-02', coords: [108.2220, 16.0631], area: 0 },
  { name: 'Cot den BD-03', coords: [108.2240, 16.0658], area: 0 },
  { name: 'Cot den TP-01', coords: [108.2190, 16.0602], area: 0 },
  { name: 'Cot den TP-02', coords: [108.2212, 16.0632], area: 0 },
  { name: 'Cot den DBP-01', coords: [108.1795, 16.0658], area: 1 },
  { name: 'Cot den DBP-02', coords: [108.1842, 16.0661], area: 1 },
  { name: 'Cot den HHT-01', coords: [108.1806, 16.0568], area: 1 },
  { name: 'Cot den VNG-01', coords: [108.2458, 16.0408], area: 2 },
  { name: 'Cot den VNG-02', coords: [108.2478, 16.0548], area: 2 },
  { name: 'Cot den PVD-01', coords: [108.2352, 16.0710], area: 2 },
  { name: 'Cot den LVH-01', coords: [108.2459, 15.9932], area: 3 },
  { name: 'Cot den LVH-02', coords: [108.2473, 16.0026], area: 3 },
  { name: 'Cot den NLB-01', coords: [108.1342, 16.0660], area: 4 },
  { name: 'Cot den TDT-01', coords: [108.1682, 16.0660], area: 4 },
];

function createLineAsset(idx, prefix, name, assetType, coords, areaId, dimensionFactory, materialOptions, statusOptions) {
  return {
    assetCode: `${prefix}-${String(idx).padStart(5, '0')}`,
    name,
    assetType,
    geometryType: 'LineString',
    geometry: { type: 'LineString', coordinates: coords },
    material: materialOptions[Math.floor(Math.random() * materialOptions.length)],
    dimensions: dimensionFactory(),
    status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
    managedAreaId: areaId,
    source: 'manual',
    approvalStatus: 'approved',
    lastInspectionAt: new Date(2026, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
  };
}

function createPointAsset(idx, prefix, name, assetType, coords, areaId, dimensionFactory, materialOptions, statusOptions) {
  return {
    assetCode: `${prefix}-${String(idx).padStart(5, '0')}`,
    name,
    assetType,
    geometryType: 'Point',
    geometry: { type: 'Point', coordinates: coords },
    material: materialOptions[Math.floor(Math.random() * materialOptions.length)],
    dimensions: dimensionFactory(),
    status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
    managedAreaId: areaId,
    source: 'manual',
    approvalStatus: 'approved',
    lastInspectionAt: new Date(2026, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
  };
}

const generateAssets = (areaIds, userIds) => {
  const assets = [];
  let idx = 1;

  for (const road of roadDefinitions) {
    assets.push(createLineAsset(
      idx, 'ROA', road.name, 'road', road.coords, areaIds[road.area],
      () => ({ width: Math.random() * 8 + 6, length: Math.random() * 2000 + 500, unit: 'm' }),
      ['Be tong nhua', 'Be tong xi mang', 'Da dam'],
      ['good', 'good', 'fair', 'damaged']
    ));
    idx++;
  }

  for (const sign of signLocations) {
    assets.push(createPointAsset(
      idx, 'SIG', sign.name, 'sign', sign.coords, areaIds[sign.area],
      () => ({ width: Math.random() * 0.6 + 0.4, height: Math.random() * 0.6 + 0.4, unit: 'm' }),
      ['Thep ma kem', 'Nhom phan quang', 'Composite'],
      ['good', 'good', 'fair', 'fair', 'damaged']
    ));
    idx++;
  }

  for (const light of trafficLights) {
    assets.push(createPointAsset(
      idx, 'TRL', light.name, 'traffic_light', light.coords, areaIds[light.area],
      () => ({ height: 5.5, unit: 'm' }),
      ['LED', 'LED + cam bien', 'Bong halogen'],
      ['good', 'good', 'fair', 'damaged']
    ));
    idx++;
  }

  for (const mh of manholes) {
    assets.push(createPointAsset(
      idx, 'MAN', mh.name, 'manhole', mh.coords, areaIds[mh.area],
      () => ({ diameter: Math.random() * 0.3 + 0.5, unit: 'm' }),
      ['Gang duc', 'Be tong cot thep', 'Composite'],
      ['good', 'fair', 'fair', 'damaged']
    ));
    idx++;
  }

  for (const lamp of lampPosts) {
    assets.push(createPointAsset(
      idx, 'LAM', lamp.name, 'lamp_post', lamp.coords, areaIds[lamp.area],
      () => ({ height: Math.random() * 4 + 6, unit: 'm' }),
      ['Thep ma kem', 'Thep son tinh dien', 'Gang duc'],
      ['good', 'good', 'good', 'fair', 'damaged']
    ));
    idx++;
  }

  for (const sw of sidewalkDefinitions) {
    assets.push(createLineAsset(
      idx, 'SWK', sw.name, 'sidewalk', sw.coords, areaIds[sw.area],
      () => ({ width: Math.random() * 2 + 2, unit: 'm' }),
      ['Gach lat', 'Be tong', 'Da granit'],
      ['good', 'fair', 'fair', 'damaged']
    ));
    idx++;
  }

  // --- TẠO THÊM CÁC BÁO CÁO CHỜ DUYỆT TỪ NGƯỜI DÂN ---
  const citizenId = userIds[3]; // Lấy ID của user 'nhandan'

  assets.push({
    assetCode: `REP-${String(idx++).padStart(5, '0')}`,
    name: 'Báo cáo: Vỉa hè bị bong tróc gạch nguy hiểm',
    assetType: 'sidewalk',
    geometryType: 'Point',
    geometry: { type: 'Point', coordinates: [108.2250, 16.0680] },
    material: 'Gach lat',
    status: 'damaged',
    managedAreaId: areaIds[0],
    source: 'manual',
    approvalStatus: 'pending', // <--- Trạng thái chờ duyệt
    createdBy: citizenId,
  });

  assets.push({
    assetCode: `REP-${String(idx++).padStart(5, '0')}`,
    name: 'Báo cáo: Đèn tín hiệu không sáng đèn đỏ',
    assetType: 'traffic_light',
    geometryType: 'Point',
    geometry: { type: 'Point', coordinates: [108.1814, 16.0648] },
    material: 'LED',
    status: 'damaged',
    managedAreaId: areaIds[1],
    source: 'manual',
    approvalStatus: 'pending', // <--- Trạng thái chờ duyệt
    createdBy: citizenId,
  });

  assets.push({
    assetCode: `REP-${String(idx++).padStart(5, '0')}`,
    name: 'Báo cáo: Biển báo cấm ngược chiều bị mờ',
    assetType: 'sign',
    geometryType: 'Point',
    geometry: { type: 'Point', coordinates: [108.1950, 16.0640] },
    material: 'Nhom phan quang',
    status: 'damaged',
    managedAreaId: areaIds[0],
    source: 'manual',
    approvalStatus: 'pending', // <--- Trạng thái chờ duyệt
    createdBy: citizenId,
  });

  return assets;
};

const generateMaintenanceRecords = (assetIds, userIds) => {
  const records = [];
  const descriptions = [
    { type: 'incident', desc: 'Phat hien hu hong be mat, can sua chua', sev: 'medium' },
    { type: 'incident', desc: 'Do nghieng do va cham giao thong', sev: 'high' },
    { type: 'incident', desc: 'Mat dien, khong hoat dong', sev: 'critical' },
    { type: 'incident', desc: 'Bi cong venh, mo phan quang', sev: 'low' },
    { type: 'incident', desc: 'Ngap nuoc, nap cong bi troi', sev: 'high' },
    { type: 'maintenance', desc: 'Son lai be mat, ve sinh', sev: 'low' },
    { type: 'maintenance', desc: 'Thay the bong den LED', sev: 'medium' },
    { type: 'maintenance', desc: 'Sua chua be mat duong, va o ga', sev: 'medium' },
    { type: 'maintenance', desc: 'Kiem tra dinh ky, thay fixed le linh kien', sev: 'low' },
    { type: 'maintenance', desc: 'Nang cap he thong cam bien', sev: 'medium' },
    { type: 'incident', desc: 'Ran nut lon do xe tai nang', sev: 'high' },
    { type: 'maintenance', desc: 'Lap dat them he thong thoat nuoc', sev: 'medium' },
    { type: 'incident', desc: 'Bi pha hoai, mat bien bao', sev: 'critical' },
    { type: 'maintenance', desc: 'Cat tia cay xanh che khuat bien bao', sev: 'low' },
    { type: 'maintenance', desc: 'Thay the nap cong moi', sev: 'medium' },
  ];

  // Các trạng thái tương ứng với 3 cột trên frontend
  const uiStatuses = ['open', 'in_progress', 'resolved'];
  const damagedAssets = assetIds.filter((_, i) => i % 3 === 0 || i % 5 === 0);

  // Gán việc cho Kỹ thuật viên (index 2) và người báo cáo (Người dân, index 3)
  const technicianId = userIds[2];
  const citizenId = userIds[3];

  for (let i = 0; i < Math.min(15, damagedAssets.length); i++) {
    const d = descriptions[i % descriptions.length];
    
    // Cố tình phân bổ đều task vào 3 cột trên bảng Kanban
    const status = uiStatuses[i % 3]; 

    records.push({
      assetId: damagedAssets[i],
      recordType: d.type,
      title: d.desc,
      description: `${d.desc} (Chi tiet quan sat tai hien truong)`,
      severity: d.sev,
      reportedBy: citizenId,
      performedBy: technicianId, // <--- ĐÃ SỬA: Gán chính xác cho kỹ thuật viên
      costEstimate: Math.floor(Math.random() * 50000000) + 1000000,
      costActual: status === 'resolved'
        ? Math.floor(Math.random() * 50000000) + 1000000
        : undefined,
      status,
      recordedAt: new Date(2026, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
      resolvedAt: status === 'resolved'
        ? new Date(2026, 3, Math.floor(Math.random() * 6) + 1)
        : undefined,
    });
  }

  return records;
};

const seed = async () => {
  try {
    await connectDB();
    console.log('Cleaning database...');

    await User.deleteMany({});
    await Area.deleteMany({});
    await Asset.deleteMany({});
    await MaintenanceRecord.deleteMany({});

    console.log('Seeding users...');
    const createdUsers = await User.create(users);
    const userIds = createdUsers.map((u) => u._id);
    console.log(`  Created ${createdUsers.length} users`);

    console.log('Seeding areas...');
    const createdAreas = await Area.create(areas);
    const areaIds = createdAreas.map((a) => a._id);
    console.log(`  Created ${createdAreas.length} areas`);

    console.log('Seeding assets...');
    const assetsData = generateAssets(areaIds, userIds); 
    const createdAssets = await Asset.insertMany(assetsData);
    console.log(`  Created ${createdAssets.length} assets`);

    console.log('Seeding maintenance records...');
    const assetIds = createdAssets.map((a) => a._id);
    const maintenanceData = generateMaintenanceRecords(assetIds, userIds);
    const createdRecords = await MaintenanceRecord.insertMany(maintenanceData);
    console.log(`  Created ${createdRecords.length} maintenance records`);

    console.log('\n=== Seed completed ===');
    console.log('Login credentials:');
    console.log('  admin / admin123 (Admin)');
    console.log('  lanhdao / leader123 (Leader)'); 
    console.log('  kythuat / kythuat123 (Technician)');
    console.log('  nhandan / user123 (Citizen)');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();