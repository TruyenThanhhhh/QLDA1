const aiService = require('../services/ai.service');

const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tin nhắn' });
    }

    const response = await aiService.generateChatResponse(message, history, req.user);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    next(error);
  }
};

module.exports = {
  chat
};
