const Asset = require('../models/Asset');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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

// ==========================================
// CÁC HÀM MỚI: XỬ LÝ XUẤT EXCEL & PDF
// ==========================================

const exportExcelReport = async () => {
  // 1. Lấy dữ liệu tài sản hợp lệ
  const assets = await Asset.find({ isDeleted: { $ne: true }, approvalStatus: 'approved' })
    .populate('managedAreaId', 'name')
    .sort({ createdAt: -1 });

  // 2. Khởi tạo Workbook và Worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Danh_Sach_Tai_San');

  // 3. Định nghĩa các cột (Headers)
  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Mã tài sản', key: 'assetCode', width: 15 },
    { header: 'Tên tài sản', key: 'name', width: 35 },
    { header: 'Phân loại', key: 'assetType', width: 20 },
    { header: 'Khu vực quản lý', key: 'area', width: 25 },
    { header: 'Tình trạng', key: 'status', width: 15 },
    { header: 'Ngày ghi nhận', key: 'date', width: 20 },
  ];

  // 4. Style cho dòng Header (In đậm, nền xám nhạt)
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Dữ liệu map cho đẹp
  const typeMap = { road: 'Đường bộ', sign: 'Biển báo', traffic_light: 'Đèn tín hiệu', manhole: 'Nắp cống', lamp_post: 'Cột đèn', sidewalk: 'Vỉa hè' };
  const statusMap = { good: 'Tốt', fair: 'Trung bình', damaged: 'Hư hỏng (Cần bảo trì)' };

  // 5. Thêm dữ liệu vào các dòng
  assets.forEach((asset, index) => {
    worksheet.addRow({
      stt: index + 1,
      assetCode: asset.assetCode,
      name: asset.name,
      assetType: typeMap[asset.assetType] || asset.assetType,
      area: asset.managedAreaId?.name || 'Chưa phân khu',
      status: statusMap[asset.status] || asset.status,
      date: asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('vi-VN') : '',
    });
  });

  // 6. Trả về dưới dạng Buffer để Controller gửi xuống Client
  return await workbook.xlsx.writeBuffer();
};

// Hàm bỏ dấu tiếng Việt để PDFKit không bị lỗi Font
const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const exportPDFReport = async () => {
  const assets = await Asset.find({ isDeleted: { $ne: true }, approvalStatus: 'approved' })
    .populate('managedAreaId', 'name')
    .sort({ createdAt: -1 });

  return new Promise((resolve, reject) => {
    // Khởi tạo tài liệu PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    // Lắng nghe sự kiện ghi dữ liệu
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Bắt đầu vẽ nội dung PDF
    doc.fontSize(20).text(removeAccents('BAO CAO THONG KE HA TANG DO THI'), { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).text(`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
    doc.moveDown(2);

    const typeMap = { road: 'Duong bo', sign: 'Bien bao', traffic_light: 'Den tin hieu', manhole: 'Nap cong', lamp_post: 'Cot den', sidewalk: 'Vi he' };
    const statusMap = { good: 'Tot', fair: 'Trung binh', damaged: 'Hu hong (Can bao tri)' };

    if (assets.length === 0) {
      doc.fontSize(12).text(removeAccents('Hien tai khong co tai san nao.'), { align: 'center' });
    } else {
      assets.forEach((asset, index) => {
        doc.fontSize(12).text(`${index + 1}. ${removeAccents(asset.name)}`, { underline: true });
        doc.fontSize(11).text(`   - Ma tai san: ${asset.assetCode}`);
        doc.text(`   - Phan loai: ${removeAccents(typeMap[asset.assetType] || asset.assetType)}`);
        doc.text(`   - Khu vuc: ${removeAccents(asset.managedAreaId?.name || 'Chua phan khu')}`);
        doc.text(`   - Tinh trang: ${removeAccents(statusMap[asset.status] || asset.status)}`);
        doc.moveDown(1);
      });
    }

    // Kết thúc và đóng file
    doc.end();
  });
};

const calculatePredictiveMaintenance = async () => {
  const assets = await Asset.find({ isDeleted: false, approvalStatus: 'approved' });
  const results = [];
  
  for (const asset of assets) {
    // 1. Base Score based on status
    let baseScore = 10;
    if (asset.status === 'fair') baseScore = 45;
    if (asset.status === 'damaged') baseScore = 85;

    // 2. Age Factor (max 20 pts)
    const ageInYears = (new Date().getFullYear()) - (asset.createdAt ? new Date(asset.createdAt).getFullYear() : new Date().getFullYear());
    const ageScore = Math.min(ageInYears * 5, 20);

    // 3. Asset Type wear rate (max 10 pts)
    let typeScore = 2;
    if (asset.assetType === 'road') typeScore = 10;
    else if (asset.assetType === 'sidewalk') typeScore = 8;
    else if (['traffic_light', 'lamp_post'].includes(asset.assetType)) typeScore = 5;

    // 4. Past repair history count (max 30 pts)
    const repairCount = await MaintenanceRecord.countDocuments({ assetId: asset._id });
    const historyScore = Math.min(repairCount * 10, 30);

    // 5. Public upvotes/sentiments (max 15 pts)
    const upvotesCount = asset.upvotes ? asset.upvotes.length : 0;
    const sentimentScore = Math.min(upvotesCount * 3, 15);

    // Total Risk Score (clamped 0-100)
    let riskScore = baseScore + ageScore + typeScore + historyScore + sentimentScore;
    riskScore = Math.max(0, Math.min(Math.round(riskScore), 100));

    const needsMaintenance = riskScore >= 60;

    // Save to DB
    asset.riskScore = riskScore;
    asset.needsMaintenance = needsMaintenance;
    await asset.save();

    results.push(asset);
  }

  // Sort descending and return top 15
  results.sort((a, b) => b.riskScore - a.riskScore);
  return results.slice(0, 15);
};

module.exports = {
  getSummary,
  getIncidentsByArea,
  getPriorityList,
  exportExcelReport,
  exportPDFReport,
  calculatePredictiveMaintenance
};