const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `Giá trị '${field}' đã tồn tại` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID không hợp lệ' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Lỗi hệ thống',
  });
};

module.exports = errorHandler;
