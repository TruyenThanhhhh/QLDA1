const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/asset.controller');
const uploadCtrl = require('../controllers/upload.controller');
const approvalCtrl = require('../controllers/approval.controller');

router.get('/', auth, ctrl.getAssets);
router.get('/geojson', auth, ctrl.getAssetGeoJSON);
router.get('/:id', auth, ctrl.getAsset);
router.post('/', auth, rbac('admin', 'technician', 'user'), ctrl.createAsset);
router.patch('/:id', auth, rbac('admin'), ctrl.updateAsset);
router.delete('/:id', auth, rbac('admin'), ctrl.deleteAsset);
router.post('/:id/photos', auth, upload.array('photos', 5), uploadCtrl.uploadPhotos);
router.patch('/:id/approval', auth, rbac('admin', 'technician', 'leader'), approvalCtrl.approveAsset);
router.post('/:id/upvote', auth, ctrl.upvoteAsset);
router.post('/:id/comment', auth, ctrl.addComment);

module.exports = router;
