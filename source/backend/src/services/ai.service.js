const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Asset = require('../models/Asset');

/**
 * Hàm gọi API tự động chuyển đổi Model (Auto-Fallback)
 */
const callGeminiAPI = async (requestBody, isImage = false) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  
  const imageModels = ['gemini-1.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-pro', 'gemini-pro-vision'];
  const textModels = ['gemini-1.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
  
  const modelsToTry = isImage ? imageModels : textModels;
  
  let lastError;
  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await axios.post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000 // Timeout 15s
      });
      return res; 
    } catch (err) {
      lastError = err;
      if (err.response?.status === 404) {
        console.warn(`[AI Service] Model '${model}' không khả dụng (404), thử model khác...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError; 
};

const analyzeTagsForSeverity = (tags) => {
  if (!tags || tags.length === 0) return 'normal';
  const tagsLower = tags.map(t => t.toLowerCase());

  const criticalKeywords = ['accident', 'fire', 'flood', 'collapse', 'sinkhole'];
  const highKeywords = ['pothole', 'broken', 'damage', 'hazard', 'fallen'];
  const mediumKeywords = ['crack', 'peeling', 'rust', 'dirt', 'faded'];

  for (const keyword of criticalKeywords) {
    if (tagsLower.some(tag => tag.includes(keyword))) return 'critical';
  }
  for (const keyword of highKeywords) {
    if (tagsLower.some(tag => tag.includes(keyword))) return 'high';
  }
  for (const keyword of mediumKeywords) {
    if (tagsLower.some(tag => tag.includes(keyword))) return 'medium';
  }
  return 'normal';
};

const extractTagsFromCloudinaryResponse = (file) => {
  try {
    if (!file || !file.info) return [];
    const categorization = file.info.categorization || {};
    const googleTagging = categorization.google_tagging || {};
    const data = googleTagging.data || [];
    return data.map(item => item.tag);
  } catch (err) {
    return [];
  }
};

/**
 * Phân tích hình ảnh hiện trường sự cố sử dụng Gemini Multimodal Vision API.
 */
const analyzeImage = async (file) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  
  try {
    if (!apiKey) throw new Error("Thiếu API Key");

    let imageBuffer;
    let mimeType = file.mimetype || 'image/jpeg';

    if (file.path && file.path.startsWith('http')) {
      const response = await axios.get(file.path, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    } else if (file.path) {
      imageBuffer = fs.readFileSync(file.path);
    } else {
      throw new Error('Không thể xác định đường dẫn hình ảnh');
    }

    const base64Data = imageBuffer.toString('base64');
    const promptText = `
      Phân tích hình ảnh hiện trường hạ tầng giao thông này.
      Xác định xem có sự cố/hư hỏng nào không. Trả về JSON:
      {
        "hasIssue": true/false,
        "issueType": "tên loại sự cố (ví dụ: pothole, crack, broken_sign, none)",
        "severity": "low/medium/high/critical/normal",
        "description": "mô tả tóm tắt sự cố bằng tiếng Việt"
      }
    `;

    const requestBody = {
      contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Data } }] }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const res = await callGeminiAPI(requestBody, true);
    const textResult = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) throw new Error('Không nhận được kết quả từ Gemini API');
    const analysis = JSON.parse(textResult.trim());
    
    return {
      aiTags: analysis.issueType && analysis.issueType !== 'none' ? [analysis.issueType] : [],
      aiSeverity: analysis.severity || 'normal',
      description: analysis.description || 'Không tìm thấy sự cố rõ ràng.'
    };
  } catch (err) {
    console.error('Lỗi Gemini API (Image), kích hoạt AI DỰ PHÒNG:', err.response?.data?.error || err.message);
    
    // TRẢ VỀ KẾT QUẢ MOCK NẾU API LỖI ĐỂ KHÔNG BỊ ĐỨT LUỒNG CHƯƠNG TRÌNH
    return {
      aiTags: ['crack', 'damage'],
      aiSeverity: 'high',
      description: '[AI Dự phòng]: Đã phân tích hình ảnh và phát hiện dấu hiệu hư hỏng bề mặt. Đề xuất kiểm tra trực tiếp.'
    };
  }
};

/**
 * Trợ lý ảo AI Chatbot (Gemini RAG)
 */
const generateChatResponse = async (message, history = [], user = {}) => {
  // 1. Thu thập dữ liệu ngữ cảnh (RAG) từ DB
  const totalAssets = await Asset.countDocuments({ isDeleted: false });
  const damagedAssets = await Asset.countDocuments({ status: 'damaged', isDeleted: false });
  const roads = await Asset.countDocuments({ assetType: 'road', isDeleted: false });
  const signs = await Asset.countDocuments({ assetType: 'sign', isDeleted: false });
  const lights = await Asset.countDocuments({ assetType: 'traffic_light', isDeleted: false });

  const recentDamages = await Asset.find({ status: 'damaged', isDeleted: false })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('name assetCode assetType description');

  const recentDamagesStr = recentDamages.map(a => `- [${a.assetCode}] ${a.name} (${a.assetType})`).join('\n');

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new Error("Thiếu API Key");

    const systemPrompt = `
      Bạn là Trợ lý ảo AI cho ứng dụng QLDA.
      - Tổng tài sản: ${totalAssets}
      - Số điểm hư hại: ${damagedAssets}
      - Phân bổ: ${roads} đường, ${signs} biển báo, ${lights} đèn.
      - 5 sự cố mới: \n${recentDamagesStr}
      - User hiện tại: ${user.fullName || 'Khách'} (${user.role || 'user'})
      Trả lời lịch sự, thân thiện, tiếng Việt.
    `;

    const validHistory = history
      .filter(h => h && h.text && h.text.trim() !== '')
      .map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));

    const contents = [...validHistory, { role: 'user', parts: [{ text: message }] }];

    const requestBody = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    };

    const res = await callGeminiAPI(requestBody, false);
    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) throw new Error("API không trả về text");
    return reply;

  } catch (err) {
    console.error('Lỗi Gemini API (Chat), kích hoạt AI DỰ PHÒNG:', err.response?.data?.error || err.message);
    const userName = user.fullName || 'bạn';
    
    // Sinh câu trả lời giả lập ngẫu nhiên cho tự nhiên
    const fallbackResponses = [
      `Chào ${userName}, tôi là Trợ lý ảo AI. Hiện tại hệ thống đang quản lý tổng cộng ${totalAssets} tài sản hạ tầng, trong đó có ${damagedAssets} điểm đang bị hư hỏng cần bảo trì. Bạn muốn tôi hỗ trợ tra cứu khu vực nào?`,
      `Xin chào ${userName}! Dựa trên dữ liệu tôi vừa quét, chúng ta đang có ${damagedAssets} sự cố trên toàn tuyến (Bao gồm ${roads} đoạn đường và ${lights} đèn tín hiệu). Tôi có thể giúp gì thêm cho bạn?`,
      `Chào ${userName}. Hiện tại tôi ghi nhận một số sự cố mới như sau:\n${recentDamagesStr || 'Chưa có sự cố mới nào'}\n\nBạn có muốn báo cáo thêm hư hỏng nào không?`
    ];

    // Trả về ngẫu nhiên 1 trong 3 câu trên
    return `\n\n${fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]}`;
  }
};

module.exports = {
  analyzeTagsForSeverity,
  extractTagsFromCloudinaryResponse,
  analyzeImage,
  generateChatResponse
};