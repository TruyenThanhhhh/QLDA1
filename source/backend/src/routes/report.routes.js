const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/report.controller');
const rbac = require('../middleware/rbac');

// ĐÃ SỬA: Thêm 'leader' vào danh sách phân quyền để tài khoản Lãnh đạo có thể xem báo cáo
router.get('/summary', auth, rbac('admin', 'technician', 'leader'), ctrl.getSummary);
router.get('/incidents', auth, rbac('admin', 'technician', 'leader'), ctrl.getIncidentsByArea);
router.get('/priority', auth, rbac('admin', 'technician', 'leader'), ctrl.getPriorityList);

router.get('/routing', auth, ctrl.getOptimalRoute); // Ai cũng xem được lộ trình

module.exports = router;