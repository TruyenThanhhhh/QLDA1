const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getAllUsers = async (query = {}) => {
  const { page = 1, limit = 20, role, search } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const filter = {};
  if (role) filter.role = role;
  
  // Hỗ trợ tìm kiếm theo tên hoặc username
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-passwordHash').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);

  return { users, total, page: parseInt(page), limit: parseInt(limit) };
};

const createUser = async (data) => {
  // 1. Kiểm tra dữ liệu đầu vào cơ bản
  if (!data.username) throw Object.assign(new Error('Tên đăng nhập là bắt buộc'), { statusCode: 400 });
  if (!data.fullName) throw Object.assign(new Error('Họ và tên là bắt buộc'), { statusCode: 400 });
  
  const pwd = data.password || data.passwordHash;
  if (!pwd) throw Object.assign(new Error('Mật khẩu là bắt buộc'), { statusCode: 400 });

  // 2. Kiểm tra trùng lặp (username mặc định lowercase)
  const existingUser = await User.findOne({ username: data.username.toLowerCase() });
  if (existingUser) {
    throw Object.assign(new Error('Tên đăng nhập đã tồn tại'), { statusCode: 400 });
  }

  // 3. Khởi tạo đối tượng User với TỪNG TRƯỜNG CHỈ ĐỊNH RÕ RÀNG
  // Việc này loại bỏ hoàn toàn khả năng Mongoose bắt lỗi "Dữ liệu không hợp lệ" do key thừa/thiếu
  const user = new User({
    username: data.username,
    fullName: data.fullName,
    role: data.role || 'user',
    passwordHash: pwd, // Schema yêu cầu trường này
    isActive: data.isActive !== undefined ? data.isActive : true
  });
  
  // 4. Lưu và bắt lỗi Mongoose chi tiết nếu có
  try {
    await user.save();
  } catch (err) {
    // Trả về chính xác thông báo lỗi của Mongoose để Frontend hiển thị thay vì lỗi chung chung
    throw Object.assign(new Error(err.message), { statusCode: 400 });
  }
  
  const userObj = user.toObject();
  return userObj;
};

const updateUser = async (id, data) => {
  const updateData = { ...data };
  
  // Mã hóa mật khẩu mới nếu Admin thực hiện đổi mật khẩu
  if (updateData.password && updateData.password.trim() !== '') {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
  }
  
  // Xóa trường password thô để không lưu thừa vào Database
  delete updateData.password;

  try {
    const user = await User.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
    return user;
  } catch (err) {
    throw Object.assign(new Error(err.message), { statusCode: 400 });
  }
};

const toggleUserStatus = async (id) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('Không tìm thấy tài khoản'), { statusCode: 404 });
  
  user.isActive = !user.isActive; // Toggle Khóa/Mở khóa tài khoản
  await user.save();
  
  const userObj = user.toObject();
  return userObj;
};

module.exports = { getAllUsers, createUser, updateUser, toggleUserStatus };