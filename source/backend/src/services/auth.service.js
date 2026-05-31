const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (username, password) => {
  const user = await User.findOne({ username: username.toLowerCase(), isActive: true }).select('+passwordHash');
  if (!user) {

    throw Object.assign(new Error('Tên đăng nhập hoặc mật khẩu không đúng'), { statusCode: 401 });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error('Tên đăng nhập hoặc mật khẩu không đúng'), { statusCode: 401 });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return { token, user: user.toJSON() };
};

const getAllUsers = async () => {
  return await User.find().sort({ createdAt: -1 });
};

const createUser = async (data) => {
  const user = new User({
    username: data.username,
    fullName: data.fullName,
    role: data.role,
    passwordHash: data.password,
  });
  await user.save();
  return user;
};

const updateUser = async (id, data) => {
  const user = await User.findById(id);
  if (!user) {
    throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
  }

  // Prevent admin from changing their own role or isActive status
  if (user._id.toString() === data.requestingUser._id.toString() && data.requestingUser.role === 'admin') {
    if (data.role && data.role !== user.role) {
      throw Object.assign(new Error('Admin không thể tự thay đổi vai trò của mình'), { statusCode: 403 });
    }
    if (data.isActive === false) {
      throw Object.assign(new Error('Admin không thể tự khóa tài khoản của mình'), { statusCode: 403 });
    }
  }

  if (data.fullName) user.fullName = data.fullName;
  if (data.role) user.role = data.role;
  if (data.isActive !== undefined) user.isActive = data.isActive;
  if (data.password) user.passwordHash = data.password;

  await user.save();
  return user;
};

module.exports = { login, getAllUsers, createUser, updateUser };
