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

    const photos = [];
    for (const file of req.files) {
      const isCloudinary = file.path && file.path.startsWith('http');
      
      let aiTags = [];
      let aiSeverity = 'normal';
      let aiDescription = '';

      try {
        const aiResult = await aiService.analyzeImage(file);
        aiTags = aiResult.aiTags;
        aiSeverity = aiResult.aiSeverity;
        aiDescription = aiResult.description;
      } catch (err) {
        console.error('Lỗi khi phân tích ảnh qua Gemini:', err);
      }

      photos.push({
        filename: file.filename || file.originalname,
        originalName: file.originalname,
        path: isCloudinary ? file.path : `/uploads/photos/${file.filename}`,
        size: file.size || 0,
        aiTags: aiTags,
        aiSeverity: aiSeverity,
        description: aiDescription,
        uploadedAt: new Date(),
      });
    }

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
