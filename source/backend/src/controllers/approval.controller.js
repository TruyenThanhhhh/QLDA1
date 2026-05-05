const Asset = require('../models/Asset');
const { success, error } = require('../utils/response');
const audit = require('../services/audit.service');

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
      message: approvalStatus === 'approved' ? 'Đã duyệt tài sản' : 'Đã từ chối tài sản',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { approveAsset };
