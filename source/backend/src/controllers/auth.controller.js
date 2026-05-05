const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return error(res, 'Vui lòng nhập tên đăng nhập và mật khẩu', 400);
    }
    const result = await authService.login(username, password);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  success(res, req.user);
};

const getUsers = async (req, res, next) => {
  try {
    const users = await authService.getAllUsers();
    success(res, users);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await authService.createUser(req.body);
    success(res, user, 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await authService.updateUser(req.params.id, req.body, req.user);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { username, password, fullName } = req.body;
    if (!username || !password || !fullName) {
      return error(res, 'Vui lòng nhập đầy đủ thông tin đăng ký', 400);
    }
    await authService.createUser({
      username,
      password,
      fullName,
      role: 'user',
    });
    // Auto login after registration
    const result = await authService.login(username, password);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, getMe, getUsers, createUser, updateUser };
