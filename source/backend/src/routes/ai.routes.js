const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const auth = require('../middleware/auth');

// Mọi người dùng đã đăng nhập đều có thể chat với trợ lý
router.post('/chat', auth, aiController.chat);

module.exports = router;
