const Asset = require('../models/Asset');
const { success, error } = require('../utils/response');
const path = require('path');
const aiService = require('../services/ai.service');

const uploadPhotos = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset || asset.isDeleted) {
      return error(res, 'Không tìm thấy tài sản', 404);
    }

    if (!req.files || req.files.length === 0) {
      return error(res, 'Không có ảnh nào được upload', 400);
    }

    const photos = req.files.map(file => {
      const isCloudinary = file.path && file.path.startsWith('http');
      
      let aiTags = [];
      let aiSeverity = 'normal';

      if (isCloudinary) {
        aiTags = aiService.extractTagsFromCloudinaryResponse(file);
        aiSeverity = aiService.analyzeTagsForSeverity(aiTags);
      }

      return {
        filename: file.filename || file.originalname,
        originalName: file.originalname,
        path: isCloudinary ? file.path : `/uploads/photos/${file.filename}`,
        size: file.size || 0,
        aiTags: aiTags,
        aiSeverity: aiSeverity,
        uploadedAt: new Date(),
      };
    });

    asset.photos.push(...photos);
    await asset.save();

    success(res, {
      id: asset.id,
      uploadedCount: photos.length,
      photos: asset.photos,
    }, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadPhotos };
