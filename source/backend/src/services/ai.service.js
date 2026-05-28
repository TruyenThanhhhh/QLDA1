const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Asset = require('../models/Asset');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

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
    console.error('Lỗi khi trích xuất AI Tags từ Cloudinary:', err);
    return [];
  }
};

/**
 * Tạo phản hồi từ Chatbot sử dụng Gemini và dữ liệu hệ thống (RAG)
 */
const generateChatResponse = async (message, history = [], user) => {
  if (!genAI) {
    return "Hệ thống AI chưa được cấu hình (Thiếu GEMINI_API_KEY). Vui lòng liên hệ quản trị viên.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let context = "";
    const messageLower = message.toLowerCase();

    // 1. Thu thập ngữ cảnh (RAG)
    if (messageLower.includes('hướng dẫn') || messageLower.includes('cách dùng') || messageLower.includes('chức năng') || messageLower.includes('vai trò')) {
      const docFiles = ['02-pham-vi-va-yeu-cau-nghiep-vu.md', '03-yeu-cau-chuc-nang.md'];
      for (const fileName of docFiles) {
        const filePath = path.join(__dirname, '..', '..', '..', '..', 'prod', 'docs', fileName);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          context += `\nNội dung từ tài liệu ${fileName}:\n${content.substring(0, 2000)}\n`;
        }
      }
    }

    if (messageLower.includes('báo cáo') || messageLower.includes('sự cố') || messageLower.includes('tình trạng')) {
      const userRecords = await MaintenanceRecord.find({ reportedBy: user._id })
        .sort({ recordedAt: -1 })
        .limit(5)
        .populate('assetId', 'name assetCode');
      
      if (userRecords.length > 0) {
        context += `\nDanh sách báo cáo gần đây của bạn:\n`;
        userRecords.forEach(rec => {
          context += `- Tiêu đề: ${rec.title}, Tài sản: ${rec.assetId?.name || 'không rõ'}, Trạng thái: ${rec.status}, Ngày báo: ${rec.recordedAt.toLocaleDateString('vi-VN')}\n`;
        });
      } else {
        context += `\nBạn chưa có báo cáo sự cố nào.\n`;
      }
    }

    // 2. Cấu hình System Instruction và Hội thoại cho Gemini
    const systemInstruction = `Bạn là trợ lý ảo thông minh của hệ thống Quản lý Hạ tầng Đường bộ (QLDA).
Hãy trả lời lịch sự, chuyên nghiệp, bằng tiếng Việt.
Sử dụng ngữ cảnh sau đây nếu có thông tin liên quan:
${context}

Thông tin người dùng hiện tại:
- Tên: ${user.fullName || 'Người dùng'}
- Vai trò: ${user.role} (user=người dân, technician=kỹ thuật, admin=quản trị)`;

    // Chuyển đổi lịch sử chat sang định dạng Gemini
    const geminiHistory = history.slice(-6).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Bắt đầu chat với system instruction tích hợp trong tin nhắn đầu tiên (do flash 1.5 hỗ trợ systemInstruction riêng nhưng startChat có thể dùng history)
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemInstruction + "\nHãy bắt đầu hỗ trợ tôi." }] },
        { role: 'model', parts: [{ text: "Chào bạn! Tôi đã nắm rõ vai trò và dữ liệu hệ thống. Tôi có thể giúp gì cho bạn?" }] },
        ...geminiHistory
      ]
    });

    const result = await chat.sendMessage(message);
    return result.response.text();

  } catch (err) {
    console.error('Lỗi khi gọi Gemini API:', err);
    throw new Error('Không thể kết nối với dịch vụ AI Gemini vào lúc này.');
  }
};

module.exports = {
  analyzeTagsForSeverity,
  extractTagsFromCloudinaryResponse,
  generateChatResponse
};
