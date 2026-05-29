const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Cố gắng lấy Token từ Header trước (ưu tiên)
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } 
    // 2. NẾU KHÔNG CÓ TRONG HEADER, tìm trong URL Query String (phục vụ cho tải file)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    // Nếu sau 2 bước vẫn không có token -> Báo lỗi 401
    if (!token) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    // NẾU CÓ TOKEN TỪ FRONTEND BỊ BAO TRONG DẤU NGOẶC KÉP THÌ XÓA NÓ ĐI
    token = token.replace(/^"(.*)"$/, '$1');

    // 3. Giải mã và kiểm tra User
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc tài khoản bị vô hiệu' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }
    return res.status(401).json({ message: 'Xác thực thất bại' });
  }
};

module.exports = auth;