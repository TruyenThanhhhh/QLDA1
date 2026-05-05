const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/report.controller');

const rbac = require('../middleware/rbac');

router.get('/summary', auth, rbac('admin', 'technician'), ctrl.getSummary);
router.get('/incidents', auth, rbac('admin', 'technician'), ctrl.getIncidentsByArea);
router.get('/priority', auth, rbac('admin', 'technician'), ctrl.getPriorityList);
router.get('/routing', auth, ctrl.getOptimalRoute); // Ai cũng xem được lộ trình

module.exports = router;
