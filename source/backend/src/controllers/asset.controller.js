const assetService = require('../services/asset.service');
const { success, paginated, error } = require('../utils/response');
const { getIo } = require('../config/socket');
const Asset = require('../models/Asset');

const getAssets = async (req, res, next) => {
  try {
    const result = await assetService.getAssets({ ...req.query, user: req.user });
    paginated(res, result.assets, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

const getAssetGeoJSON = async (req, res, next) => {
  try {
    const geojson = await assetService.getAssetGeoJSON({ ...req.query, user: req.user });
    success(res, geojson);
  } catch (err) {
    next(err);
  }
};

const getAsset = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    success(res, asset);
  } catch (err) {
    next(err);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user);
    getIo().emit('new_asset_event', { type: 'CREATE_ASSET', data: asset });
    success(res, { id: asset.id, message: 'Asset created successfully' }, 201);
  } catch (err) {
    next(err);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body, req.user);
    getIo().emit('new_asset_event', { type: 'UPDATE_ASSET', data: asset });
    success(res, { id: asset.id, message: 'Asset updated successfully' });
  } catch (err) {
    next(err);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id, req.user);
    success(res, { id: req.params.id, message: 'Asset deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const upvoteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset || asset.isDeleted) {
      return error(res, 'Không tìm thấy tài sản', 404);
    }

    const index = asset.upvotes.indexOf(req.user._id);
    if (index === -1) {
      asset.upvotes.push(req.user._id);
    } else {
      asset.upvotes.splice(index, 1);
    }

    await asset.save();
    success(res, { id: asset.id, upvotesCount: asset.upvotes.length, hasUpvoted: index === -1 });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return error(res, 'Nội dung bình luận không được để trống', 400);
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset || asset.isDeleted) {
      return error(res, 'Không tìm thấy tài sản', 404);
    }

    asset.comments.push({
      userId: req.user._id,
      fullName: req.user.fullName,
      text: text.trim(),
      createdAt: new Date(),
    });

    await asset.save();
    success(res, { id: asset.id, comments: asset.comments }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAssets, getAssetGeoJSON, getAsset, createAsset, updateAsset, deleteAsset, upvoteAsset, addComment };
