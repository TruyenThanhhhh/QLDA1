const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/maintenance.controller');

router.get('/assets/:id/maintenance', auth, ctrl.getByAsset);
router.post('/assets/:id/maintenance', auth, rbac('admin', 'technician', 'user'), ctrl.create);
router.patch('/maintenance/:id', auth, rbac('admin', 'technician'), ctrl.update);

module.exports = router;
