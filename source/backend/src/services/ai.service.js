const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Asset = require('../models/Asset');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Phân tích các nhãn (tags) trả về từ Cloudinary (hoặc Google Vision)
 * và ánh xạ sang mức độ nghiêm trọng (severity).
 */
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

/**
 * Trích xuất tags từ response của Cloudinary
 */
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
 * 
 * @param {Object} file - Đối tượng file từ Multer
 * @returns {Promise<Object>} Trả về object chứa { aiTags, aiSeverity, description }
 */
const analyzeImage = async (file) => {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY không được định nghĩa. Bỏ qua phân tích AI.');
    return { aiTags: [], aiSeverity: 'normal', description: 'Chưa phân tích (Thiếu API Key)' };
  }

  try {
    let imageBuffer;
    let mimeType = file.mimetype || 'image/jpeg';

    if (file.path && file.path.startsWith('http')) {
      // Cloudinary URL - tải ảnh về buffer
      const response = await axios.get(file.path, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    } else if (file.path) {
      // Local disk file
      imageBuffer = fs.readFileSync(file.path);
    } else {
      throw new Error('Không thể xác định đường dẫn hình ảnh');
    }

    const base64Data = imageBuffer.toString('base64');

    const promptText = `
      Phân tích hình ảnh hiện trường hạ tầng giao thông này.
      Xác định xem có sự cố/hư hỏng nào không (ví dụ: ổ gà, vết nứt, biển báo hỏng, đèn giao thông hỏng, cây ngã...).
      Trả về kết quả bằng tiếng Việt theo định dạng JSON chính xác như sau:
      {
        "hasIssue": true/false,
        "issueType": "tên loại sự cố bằng tiếng Anh (ví dụ: pothole, crack, broken_sign, faded_marking, none)",
        "severity": "low" hoặc "medium" hoặc "high" hoặc "critical" hoặc "normal",
        "description": "mô tả tóm tắt sự cố bằng tiếng Việt (tối đa 2 câu)"
      }
      Chú ý: Chỉ trả về JSON thuần, không bao gồm các ký tự markdown như \`\`\`json.
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const res = await axios.post(GEMINI_URL, requestBody);
    const textResult = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      throw new Error('Không nhận được kết quả từ Gemini API');
    }

    // Parse JSON kết quả
    const analysis = JSON.parse(textResult.trim());
    
    return {
      aiTags: analysis.issueType && analysis.issueType !== 'none' ? [analysis.issueType] : [],
      aiSeverity: analysis.severity || 'normal',
      description: analysis.description || 'Không tìm thấy sự cố rõ ràng.'
    };
  } catch (err) {
    console.error('Lỗi khi gọi Gemini Image Analyzer API:', err.message);
    return {
      aiTags: [],
      aiSeverity: 'normal',
      description: 'Lỗi trong quá trình phân tích hình ảnh của AI.'
    };
  }
};

/**
 * Trợ lý ảo AI Chatbot (Gemini RAG)
 */
const generateChatResponse = async (message, history = [], user = {}) => {
  if (!GEMINI_API_KEY) {
    return 'Xin lỗi, trợ lý ảo chưa được cấu hình API Key. Vui lòng liên hệ quản trị viên.';
  }

  try {
    // 1. Thu thập dữ liệu ngữ cảnh (RAG nhẹ) từ DB
    const totalAssets = await Asset.countDocuments({ isDeleted: false });
    const damagedAssets = await Asset.countDocuments({ status: 'damaged', isDeleted: false });
    const roads = await Asset.countDocuments({ assetType: 'road', isDeleted: false });
    const signs = await Asset.countDocuments({ assetType: 'sign', isDeleted: false });
    const lights = await Asset.countDocuments({ assetType: 'traffic_light', isDeleted: false });

    // Lấy 5 sự cố mới cập nhật nhất
    const recentDamages = await Asset.find({ status: 'damaged', isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name assetCode assetType description');

    const recentDamagesStr = recentDamages.map(a => `- [${a.assetCode}] ${a.name} (${a.assetType}): ${a.description || 'Không có mô tả'}`).join('\n');

    // Xây dựng Prompt hệ thống (System Instructions)
    const systemPrompt = `
      Bạn là Trợ lý ảo AI đắc lực cho ứng dụng QLDA - Hệ thống Quản lý Hạ tầng Giao thông và Hư hỏng Đường bộ.
      Vai trò của bạn: hỗ trợ kỹ thuật viên và người dân tra cứu thông tin hệ thống, báo cáo hư hại và đề xuất phương án bảo trì.

      Thông tin thực tế hiện tại của hệ thống (Ngữ cảnh RAG):
      - Tổng số tài sản hạ tầng đang quản lý: ${totalAssets} tài sản.
      - Số điểm hư hại cần xử lý: ${damagedAssets} điểm.
      - Phân bổ tài sản: ${roads} đường bộ, ${signs} biển báo, ${lights} đèn giao thông.
      - Danh sách 5 sự cố hư hại mới nhất trên bản đồ:
      ${recentDamagesStr || '(Không có sự cố nào)'}

      Thông tin người dùng đang trò chuyện:
      - Tên: ${user.fullName || 'Khách'}
      - Vai trò trong hệ thống: ${user.role || 'user'} (các vai trò gồm: admin, technician, user)

      Hướng dẫn ứng xử:
      - Trả lời lịch sự, thân thiện, ngắn gọn và tập trung vào chủ đề hạ tầng giao thông, đường bộ bị hư hỏng.
      - KHÔNG bịa đặt thông tin. Nếu không có trong ngữ cảnh hoặc kiến thức của bạn, hãy báo người dùng kiểm tra trên bản đồ.
      - Ngôn ngữ: Tiếng Việt.
    `;

    // Cấu trúc lịch sử hội thoại cho Gemini API
    // Gemini API sử dụng định dạng {"role": "user"|"model", "parts": [{"text": "..."}]}
    const contents = history.map(h => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    // Bổ sung tin nhắn hiện tại của user
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Thêm System Instruction vào request body
    const requestBody = {
      contents: contents,
      systemInstruction: {
        parts: [
          { text: systemPrompt }
        ]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    const res = await axios.post(GEMINI_URL, requestBody);
    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return reply || 'Xin lỗi, tôi chưa thể trả lời câu hỏi của bạn lúc này.';
  } catch (err) {
    console.error('Lỗi khi gọi Gemini Chatbot API:', err.message);
    return 'Xin lỗi, đã xảy ra sự cố kỹ thuật khi kết nối với máy chủ AI.';
  }
};

module.exports = {
  analyzeTagsForSeverity,
  extractTagsFromCloudinaryResponse,
  analyzeImage,
  generateChatResponse
};
