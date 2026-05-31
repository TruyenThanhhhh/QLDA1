const Asset = require('../models/Asset');
const { success, error } = require('../utils/response');
const audit = require('../services/audit.service');
const maintenanceService = require('../services/maintenance.service');
const { getIo } = require('../config/socket');

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
    
    // ĐÃ SỬA: Đảm bảo bật cờ needsMaintenance = true để hiển thị trên Dashboard Ưu tiên
    if (approvalStatus === 'approved' && asset.status === 'damaged') {
      asset.needsMaintenance = true;
    }

    await asset.save();

    // --- BẮT ĐẦU LOGIC TỰ ĐỘNG HÓA ---
    if (approvalStatus === 'approved' && asset.status === 'damaged') {
      await maintenanceService.create(
        asset._id,
        {
          title: `Xử lý sự cố: ${asset.name}`,
          description: 'Dự án thi công/sửa chữa được tạo tự động sau khi Lãnh đạo phê duyệt báo cáo.',
          severity: 'high',         // Đánh dấu ưu tiên cao
          recordType: 'incident',   // Loại là sự cố
          status: 'open',           // Trạng thái mở, chờ phân công cho Kỹ thuật viên
          performedBy: null         // ĐÃ SỬA: Ép buộc để trống người thực hiện để hiển thị nút "Giao việc"
        },
        req.user // Lãnh đạo là người kích hoạt
      );
    } else if (approvalStatus === 'rejected') {
      // Xóa luôn tài sản rác nếu lãnh đạo từ chối
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

    // Phát sóng cho toàn bộ client biết để load lại dữ liệu
    getIo().emit('new_asset_event', { type: 'UPDATE_ASSET', data: asset });
    getIo().emit('new_maintenance_event', { type: 'CREATE_MAINTENANCE' });

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