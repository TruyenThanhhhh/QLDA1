const success = (res, data, statusCode = 200) => {
  // Bám sát API Contract: trả về trực tiếp object dữ liệu
  res.status(statusCode).json(data);
};

const paginated = (res, items, total, page, limit) => {
  res.status(200).json({
    items,
    pagination: {
      total,
      page,
      limit,
    },
  });
};

const error = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, message });
};

module.exports = { success, paginated, error };
