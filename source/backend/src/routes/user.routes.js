const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const userCtrl = require('../controllers/user.controller');

// BẢO MẬT TỐI ĐA: Chỉ duy nhất Admin mới được truy cập các Route này
router.use(auth, rbac('admin'));

router.get('/', userCtrl.getAllUsers);
router.post('/', userCtrl.createUser);
router.patch('/:id', userCtrl.updateUser);
router.delete('/:id', userCtrl.toggleUserStatus); // Dùng method DELETE để Khóa/Mở khóa (Soft Delete)

module.exports = router;