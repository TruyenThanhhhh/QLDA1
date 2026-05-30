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

// =====================================
// XUẤT BÁO CÁO (EXCEL & PDF)
// =====================================
const exportExcel = async (req, res, next) => {
  try {
    const buffer = await reportService.exportExcelReport();
    
    // Set headers để trình duyệt hiểu đây là file Excel tải về
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=BaoCao_HaTang.xlsx');
    
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportPDF = async (req, res, next) => {
  try {
    const buffer = await reportService.exportPDFReport();
    
    // Set headers để trình duyệt hiểu đây là file PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=BaoCao_HaTang.pdf');
    
    res.send(buffer);
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

const getPredictiveMaintenance = async (req, res, next) => {
  try {
    const data = await reportService.calculatePredictiveMaintenance();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

// BẮT BUỘC: Phải export đầy đủ các hàm thì route mới nhận diện được
module.exports = { 
  getSummary, 
  getIncidentsByArea, 
  getPriorityList, 
  getOptimalRoute,
  exportExcel,
  exportPDF,
  getCustomRoute,
  getPredictiveMaintenance
};