const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/user.controller');

router.get('/', auth, rbac('admin'), ctrl.getUsers);
router.post('/', auth, rbac('admin'), ctrl.createUser);
router.patch('/:id', auth, rbac('admin'), ctrl.updateUser);
router.delete('/:id', auth, rbac('admin'), ctrl.deleteUser);

module.exports = router;
