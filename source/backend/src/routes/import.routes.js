const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/import.controller');

router.post('/geojson', auth, rbac('admin'), ctrl.importGeoJSON);

module.exports = router;
