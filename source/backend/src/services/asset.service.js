const Asset = require('../models/Asset');
const Area = require('../models/Area');
const MaintenanceRecord = require('../models/MaintenanceRecord'); // Bổ sung Model này để tự động tạo việc
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
    approvalStatus,
  } = query;

  // Luôn loại bỏ các tài sản đã bị xóa mềm (Bao gồm cả các tài sản bị TỪ CHỐI)
  const filter = { isDeleted: false };

  // --- BỘ LỌC DUYỆT (CHỐNG LỌT DỮ LIỆU RÁC) ---
  if (approvalStatus) {
    filter.approvalStatus = approvalStatus;
  } else {
    // Nếu Frontend không yêu cầu cụ thể (như trên Bản đồ), CHỈ TRẢ VỀ TÀI SẢN ĐÃ DUYỆT
    filter.approvalStatus = 'approved'; 
  }

  if (assetType) filter.assetType = assetType;
  if (status) filter.status = status;
  if (managedAreaId) filter.managedAreaId = managedAreaId;

  let osmAssets = [];

  if (search) {
    const coordRegex = /^[-+]?\d+(\.\d+)?\s*(,|;|\s)\s*[-+]?\d+(\.\d+)?$/;
    if (coordRegex.test(search.trim())) {
      const parts = search.trim().match(/[-+]?\d+(\.\d+)?/g);
      if (parts && parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        filter.geometry = {
          $geoWithin: { $centerSphere: [[lng, lat], 1 / 6378.1] }
        };
      }
    } else {
      const dbSearchFilter = [
        { assetCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
      
      // Xử lý bộ lọc OR an toàn, không ghi đè logic approvalStatus
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: dbSearchFilter }];
        delete filter.$or;
      } else {
        filter.$or = dbSearchFilter;
      }

      // Tích hợp tìm kiếm OSM
      try {
        const osmResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&addressdetails=1&limit=3&viewbox=107.8,16.2,108.4,15.9&bounded=1`);
        if (osmResponse.ok) {
          const data = await osmResponse.json();
          osmAssets = data.map(item => ({
            id: `osm-${item.place_id}`,
            _id: `osm-${item.place_id}`,
            name: item.display_name.split(',')[0],
            assetCode: 'OSM-LOCATION',
            assetType: 'osm_location',
            status: 'good',
            geometry: { type: 'Point', coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
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
          coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
        },
      },
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [dbAssets, total] = await Promise.all([
    Asset.find(filter).populate('managedAreaId', 'code name').sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
    Asset.countDocuments(filter),
  ]);

  const combinedAssets = [...osmAssets, ...dbAssets];

  return { assets: combinedAssets, total: total + osmAssets.length, page: parseInt(page), limit: parseInt(limit) };
};

const getAssetGeoJSON = async (query) => {
  const { assetType, status, bbox, search, approvalStatus } = query;
  const filter = { isDeleted: false };

  // CHỈ LẤY TÀI SẢN ĐÃ DUYỆT LÊN BẢN ĐỒ
  if (approvalStatus) {
    filter.approvalStatus = approvalStatus;
  } else {
    filter.approvalStatus = 'approved';
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
        filter.geometry = { $geoWithin: { $centerSphere: [[lng, lat], 1 / 6378.1] } };
      }
    } else {
      const dbSearchFilter = [ { assetCode: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } } ];
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
    filter.geometry = { $geoWithin: { $geometry: { type: 'Polygon', coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] } } };
  }

  const assets = await Asset.find(filter).populate('managedAreaId', 'code name');
  return {
    type: 'FeatureCollection',
    features: assets.map(asset => ({
      type: 'Feature',
      geometry: asset.geometry,
      properties: {
        id: asset.id, assetCode: asset.assetCode, name: asset.name, assetType: asset.assetType, status: asset.status, material: asset.material, dimensions: asset.dimensions, managedAreaId: asset.managedAreaId, lastInspectionAt: asset.lastInspectionAt,
      },
    })),
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

  audit.log({ action: 'create', entityType: 'Asset', entityId: asset._id, performedBy: user?._id, after: asset.toObject(), details: `Tạo tài sản ${asset.assetCode}` });
  return asset;
};

const updateAsset = async (id, data, user) => {
  if (data.geometry) {
    const geoCheck = validateGeoJSON(data.geometry);
    if (!geoCheck.valid) throw Object.assign(new Error(geoCheck.message), { statusCode: 400 });
    data.geometryType = data.geometry.type;
  }

  const before = await Asset.findById(id);
  if (!before) throw Object.assign(new Error('Không tìm thấy tài sản'), { statusCode: 404 });

  data.updatedBy = user?._id;
  const asset = await Asset.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).populate('managedAreaId', 'code name');

  audit.log({ action: 'update', entityType: 'Asset', entityId: asset._id, performedBy: user?._id, before: before.toObject(), after: asset.toObject(), details: `Cập nhật tài sản ${asset.assetCode}` });
  return asset;
};

const deleteAsset = async (id, user) => {
  const before = await Asset.findById(id);
  if (!before) throw Object.assign(new Error('Không tìm thấy tài sản'), { statusCode: 404 });

  const asset = await Asset.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  audit.log({ action: 'delete', entityType: 'Asset', entityId: asset._id, performedBy: user?._id, before: before.toObject(), details: `Xóa tài sản ${asset.assetCode}` });
  return asset;
};

// --- HÀM TẠO DỮ LIỆU THỰC TẾ (SEED) ---
const seedUrbanFacilities = async () => { /* ... (Giữ nguyên) ... */ };

// ============================================================================
// HÀM MỚI: XỬ LÝ PHÊ DUYỆT (TỰ ĐỘNG XÓA KHI TỪ CHỐI & TẠO TASK KHI DUYỆT)
// ============================================================================
const approveAsset = async (id, approvalStatus, user) => {
  const asset = await Asset.findById(id);
  if (!asset || asset.isDeleted) {
    throw Object.assign(new Error('Không tìm thấy tài sản'), { statusCode: 404 });
  }

  const oldStatus = asset.approvalStatus;
  asset.approvalStatus = approvalStatus;

  // NẾU TỪ CHỐI -> Chuyển thành isDeleted = true để XÓA MỀM hoàn toàn khỏi DB hiển thị
  if (approvalStatus === 'rejected') {
    asset.isDeleted = true;
  }

  await asset.save();

  // NẾU DUYỆT & TÀI SẢN ĐANG HƯ HỎNG -> Tự động sinh ra 1 công việc bảo trì
  if (approvalStatus === 'approved' && asset.status === 'damaged') {
    const existingTask = await MaintenanceRecord.findOne({
      assetId: asset._id,
      status: { $in: ['open', 'in_progress'] }
    });

    // Chỉ tạo việc nếu tài sản này chưa có dự án sửa chữa nào đang diễn ra
    if (!existingTask) {
      await new MaintenanceRecord({
        assetId: asset._id,
        recordType: 'incident',
        title: `Xử lý sự cố: ${asset.name}`,
        description: 'Dự án bảo trì/sửa chữa được tạo tự động sau khi Lãnh đạo phê duyệt.',
        severity: 'high',
        status: 'open',
        reportedBy: user?._id || null
      }).save();
    }
  }

  audit.log({
    action: 'approval',
    entityType: 'Asset',
    entityId: asset._id,
    performedBy: user?._id,
    before: { approvalStatus: oldStatus },
    after: { approvalStatus },
    details: `Duyệt tài sản ${asset.assetCode}: ${oldStatus} → ${approvalStatus}`
  });

  return asset;
};

module.exports = { 
  getAssets, 
  getAssetById, 
  createAsset, 
  updateAsset, 
  deleteAsset, 
  getAssetGeoJSON, 
  seedUrbanFacilities,
  approveAsset // <--- Đừng quên export hàm này
};