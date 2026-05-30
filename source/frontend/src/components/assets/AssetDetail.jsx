import { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import MaintenanceHistory from '../maintenance/MaintenanceHistory';
import MaintenanceForm from '../maintenance/MaintenanceForm';

const typeLabels = {
  road: 'Đường', sign: 'Biển báo',
  traffic_light: 'Đèn tín hiệu', manhole: 'Nắp cống', lamp_post: 'Cột đèn',
  sidewalk: 'Vỉa hè', tree: 'Cây xanh', bus_station: 'Trạm xe buýt', parking: 'Bãi đỗ xe'
};
const statusLabels = { good: 'Tốt', fair: 'Trung bình', damaged: 'Hư hỏng' };
const statusStyles = {
  good: 'status-good', fair: 'status-fair', damaged: 'status-damaged',
};
const typeIcons = {
  road: '🛣️', sign: '🪧',
  traffic_light: '🚦', manhole: '🕳️', lamp_post: '💡', sidewalk: '🚶', tree: '🌳',
  bus_station: '🚌', parking: '🅿️'
};
const approvalLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};
const approvalStyles = {
  pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-surface-400 mb-1">{label}</span>
      <p className="text-surface-200 text-sm">{value}</p>
    </div>
  );
}

export default function AssetDetail({ asset, onClose, onEdit, onRefresh }) {
  const { user, hasRole } = useAuth();
  const [tab, setTab] = useState('info');
  const [maintenance, setMaintenance] = useState([]);
  const [loadingMaint, setLoadingMaint] = useState(false);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const photoInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [upvoting, setUpvoting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const targetId = asset?.id || asset?._id;
  const isOsm = asset?.assetType === 'osm_location';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handlePhotoUpload = async (e) => {
    if (isOsm) return showToast('Không thể tải ảnh cho địa điểm bản đồ!');
    if (!targetId) return showToast('Tài sản chưa hợp lệ!');

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('photos', f));
      await client.post(`/assets/${targetId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onRefresh();
      showToast('Tải ảnh lên thành công!');
    } catch (err) {
      showToast('Upload thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (targetId && tab === 'maintenance' && !isOsm) {
      fetchMaintenance();
    }
  }, [targetId, tab, isOsm]);

  const fetchMaintenance = async () => {
    try {
      setLoadingMaint(true);
      const res = await client.get(`/assets/${targetId}/maintenance`);
      setMaintenance(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch maintenance:', err);
    } finally {
      setLoadingMaint(false);
    }
  };

  const handleDelete = async () => {
    if (isOsm) return;
    if (!window.confirm('Bạn có chắc muốn xoá tài sản này?')) return;
    try {
      setDeleting(true);
      await client.delete(`/assets/${targetId}`);
      onClose();
      onRefresh();
    } catch (err) {
      showToast('Xoá thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleApproval = async (status) => {
    if (isOsm) return;
    try {
      setApproving(true);
      await client.patch(`/assets/${targetId}/approval`, { approvalStatus: status });
      onRefresh();
      showToast('Cập nhật phê duyệt thành công!');
    } catch (err) {
      showToast('Duyệt thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setApproving(false);
    }
  };

  const handleMaintenanceSaved = () => {
    setShowMaintForm(false);
    fetchMaintenance();
    showToast('Đã tạo báo cáo sự cố thành công!');
  };

  const handleUpvote = async () => {
    try {
      setUpvoting(true);
      await client.post(`/assets/${targetId}/upvote`);
      onRefresh();
    } catch (err) {
      showToast('Bình chọn thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpvoting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      await client.post(`/assets/${targetId}/comment`, { text: commentText });
      setCommentText('');
      onRefresh();
    } catch (err) {
      showToast('Gửi bình luận thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!asset) return null;

  const photos = asset.photos || [];
  const approvalStatus = asset.approvalStatus || 'approved';
  const canApprove = hasRole('admin') || hasRole('technician');

  return (
    <div className="h-full flex flex-col relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] w-max max-w-[90%] animate-[slideIn_0.3s_ease-out]">
          <div className="bg-emerald-600/90 backdrop-blur-md text-white px-5 py-2.5 rounded-xl shadow-lg border border-emerald-500/50 flex items-center gap-2">
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-surface-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{typeIcons[asset.assetType] || '📍'}</span>
            <h3 className="text-lg font-semibold text-white truncate">{asset.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-surface-500 hover:text-white hover:bg-surface-700/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-surface-500">{asset.assetCode}</span>
          {asset.status !== 'none' && (
            <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusStyles[asset.status]}`}>
              {statusLabels[asset.status]}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-700/50 flex-shrink-0">
        {['info', 'photos', 'maintenance'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {t === 'info' ? 'Thông tin' : t === 'photos' ? `Ảnh (${photos.length})` : 'Bảo trì'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {tab === 'info' ? (
          <div className="space-y-4 animate-fade-in">
            <InfoRow label="Loại tài sản" value={typeLabels[asset.assetType] || 'Không xác định'} />
            {!isOsm && <InfoRow label="Vật liệu" value={asset.material || '—'} />}
            {!isOsm && <InfoRow label="Kích thước" value={asset.dimensions ? `${asset.dimensions.width || 0}m x ${asset.dimensions.length || asset.dimensions.height || 0}m (${asset.dimensions.unit || 'm'})` : '—'} />}
            {!isOsm && <InfoRow label="Khu vực" value={asset.managedAreaId?.name || '—'} />}
            
            {asset.planningInfo && <InfoRow label="Quy hoạch" value={asset.planningInfo} />}
            {asset.fullAddress && <InfoRow label="Địa chỉ" value={asset.fullAddress} />}
            
            {!isOsm && <InfoRow label="Cập nhật" value={asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString('vi-VN') : '—'} />}

            {/* Coordinates */}
            <div>
              <span className="block text-xs font-semibold text-surface-400 mb-1">Toạ độ</span>
              <div className="bg-surface-800/50 rounded-lg p-2.5 font-mono text-xs text-surface-400">
                {asset.geometry?.type === 'Point'
                  ? `[${asset.geometry.coordinates[0].toFixed(6)}, ${asset.geometry.coordinates[1].toFixed(6)}]`
                  : `${asset.geometry?.coordinates?.length || 0} điểm`
                }
              </div>
            </div>

            {/* Upvote & Comments */}
            {!isOsm && (
              <div className="border-t border-surface-700/50 pt-4 mt-4 space-y-4">
                <div className="flex items-center justify-between bg-surface-800/30 p-3 rounded-xl border border-surface-700/30">
                  <div className="flex flex-col">
                    <span className="text-xs text-surface-400">Bình chọn sự cố</span>
                    <span className="text-sm text-surface-200 font-semibold">{asset.upvotes?.length || 0} lượt thích</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpvote}
                    disabled={upvoting}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      asset.upvotes?.includes(user?._id || user?.id)
                        ? 'bg-primary-600/20 text-primary-400 border-primary-500/30'
                        : 'bg-surface-700 hover:bg-surface-600 text-surface-200 border-surface-600/50'
                    }`}
                  >
                    {asset.upvotes?.includes(user?._id || user?.id) ? '❤️ Đã thích' : '🤍 Thích'}
                  </button>
                </div>

                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-surface-400">Tương tác hiện trường ({asset.comments?.length || 0})</span>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(!asset.comments || asset.comments.length === 0) ? (
                      <p className="text-xs text-surface-500 italic py-2">Chưa có bình luận thảo luận nào.</p>
                    ) : (
                      asset.comments.map((comment, index) => (
                        <div key={index} className="bg-surface-800/40 p-2.5 rounded-lg border border-surface-700/20 text-xs">
                          <div className="flex justify-between items-center mb-1 text-surface-400 font-medium">
                            <span>{comment.fullName}</span>
                            <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="text-surface-200">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Viết phản hồi / bình luận..."
                      className="input-field py-1.5 px-3 text-xs flex-1 bg-surface-800/50 border-surface-700"
                      disabled={submittingComment}
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="btn-primary py-1.5 px-3 text-xs flex-shrink-0"
                    >
                      Gửi
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Approval actions */}
            {canApprove && approvalStatus === 'pending' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mt-4">
                <p className="text-sm text-amber-400 mb-2">Tài sản đang chờ duyệt</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval('approved')}
                    disabled={approving}
                    className="btn-primary flex-1 text-sm disabled:opacity-50"
                  >
                    {approving ? '...' : '✓ Duyệt'}
                  </button>
                  <button
                    onClick={() => handleApproval('rejected')}
                    disabled={approving}
                    className="btn-danger text-sm px-4 disabled:opacity-50"
                  >
                    {approving ? '...' : '✗ Từ chối'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {hasRole('admin') && !isOsm && (
              <div className="flex gap-2 pt-4 border-t border-surface-700/50 mt-4">
                <button onClick={() => onEdit(asset)} className="flex-1 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-lg text-sm transition-colors">
                  Chỉnh sửa
                </button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm transition-colors">
                  {deleting ? '...' : 'Xoá'}
                </button>
              </div>
            )}
          </div>
        ) : tab === 'photos' ? (
          <div className="animate-fade-in flex flex-col h-full">
            {photos.length === 0 ? (
              <div className="text-center py-8 text-surface-500 text-sm">
                Chưa có ảnh hiện trường
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {photos.map((photo, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-surface-700/50">
                    <img
                      src={photo.path}
                      alt={photo.originalName}
                      className="w-full h-48 object-cover bg-surface-800"
                    />
                    <div className="p-2 bg-surface-800/50">
                      <p className="text-xs text-surface-400 truncate">{photo.originalName}</p>
                      <p className="text-[10px] text-surface-600">
                        {(photo.size / 1024 / 1024).toFixed(2)} MB • {new Date(photo.uploadedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!isOsm && (
              <div className="mt-4 pt-4 border-t border-surface-700/50 flex-shrink-0">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-primary-600 text-white rounded-lg text-sm font-medium py-2.5 transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20 hover:bg-primary-500"
                >
                  {uploading ? 'Đang tải lên...' : '+ Thêm ảnh'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in relative pb-8">
            {!isOsm ? (
              <>
                <button
                  onClick={() => setShowMaintForm(!showMaintForm)}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium py-2.5 mb-4 transition-colors"
                >
                  {showMaintForm ? 'Hủy' : (hasRole('user') ? '🚨 Báo cáo sự cố' : '+ Tạo bản ghi mới')}
                </button>

                {showMaintForm && (
                  <MaintenanceForm
                    assetId={targetId}
                    onSaved={handleMaintenanceSaved}
                    onCancel={() => setShowMaintForm(false)}
                  />
                )}

                <MaintenanceHistory records={maintenance} loading={loadingMaint} onRefresh={fetchMaintenance} />
              </>
            ) : (
              <div className="text-center py-8 text-surface-500 text-sm border-2 border-dashed border-surface-700 rounded-xl">
                Không thể tạo bảo trì cho địa điểm từ bản đồ.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}