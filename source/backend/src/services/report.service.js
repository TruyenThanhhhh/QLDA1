const Asset = require('../models/Asset');
const MaintenanceRecord = require('../models/MaintenanceRecord');

const getSummary = async () => {
  const [
    totalAssets,
    byType,
    byStatus,
    openIncidents,
    recentMaintenance,
    priorityAssets,
    costs,
  ] = await Promise.all([
    Asset.countDocuments({ isDeleted: { $ne: true } }),
    Asset.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$assetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Asset.aggregate([
      { $match: { isDeleted: { $ne: true } } },
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
    Asset.find({ status: 'damaged', isDeleted: { $ne: true } })
      .populate('managedAreaId', 'code name')
      .sort({ updatedAt: 1 })
      .limit(20),
    MaintenanceRecord.aggregate([
      {
        $group: {
          _id: null,
          totalEstimate: { $sum: '$costEstimate' },
          totalActual: { $sum: '$costActual' },
        },
      },
    ]),
  ]);

  const totalEstimate = costs[0]?.totalEstimate || 0;
  const totalActual = costs[0]?.totalActual || 0;

  return { 
    totalAssets, 
    byType, 
    byStatus, 
    openIncidents, 
    recentMaintenance, 
    priorityAssets, 
    totalEstimate, 
    totalActual 
  };
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
  const assets = await Asset.find({
    status: 'damaged',
    isDeleted: { $ne: true },
  })
    .populate('managedAreaId', 'code name')
    .sort({ updatedAt: 1 })
    .limit(20);

  return assets;
};

module.exports = { getSummary, getIncidentsByArea, getPriorityList };
