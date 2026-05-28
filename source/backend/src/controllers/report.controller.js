const reportService = require('../services/report.service');
const routingService = require('../services/routing.service');
const { success } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const data = await reportService.getSummary();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getIncidentsByArea = async (req, res, next) => {
  try {
    const data = await reportService.getIncidentsByArea();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getPriorityList = async (req, res, next) => {
  try {
    const data = await reportService.getPriorityList();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getOptimalRoute = async (req, res, next) => {
  try {
    const data = await routingService.optimizeRoute();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getCustomRoute = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const data = await routingService.getCustomRoute(start, end);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getIncidentsByArea, getPriorityList, getOptimalRoute, getCustomRoute };
