const userService = require('../services/user.service');
const { success, paginated } = require('../utils/response');

const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    paginated(res, result.users, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    success(res, user, 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id);
    success(res, { message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, createUser, updateUser, toggleUserStatus };