const MaintenanceRecord = require('../models/MaintenanceRecord');
const Asset = require('../models/Asset');
const User = require('../models/User'); // Bổ sung để lấy danh sách KTV
const audit = require('./audit.service');

const getByAsset = async (assetId, query = {}) => {
  const { page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    MaintenanceRecord.find({ assetId })
      .populate('reportedBy', 'fullName role')
      .populate('performedBy', 'fullName role')
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    MaintenanceRecord.countDocuments({ assetId }),
  ]);

  return { records, total, page: parseInt(page), limit: parseInt(limit) };
};

const getAllTasks = async (query = {}) => {
  const records = await MaintenanceRecord.find({ status: { $ne: 'cancelled' } })
    .populate({
      path: 'assetId',
      select: 'name assetCode managedAreaId',
      populate: { path: 'managedAreaId', select: 'name code' } 
    })
    .populate('performedBy', 'fullName role')
    .sort({ recordedAt: -1 })
    .limit(50); 

  return records.map(record => {
    const obj = record.toObject();
    
    let progress = 0;
    if (obj.status === 'in_progress') progress = 50;
    if (obj.status === 'pending_approval') progress = 90;
    if (obj.status === 'resolved') progress = 100;

    return {
      id: obj._id,
      title: obj.title,
      assetName: obj.assetId?.name || 'Tài sản không xác định',
      area: obj.assetId?.managedAreaId?.name || 'Chưa phân khu',
      status: obj.status,
      progress: progress,
      assignee: obj.performedBy?.fullName || 'Chưa phân công',
      startDate: obj.recordedAt ? new Date(obj.recordedAt).toLocaleDateString('vi-VN') : 'N/A',
      notes: obj.notes,
      photos: obj.photos
    };
  });
};

const create = async (assetId, data, user) => {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw Object.assign(new Error('Không tìm thấy tài sản'), { statusCode: 404 });
  }

  if (user.role === 'user') {
    data.recordType = 'incident';
  } else if (user.role === 'technician') {
    // KTV tự tạo phiếu thì mặc định tự nhận việc (nếu chưa gán cho ai)
    if (data.performedBy === undefined) {
      data.performedBy = user._id;
    }
  }
  // ĐÃ SỬA: Xóa bỏ việc tự động lấy ID của Admin gán vào performedBy.
  // Khi Lãnh đạo / Admin tạo phiếu từ controller, data.performedBy sẽ truyền vào null.
  
  if (data.performedBy === null) {
      data.performedBy = undefined; // Ép về undefined để DB hiểu là chưa có ai phụ trách
  }

  const record = new MaintenanceRecord({
    ...data,
    assetId,
    reportedBy: user._id,
  });
  await record.save();

  // ĐÃ SỬA: Đồng bộ luôn trạng thái needsMaintenance = true cho Asset
  if (data.recordType === 'incident' && ['high', 'critical'].includes(data.severity)) {
    await Asset.findByIdAndUpdate(assetId, { 
      status: 'damaged',
      needsMaintenance: true 
    });
  }

  audit.log({
    action: 'create',
    entityType: 'MaintenanceRecord',
    entityId: record._id,
    performedBy: user._id,
    after: record.toObject(),
    details: `${data.recordType === 'incident' ? 'Báo sự cố' : 'Tạo bảo trì'}: ${data.title}`,
  });

  return record;
};

const update = async (id, data, user) => {
  const before = await MaintenanceRecord.findById(id);
  if (!before) {
    throw Object.assign(new Error('Không tìm thấy bản ghi bảo trì'), { statusCode: 404 });
  }

  const record = await MaintenanceRecord.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).populate('reportedBy', 'fullName role').populate('performedBy', 'fullName role');

  if (data.status === 'resolved' && !record.resolvedAt) {
    record.resolvedAt = new Date();
    await record.save();
  }

  audit.log({
    action: 'update',
    entityType: 'MaintenanceRecord',
    entityId: record._id,
    performedBy: user?._id,
    before: before.toObject(),
    after: record.toObject(),
    details: `Cập nhật ${record.recordType === 'incident' ? 'sự cố' : 'bảo trì'}: ${record.title}`,
  });

  return record;
};

// 1. Lấy danh sách nhân viên kỹ thuật
const getTechnicians = async () => {
  return await User.find({ role: 'technician', isActive: true }).select('_id fullName username');
};

// 2. Giao việc dựa trên ID của tài sản (Tìm task đang mở và gán KTV vào)
const assignTaskByAssetId = async (assetId, technicianId, user) => {
  const record = await MaintenanceRecord.findOne({
    assetId: assetId,
    status: { $in: ['open', 'in_progress'] } 
  });

  if (!record) {
    throw Object.assign(new Error('Tài sản này không có phiếu sự cố nào đang chờ phân công hoặc xử lý. Vui lòng kiểm tra lại!'), { statusCode: 404 });
  }

  const tech = await User.findById(technicianId);
  if (!tech || tech.role !== 'technician') {
    throw Object.assign(new Error('Kỹ thuật viên không hợp lệ'), { statusCode: 400 });
  }

  const before = record.toObject();

  // Update DB trực tiếp để tránh Hook ngầm tự động đổi sang in_progress
  const updatedRecord = await MaintenanceRecord.findOneAndUpdate(
    { _id: record._id },
    { 
      $set: { 
        performedBy: technicianId, 
        status: 'open', 
        updatedBy: user._id 
      } 
    },
    { new: true }
  );

  audit.log({
    action: 'assign',
    entityType: 'MaintenanceRecord',
    entityId: updatedRecord._id,
    performedBy: user._id,
    before: before,
    after: updatedRecord.toObject(),
    details: `Giao việc xử lý sự cố cho KTV: ${tech.fullName}`,
  });

  return updatedRecord;
};

// 3. Nghiệm thu công việc (Lãnh đạo phê duyệt/từ chối hoàn thành sửa chữa)
const acceptTask = async (id, approvalStatus, leaderNotes, user) => {
  if (!['approved', 'rejected'].includes(approvalStatus)) {
    throw Object.assign(new Error('Trạng thái nghiệm thu không hợp lệ (approved | rejected)'), { statusCode: 400 });
  }

  const record = await MaintenanceRecord.findById(id);
  if (!record) {
    throw Object.assign(new Error('Không tìm thấy bản ghi bảo trì'), { statusCode: 404 });
  }

  const before = record.toObject();

  if (approvalStatus === 'approved') {
    record.status = 'resolved';
    record.resolvedAt = new Date();
    if (leaderNotes) {
      record.notes = leaderNotes;
    }

    await Asset.findByIdAndUpdate(record.assetId, {
      $set: {
        status: 'good',
        needsMaintenance: false,
        riskScore: 0
      }
    });
  } else if (approvalStatus === 'rejected') {
    record.status = 'in_progress';
    if (leaderNotes) {
      record.notes = `[Lãnh đạo từ chối nghiệm thu]: ${leaderNotes}`;
    }
  }

  await record.save();

  audit.log({
    action: 'update',
    entityType: 'MaintenanceRecord',
    entityId: record._id,
    performedBy: user._id,
    before,
    after: record.toObject(),
    details: `Nghiệm thu công việc: Lãnh đạo ${approvalStatus === 'approved' ? 'duyệt' : 'từ chối'}`,
  });

  return record;
};

module.exports = { 
  getByAsset, 
  getAllTasks, 
  create, 
  update, 
  getTechnicians, 
  assignTaskByAssetId,
  acceptTask
};