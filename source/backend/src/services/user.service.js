const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getAllUsers = async (query = {}) => {
  const { page = 1, limit = 20, role, search } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const filter = {};
  if (role) filter.role = role;
  
  // Hỗ trợ tìm kiếm theo tên, username hoặc email
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);

  return { users, total, page: parseInt(page), limit: parseInt(limit) };
};

const createUser = async (data) => {
  const existingUser = await User.findOne({ username: data.username });
  if (existingUser) {
    throw Object.assign(new Error('Tên đăng nhập đã tồn tại'), { statusCode: 400 });
  }

  const user = new User(data);
  
  // Mã hóa mật khẩu
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(data.password, salt);
  }

  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

const updateUser = async (id, data) => {
  const updateData = { ...data };
  
  // Mã hóa mật khẩu mới nếu Admin đổi mật khẩu
  if (updateData.password && updateData.password.trim() !== '') {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(updateData.password, salt);
  } else {
    delete updateData.password; // Tránh ghi đè mật khẩu rỗng nếu admin không nhập pass mới
  }

  const user = await User.findByIdAndUpdate(
    id, 
    { $set: updateData }, 
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
  return user;
};

const toggleUserStatus = async (id) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
  
  user.isActive = !user.isActive; // Toggle Khóa/Mở khóa tài khoản
  await user.save();
  
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

module.exports = { getAllUsers, createUser, updateUser, toggleUserStatus };