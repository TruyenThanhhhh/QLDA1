const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/area.controller');

router.get('/', auth, ctrl.getAreas);

module.exports = router;
