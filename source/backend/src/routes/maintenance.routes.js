const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/maintenance.controller');

router.get('/assets/:id/maintenance', auth, ctrl.getByAsset);
router.post('/assets/:id/maintenance', auth, rbac('admin', 'technician', 'user'), ctrl.create);
router.patch('/maintenance/:id', auth, rbac('admin', 'technician'), ctrl.update);

// Route lấy danh sách công việc thi công
router.get('/tasks', auth, rbac('admin', 'technician', 'leader'), ctrl.getAllTasks);

// Route xuất file PDF danh sách công việc cho Lãnh đạo
router.get('/tasks/export-pdf', auth, rbac('admin', 'leader'), ctrl.exportTasksPDF);

// ==========================================
// CÁC ROUTES MỚI BỔ SUNG DÀNH CHO GIAO VIỆC
// ==========================================

// Route lấy danh sách kỹ thuật viên
router.get('/technicians', auth, rbac('admin', 'leader'), ctrl.getTechnicians);

// Route thực thi giao việc
router.patch('/assign-by-asset/:assetId', auth, rbac('admin', 'leader'), ctrl.assignByAsset);

module.exports = router;