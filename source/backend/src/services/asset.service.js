const Asset = require('../models/Asset');
const Area = require('../models/Area');
const { validateGeoJSON } = require('../utils/geojson');
const audit = require('./audit.service');

const getAssets = async (query) => {
  const {
    page = 1,
    limit = 50,
    assetType,
    status,
    managedAreaId,
    search,
    bbox,
  } = query;
  const { user } = query;

  const filter = { isDeleted: false };

  // Role-based filtering: Sửa lại để Người dân thấy được tài sản đã duyệt 
  // HOẶC các tiện ích công cộng (đường, trạm xe buýt, bãi đỗ xe) mặc định
  if (user?.role === 'user') {
    filter.$or = [
      { approvalStatus: 'approved' },
      { assetType: { $in: ['road', 'bus_stop', 'parking_lot', 'public_facility'] } }
    ];
  }

  if (assetType) filter.assetType = assetType;
  if (status) filter.status = status;
  if (managedAreaId) filter.managedAreaId = managedAreaId;

  let osmAssets = []; // Chứa kết quả đường/địa điểm từ OpenStreetMap

  if (search) {
    // Regex kiểm tra định dạng tọa độ "Vĩ độ, Kinh độ" (VD: 16.047, 108.206)
    const coordRegex = /^[-+]?\d+(\.\d+)?\s*(,|;|\s)\s*[-+]?\d+(\.\d+)?$/;
    
    if (coordRegex.test(search.trim())) {
      const parts = search.trim().match(/[-+]?\d+(\.\d+)?/g);
      if (parts && parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        filter.geometry = {
          $geoWithin: {
            $centerSphere: [[lng, lat], 1 / 6378.1]
          }
        };
      }
    } else {
      // Tìm kiếm theo tên hoặc mã tài sản trong DB
      const dbSearchFilter = [
        { assetCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: dbSearchFilter }];
        delete filter.$or;
      } else {
        filter.$or = dbSearchFilter;
      }

      // Tích hợp tìm kiếm đường trực tiếp từ OpenStreetMap (Dữ liệu Leaflet)
      try {
        // Gọi API Nominatim giới hạn trong khu vực Đà Nẵng
        const osmResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&addressdetails=1&limit=3&viewbox=107.8,16.2,108.4,15.9&bounded=1`);
        if (osmResponse.ok) {
          const data = await osmResponse.json();
          osmAssets = data.map(item => ({
            id: `osm-${item.place_id}`,
            _id: `osm-${item.place_id}`,
            name: item.display_name.split(',')[0], // Lấy tên đường/địa điểm chính
            assetCode: 'OSM-LOCATION',
            assetType: 'osm_location', // Để Frontend dễ dàng phân biệt và gắn icon riêng
            status: 'good',
            geometry: {
              type: 'Point',
              coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
            },
            osmDetails: item.display_name
          }));
        }
      } catch (error) {
        console.error('OSM Search Error:', error.message);
      }
    }
  }

  if (bbox && !filter.geometry) {
    const [west, south, east, north] = bbox.split(',').map(Number);
    filter.geometry = {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ]],
        },
      },
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [dbAssets, total] = await Promise.all([
    Asset.find(filter)
      .populate('managedAreaId', 'code name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Asset.countDocuments(filter),
  ]);

  // Trộn kết quả từ OSM và DB
  const combinedAssets = [...osmAssets, ...dbAssets];

  return { 
    assets: combinedAssets, 
    total: total + osmAssets.length, 
    page: parseInt(page), 
    limit: parseInt(limit) 
  };
};

const getAssetById = async (id) => {
  const asset = await Asset.findById(id).populate('managedAreaId', 'code name');
  if (!asset || asset.isDeleted) {
    throw Object.assign(new Error('Không tìm thấy tài sản'), { statusCode: 404 });
  }
  return asset;
};

const createAsset = async (data, user) => {
  const geoCheck = validateGeoJSON(data.geometry);
  if (!geoCheck.valid) {
    throw Object.assign(new Error(geoCheck.message), { statusCode: 400 });
  }

  if (!data.assetCode) {
    const prefix = data.assetType ? data.assetType.substring(0, 3).toUpperCase() : 'AST';
    const count = await Asset.countDocuments();
    data.assetCode = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }

  data.geometryType = data.geometry.type;
  data.createdBy = user?._id;
  data.updatedBy = user?._id;
  data.captureMethod = data.captureMethod || 'manual';
  data.capturedAt = data.capturedAt || new Date();

  if (user?.role === 'user') {
    data.approvalStatus = 'pending';
  } else {
    data.approvalStatus = data.approvalStatus || 'approved';
  }

  const asset = new Asset(data);
  await asset.save();

  audit.log({
    action: 'create',
    entityType: 'Asset',
    entityId: asset._id,
    performedBy: user?._id,
    after: asset.toObject(),
    details: `Tạo tài sản ${asset.assetCode}`,
  });

  return asset;
};

const updateAsset = async (id, data, user) => {
  if (data.geometry) {
    const geoCheck = validateGeoJSON(data.geometry);
    if (!geoCheck.valid) {
      throw Object.assign(new Error(geoCheck.message), { statusCode: 400 });
    }
    data.geometryType = data.geometry.type;
  }

  const before = await Asset.findById(id);
  if (!before) {
    throw Object.assign(new Error('Không tìm thấy tài sản'), { statusCode: 404 });
  }

  data.updatedBy = user?._id;
  const asset = await Asset.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).populate('managedAreaId', 'code name');

  audit.log({
    action: 'update',
    entityType: 'Asset',
    entityId: asset._id,
    performedBy: user?._id,
    before: before.toObject(),
    after: asset.toObject(),
    details: `Cập nhật tài sản ${asset.assetCode}`,
  });

  return asset;
};

const deleteAsset = async (id, user) => {
  const before = await Asset.findById(id);
  if (!before) {
    throw Object.assign(new Error('Không tìm thấy tài sản'), { statusCode: 404 });
  }

  const asset = await Asset.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  audit.log({
    action: 'delete',
    entityType: 'Asset',
    entityId: asset._id,
    performedBy: user?._id,
    before: before.toObject(),
    details: `Xóa tài sản ${asset.assetCode}`,
  });

  return asset;
};

const getAssetGeoJSON = async (query) => {
  const { assetType, status, bbox, search, user } = query;
  const filter = { isDeleted: false };

  // Cập nhật filter tương tự hàm getAssets cho Người dân
  if (user?.role === 'user') {
    filter.$or = [
      { approvalStatus: 'approved' },
      { assetType: { $in: ['road', 'bus_stop', 'parking_lot', 'public_facility'] } }
    ];
  }

  if (assetType) filter.assetType = assetType;
  if (status) filter.status = status;

  if (search) {
    const coordRegex = /^[-+]?\d+(\.\d+)?\s*(,|;|\s)\s*[-+]?\d+(\.\d+)?$/;
    
    if (coordRegex.test(search.trim())) {
      const parts = search.trim().match(/[-+]?\d+(\.\d+)?/g);
      if (parts && parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        filter.geometry = {
          $geoWithin: {
            $centerSphere: [[lng, lat], 1 / 6378.1]
          }
        };
      }
    } else {
      const dbSearchFilter = [
        { assetCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
      
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: dbSearchFilter }];
        delete filter.$or;
      } else {
        filter.$or = dbSearchFilter;
      }
    }
  }

  if (bbox && !filter.geometry) {
    const [west, south, east, north] = bbox.split(',').map(Number);
    filter.geometry = {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ]],
        },
      },
    };
  }

  const assets = await Asset.find(filter).populate('managedAreaId', 'code name');

  return {
    type: 'FeatureCollection',
    features: assets.map(asset => ({
      type: 'Feature',
      geometry: asset.geometry,
      properties: {
        id: asset.id,
        assetCode: asset.assetCode,
        name: asset.name,
        assetType: asset.assetType,
        status: asset.status,
        material: asset.material,
        dimensions: asset.dimensions,
        managedAreaId: asset.managedAreaId,
        lastInspectionAt: asset.lastInspectionAt,
      },
    })),
  };
};

// --- HÀM TẠO DỮ LIỆU THỰC TẾ (SEED) ---
// Gọi hàm này trong file utils/seed.js hoặc tạo 1 route API riêng biệt (VD: GET /api/assets/seed-facilities)
const seedUrbanFacilities = async () => {
  const mockFacilities = [
    { name: 'Trạm xe buýt Tôn Đức Thắng', assetType: 'bus_stop', geometry: { type: 'Point', coordinates: [108.165, 16.059] }, status: 'good' },
    { name: 'Trạm xe buýt Nguyễn Văn Linh', assetType: 'bus_stop', geometry: { type: 'Point', coordinates: [108.209, 16.062] }, status: 'good' },
    { name: 'Trạm xe buýt Biển Mỹ Khê', assetType: 'bus_stop', geometry: { type: 'Point', coordinates: [108.246, 16.059] }, status: 'fair' },
    { name: 'Bãi đỗ xe Công cộng Bạch Đằng', assetType: 'parking_lot', geometry: { type: 'Point', coordinates: [108.225, 16.068] }, status: 'good' },
    { name: 'Bãi đỗ xe Chợ Hàn', assetType: 'parking_lot', geometry: { type: 'Point', coordinates: [108.224, 16.068] }, status: 'fair' }
  ];

  let addedCount = 0;
  for (const item of mockFacilities) {
    const exists = await Asset.findOne({ name: item.name });
    if (!exists) {
      const count = await Asset.countDocuments();
      item.assetCode = `PUB-${String(count + 1).padStart(5, '0')}`;
      item.approvalStatus = 'approved';
      item.captureMethod = 'manual';
      await new Asset(item).save();
      addedCount++;
    }
  }
  return { message: `Đã khởi tạo thành công ${addedCount} tiện ích đô thị.` };
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetGeoJSON,
  seedUrbanFacilities
};