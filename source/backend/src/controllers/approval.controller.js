const Asset = require('../models/Asset');
const { success, error } = require('../utils/response');
const audit = require('../services/audit.service');
// --- THÊM MỚI: Import service bảo trì để tự động tạo công việc ---
const maintenanceService = require('../services/maintenance.service');

const approveAsset = async (req, res, next) => {
  try {
    const { approvalStatus } = req.body;

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return error(res, 'Trạng thái duyệt không hợp lệ (approved | rejected)', 400);
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset || asset.isDeleted) {
      return error(res, 'Không tìm thấy tài sản', 404);
    }

    const oldStatus = asset.approvalStatus;
    asset.approvalStatus = approvalStatus;
    await asset.save();

    // --- BẮT ĐẦU LOGIC TỰ ĐỘNG HÓA ---
    // Nếu Lãnh đạo duyệt một báo cáo có tình trạng hư hỏng -> Tự động tạo Task bảo trì
    if (approvalStatus === 'approved' && asset.status === 'damaged') {
      await maintenanceService.create(
        asset._id,
        {
          title: `Xử lý sự cố: ${asset.name}`,
          description: 'Dự án thi công/sửa chữa được tạo tự động sau khi Lãnh đạo phê duyệt báo cáo.',
          severity: 'high',         // Đánh dấu ưu tiên cao
          recordType: 'incident',   // Loại là sự cố
          status: 'open'            // Trạng thái mở, chờ phân công cho Kỹ thuật viên
        },
        req.user // Lãnh đạo là người kích hoạt hành động này
      );
    } else if (approvalStatus === 'rejected') {
      // Nếu từ chối, có thể cân nhắc xóa hoặc đánh dấu để không hiện lại
      // Ở đây ta có thể xóa luôn asset nếu nó là report từ người dân
       if (asset.source === 'user_report' || asset.source === 'manual') {
          asset.isDeleted = true;
          await asset.save();
       }
    }
    // --- KẾT THÚC LOGIC TỰ ĐỘNG HÓA ---

    audit.log({
      action: 'approval',
      entityType: 'Asset',
      entityId: asset._id,
      performedBy: req.user?._id,
      before: { approvalStatus: oldStatus },
      after: { approvalStatus },
      details: `Duyệt tài sản ${asset.assetCode}: ${oldStatus} → ${approvalStatus}`,
    });

    success(res, {
      id: asset.id,
      approvalStatus: asset.approvalStatus,
      message: approvalStatus === 'approved' ? 'Đã duyệt tài sản và tạo dự án thi công' : 'Đã từ chối tài sản',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { approveAsset };