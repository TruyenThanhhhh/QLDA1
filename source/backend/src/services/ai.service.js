/**
 * Phân tích các nhãn (tags) trả về từ Cloudinary (hoặc Google Vision)
 * và ánh xạ sang mức độ nghiêm trọng (severity).
 * 
 * @param {Array} tags - Mảng các chuỗi nhãn (ví dụ: ['pothole', 'crack', 'water'])
 * @returns {String} Mức độ nghiêm trọng đề xuất (critical, high, medium, low, normal)
 */
const analyzeTagsForSeverity = (tags) => {
  if (!tags || tags.length === 0) return 'normal';

  const tagsLower = tags.map(t => t.toLowerCase());

  const criticalKeywords = ['accident', 'fire', 'flood', 'collapse', 'sinkhole'];
  const highKeywords = ['pothole', 'broken', 'damage', 'hazard', 'fallen'];
  const mediumKeywords = ['crack', 'peeling', 'rust', 'dirt', 'faded'];

  // Kiểm tra từ mức nghiêm trọng cao nhất trở xuống
  for (const keyword of criticalKeywords) {
    if (tagsLower.some(tag => tag.includes(keyword))) return 'critical';
  }

  for (const keyword of highKeywords) {
    if (tagsLower.some(tag => tag.includes(keyword))) return 'high';
  }

  for (const keyword of mediumKeywords) {
    if (tagsLower.some(tag => tag.includes(keyword))) return 'medium';
  }

  return 'normal'; // Nếu không có keyword cảnh báo nào
};

/**
 * Trích xuất tags từ response của Cloudinary
 * Cấu trúc trả về thường nằm trong file.info.categorization.google_tagging.data
 */
const extractTagsFromCloudinaryResponse = (file) => {
  try {
    if (!file || !file.info) return [];
    
    // multer-storage-cloudinary gắn thêm object info vào file
    const categorization = file.info.categorization || {};
    const googleTagging = categorization.google_tagging || {};
    const data = googleTagging.data || [];
    
    // Lấy danh sách tên nhãn (tag)
    return data.map(item => item.tag);
  } catch (err) {
    console.error('Lỗi khi trích xuất AI Tags từ Cloudinary:', err);
    return [];
  }
};

module.exports = {
  analyzeTagsForSeverity,
  extractTagsFromCloudinaryResponse
};
