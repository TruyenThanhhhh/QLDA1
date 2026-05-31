const maintenanceService = require('../services/maintenance.service');
const MaintenanceRecord = require('../models/MaintenanceRecord'); 
const { success, paginated } = require('../utils/response');
const { getIo } = require('../config/socket');
const PDFDocument = require('pdfkit');

const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const getByAsset = async (req, res, next) => {
  try {
    const result = await maintenanceService.getByAsset(req.params.id, req.query);
    paginated(res, result.records, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await maintenanceService.getAllTasks(req.query);
    success(res, tasks);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const record = await maintenanceService.create(req.params.id, req.body, req.user);
    getIo().emit('new_maintenance_event', { type: 'CREATE_MAINTENANCE', data: record });
    success(res, { id: record.id, message: 'Record created successfully' }, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const record = await maintenanceService.update(req.params.id, req.body, req.user);
    getIo().emit('new_maintenance_event', { type: 'UPDATE_MAINTENANCE', data: record });
    success(res, { id: record.id, message: 'Record updated successfully' });
  } catch (err) {
    next(err);
  }
};

const exportTasksPDF = async (req, res, next) => {
  try {
    const tasks = await maintenanceService.getAllTasks(req.query);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-disposition', 'attachment; filename="DanhSachThiCong.pdf"');
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(18).text(removeAccents('BÁO CÁO DANH SÁCH THI CÔNG / SỰ CỐ'), { align: 'center' });
    doc.moveDown(2);

    if (tasks.length === 0) {
      doc.fontSize(12).text(removeAccents('Hiện tại không có dự án thi công nào.'), { align: 'center' });
    } else {
      tasks.forEach((task, index) => {
        doc.fontSize(12).text(`${index + 1}. ${removeAccents(task.title)}`);
        doc.fontSize(10).text(`    - Tai san: ${removeAccents(task.assetName)}`);
        doc.text(`    - Khu vuc: ${removeAccents(task.area)}`);
        doc.text(`    - Nguoi phu trach: ${removeAccents(task.assignee)}`);
        doc.text(`    - Tien do: ${task.progress}%`);
        doc.text(`    - Trang thai: ${removeAccents(task.status)}`);
        doc.moveDown(1);
      });
    }
    doc.end();
  } catch (err) {
    next(err);
  }
};

const uploadPhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có ảnh nào được tải lên' });
    }

    const newPhotos = req.files.map(file => ({
      path: file.path,
      filename: file.filename
    }));

    const record = await MaintenanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });
    }

    // Đẩy thêm ảnh mới vào mảng photos
    if (!record.photos) record.photos = [];
    record.photos.push(...newPhotos);
    await record.save();

    getIo().emit('new_maintenance_event', { type: 'UPDATE_MAINTENANCE', data: record });
    success(res, { id: record._id, message: 'Tải ảnh thành công', photos: record.photos });
  } catch (err) {
    console.error("=> Lỗi hệ thống khi upload ảnh:", err);
    next(err);
  }
};

const getTechnicians = async (req, res, next) => {
  try {
    const techs = await maintenanceService.getTechnicians();
    success(res, techs);
  } catch(err) { 
    next(err); 
  }
};

const assignByAsset = async (req, res, next) => {
  try {
    const { technicianId } = req.body;
    const record = await maintenanceService.assignTaskByAssetId(req.params.assetId, technicianId, req.user);
    getIo().emit('new_maintenance_event', { type: 'UPDATE_MAINTENANCE', data: record });
    success(res, { id: record.id, message: 'Đã giao việc thành công' });
  } catch(err) { 
    next(err); 
  }
};

const acceptTask = async (req, res, next) => {
  try {
    const { approvalStatus, notes } = req.body;
    const record = await maintenanceService.acceptTask(req.params.id, approvalStatus, notes, req.user);
    getIo().emit('new_maintenance_event', { type: 'UPDATE_MAINTENANCE', data: record });
    success(res, {
      id: record.id,
      status: record.status,
      message: approvalStatus === 'approved' ? 'Đã nghiệm thu hoàn thành công việc' : 'Đã từ chối nghiệm thu, yêu cầu thi công lại'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getByAsset, getAllTasks, create, update, exportTasksPDF, uploadPhotos, getTechnicians, assignByAsset, acceptTask };