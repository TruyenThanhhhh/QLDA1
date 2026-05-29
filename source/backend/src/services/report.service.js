const Asset = require('../models/Asset');
const MaintenanceRecord = require('../models/MaintenanceRecord');

const getSummary = async () => {
  // LỌC CỐT LÕI: Chỉ lấy tài sản ĐÃ DUYỆT (bỏ qua pending và rejected)
  const baseFilter = { isDeleted: { $ne: true }, approvalStatus: 'approved' };

  const [
    totalAssets,
    byType,
    byStatus,
    openIncidents,
    recentMaintenance,
    priorityAssets,
  ] = await Promise.all([
    Asset.countDocuments(baseFilter),
    Asset.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$assetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Asset.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    MaintenanceRecord.countDocuments({
      recordType: 'incident',
      status: { $in: ['open', 'in_progress'] },
    }),
    MaintenanceRecord.find()
      .populate('assetId', 'assetCode name assetType')
      .populate('reportedBy', 'fullName')
      .sort({ recordedAt: -1 })
      .limit(10),
    Asset.find({ status: 'damaged', ...baseFilter })
      .populate('managedAreaId', 'code name')
      .sort({ updatedAt: 1 })
      .limit(20),
  ]);

  return { totalAssets, byType, byStatus, openIncidents, recentMaintenance, priorityAssets };
};

const getIncidentsByArea = async () => {
  const result = await MaintenanceRecord.aggregate([
    { $match: { recordType: 'incident', assetId: { $exists: true } } },
    {
      $lookup: {
        from: 'assets',
        localField: 'assetId',
        foreignField: '_id',
        as: 'asset',
      },
    },
    { $unwind: '$asset' },
    // Chỉ đếm sự cố của những tài sản đã được duyệt
    { $match: { 'asset.approvalStatus': 'approved' } },
    {
      $lookup: {
        from: 'areas',
        localField: 'asset.managedAreaId',
        foreignField: '_id',
        as: 'area',
      },
    },
    { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$area.name', 'Chưa phân khu'] },
        count: { $sum: 1 },
        open: {
          $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress']] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return result;
};

const getPriorityList = async () => {
  // 1. Tìm các dự án/sự cố ĐÃ ĐƯỢC GIAO VIỆC (Có KTV phụ trách)
  const assignedTasks = await MaintenanceRecord.find({
    status: { $in: ['open', 'in_progress'] },
    performedBy: { $exists: true, $ne: null }
  }).populate('performedBy', 'fullName').select('assetId performedBy');

  // Map dữ liệu ai đang làm tài sản nào
  const assignedMap = {};
  assignedTasks.forEach(task => {
    if (task.assetId) {
      assignedMap[task.assetId.toString()] = task.performedBy?.fullName || 'KTV';
    }
  });

  // 2. Lấy TẤT CẢ các tài sản HƯ HỎNG, ĐÃ DUYỆT (Hiển thị tất cả để Lãnh đạo nắm được)
  const assets = await Asset.find({
    status: 'damaged',
    isDeleted: { $ne: true },
    approvalStatus: 'approved'
  })
    .populate('managedAreaId', 'code name')
    .sort({ updatedAt: 1 })
    .limit(20);

  // 3. Đính kèm trạng thái "Đã giao việc" (isAssigned) để báo cho Frontend
  return assets.map(asset => {
    const obj = asset.toObject();
    obj.isAssigned = !!assignedMap[obj._id.toString()];
    obj.assigneeName = assignedMap[obj._id.toString()] || null;
    return obj;
  });
};

module.exports = { getSummary, getIncidentsByArea, getPriorityList };