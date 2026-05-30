const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const reportCtrl = require('../controllers/report.controller');

// Bắt buộc đăng nhập cho tất cả các route báo cáo
router.use(auth);

// Các route thống kê chung
router.get('/summary', reportCtrl.getSummary);
router.get('/incidents', reportCtrl.getIncidentsByArea);
router.get('/priority', reportCtrl.getPriorityList);
router.get('/optimal-route', reportCtrl.getOptimalRoute);
router.get('/routing/custom', reportCtrl.getCustomRoute);

// Chỉ Admin và Leader mới được quyền xuất báo cáo
router.get('/export-excel', rbac('admin', 'leader'), reportCtrl.exportExcel);
router.get('/export-pdf', rbac('admin', 'leader'), reportCtrl.exportPDF);

// Dự báo nhu cầu bảo trì
router.get('/predictive-maintenance', rbac('admin', 'technician', 'leader'), reportCtrl.getPredictiveMaintenance);

module.exports = router;