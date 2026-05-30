const aiService = require('../services/ai.service');
const { success, error } = require('../utils/response');

const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return error(res, 'Tin nhắn không được để trống', 400);
    }

    const reply = await aiService.generateChatResponse(message, history || [], req.user);
    
    success(res, { reply }, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chat
};
