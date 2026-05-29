const MaintenanceRecord = require('../models/MaintenanceRecord');
const Asset = require('../models/Asset');
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

// --- THÊM MỚI: Lấy danh sách tất cả các task thi công cho Dashboard Lãnh đạo ---
const getAllTasks = async (query = {}) => {
  // Bỏ qua các task đã bị hủy
  const records = await MaintenanceRecord.find({ status: { $ne: 'cancelled' } })
    .populate({
      path: 'assetId',
      select: 'name assetCode managedAreaId',
      populate: { path: 'managedAreaId', select: 'name code' } // Lấy tên khu vực
    })
    .populate('performedBy', 'fullName role')
    .sort({ recordedAt: -1 })
    .limit(50); // Lấy 50 dự án mới nhất

  // Format lại dữ liệu cho phù hợp với table của Dashboard Thi công
  return records.map(record => {
    const obj = record.toObject();
    
    // Tính toán giả lập phần trăm tiến độ dựa vào trạng thái
    let progress = 0;
    if (obj.status === 'in_progress') progress = 50;
    if (obj.status === 'resolved') progress = 100;

    return {
      id: obj._id,
      title: obj.title,
      assetName: obj.assetId?.name || 'Tài sản không xác định',
      area: obj.assetId?.managedAreaId?.name || 'Chưa phân khu',
      status: obj.status,
      progress: progress,
      assignee: obj.performedBy?.fullName || 'Chưa phân công',
      startDate: obj.recordedAt ? new Date(obj.recordedAt).toLocaleDateString('vi-VN') : 'N/A'
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
  } else if (user.role === 'technician' || user.role === 'admin') {
    data.performedBy = user._id;
  }

  const record = new MaintenanceRecord({
    ...data,
    assetId,
    reportedBy: user._id,
  });
  await record.save();

  if (data.recordType === 'incident' && ['high', 'critical'].includes(data.severity)) {
    await Asset.findByIdAndUpdate(assetId, { status: 'damaged' });
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

module.exports = { getByAsset, getAllTasks, create, update };