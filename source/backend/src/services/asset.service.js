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

  // Role-based filtering: non-admin/technician can only see approved assets
  if (user?.role === 'user') {
    filter.approvalStatus = 'approved';
  }

  if (assetType) filter.assetType = assetType;
  if (status) filter.status = status;
  if (managedAreaId) filter.managedAreaId = managedAreaId;

  if (search) {
    filter.$or = [
      { assetCode: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
  }

  // Bounding box query for viewport-based loading
  if (bbox) {
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
  const [assets, total] = await Promise.all([
    Asset.find(filter)
      .populate('managedAreaId', 'code name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Asset.countDocuments(filter),
  ]);

  return { assets, total, page: parseInt(page), limit: parseInt(limit) };
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
  const { assetType, status, bbox, user } = query;
  const filter = { isDeleted: false };

  // Role-based filtering: non-admin/technician can only see approved assets
  if (user?.role === 'user') {
    filter.approvalStatus = 'approved';
  }

  if (assetType) filter.assetType = assetType;
  if (status) filter.status = status;

  if (bbox) {
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

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetGeoJSON,
};
