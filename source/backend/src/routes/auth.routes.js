const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);
router.post('/register', ctrl.register);
router.get('/me', auth, ctrl.getMe);
router.get('/users', auth, rbac('admin'), ctrl.getUsers);
router.post('/users', auth, rbac('admin'), ctrl.createUser);
router.patch('/users/:id', auth, rbac('admin'), ctrl.updateUser);

module.exports = router;
