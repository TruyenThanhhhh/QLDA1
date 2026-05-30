const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/ai.controller');

router.post('/chat', auth, ctrl.chat);

module.exports = router;
