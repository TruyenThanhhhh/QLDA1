const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/maintenance.controller');
const upload = require('../middleware/upload');

router.get('/assets/:id/maintenance', auth, ctrl.getByAsset);
router.post('/assets/:id/maintenance', auth, rbac('admin', 'technician', 'user'), ctrl.create);
router.patch('/maintenance/:id', auth, rbac('admin', 'technician'), ctrl.update);

// Route lấy danh sách công việc thi công
router.get('/tasks', auth, rbac('admin', 'technician', 'leader'), ctrl.getAllTasks);

// Route xuất file PDF danh sách công việc cho Lãnh đạo
router.get('/tasks/export-pdf', auth, rbac('admin', 'leader'), ctrl.exportTasksPDF);
router.get('/technicians', auth, rbac('admin', 'leader'), ctrl.getTechnicians);
router.patch('/assign-by-asset/:assetId', auth, rbac('admin', 'leader'), ctrl.assignByAsset);

// ROUTE UPLOAD ẢNH (Đã được định nghĩa chính xác)
router.post('/maintenance/:id/photos', auth, upload.array('photos', 5), ctrl.uploadPhotos);

module.exports = router;