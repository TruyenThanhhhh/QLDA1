const User = require('../models/User');
const { success, paginated, error } = require('../utils/response');
const audit = require('../services/audit.service');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const filter = { isDeleted: { $ne: true } };

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    paginated(res, users, total, page, limit);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { username, password, fullName, role, isActive } = req.body;

    if (!username || !password || !fullName) {
      return error(res, 'Vui lòng điền đầy đủ các thông tin bắt buộc', 400);
    }

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) {
      return error(res, 'Tên đăng nhập đã tồn tại trong hệ thống', 409);
    }

    const user = new User({
      username,
      passwordHash: password, // Pre-save hook hashes this
      fullName,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
    });

    await user.save();

    audit.log({
      action: 'create',
      entityType: 'User',
      entityId: user._id,
      performedBy: req.user?._id,
      after: user.toJSON(),
      details: `Admin tạo tài khoản người dùng: ${user.username} (${user.role})`,
    });

    success(res, { id: user.id, username: user.username, message: 'Đã tạo tài khoản thành công' }, 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { fullName, role, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.isDeleted) {
      return error(res, 'Không tìm thấy người dùng', 404);
    }

    const before = user.toObject();

    if (fullName !== undefined) user.fullName = fullName;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.passwordHash = password; // Pre-save hook hashes this

    await user.save();

    audit.log({
      action: 'update',
      entityType: 'User',
      entityId: user._id,
      performedBy: req.user?._id,
      before,
      after: user.toObject(),
      details: `Admin cập nhật tài khoản: ${user.username}`,
    });

    success(res, { id: user.id, username: user.username, message: 'Cập nhật thông tin tài khoản thành công' });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return error(res, 'Không tìm thấy người dùng', 404);
    }

    if (user._id.toString() === req.user?._id?.toString()) {
      return error(res, 'Không thể tự xoá tài khoản của chính mình', 400);
    }

    user.isDeleted = true;
    await user.save();

    audit.log({
      action: 'delete',
      entityType: 'User',
      entityId: user._id,
      performedBy: req.user?._id,
      details: `Admin xoá tài khoản: ${user.username}`,
    });

    success(res, { id: user.id, message: 'Xoá tài khoản thành công' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
