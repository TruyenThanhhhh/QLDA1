import { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import MaintenanceHistory from '../maintenance/MaintenanceHistory';
import MaintenanceForm from '../maintenance/MaintenanceForm';

const typeLabels = {
  road: 'Đường', sign: 'Biển báo',
  traffic_light: 'Đèn tín hiệu', manhole: 'Nắp cống', lamp_post: 'Cột đèn',
  sidewalk: 'Vỉa hè',
};
const statusLabels = { good: 'Tốt', fair: 'Trung bình', damaged: 'Hư hỏng' };
const statusStyles = {
  good: 'status-good', fair: 'status-fair', damaged: 'status-damaged',
};
const typeIcons = {
  road: '🛣️', sign: '🪧',
  traffic_light: '🚦', manhole: '🕳️', lamp_post: '💡', sidewalk: '🚶',
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

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('photos', f));
      await client.post(`/assets/${asset.id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onRefresh();
    } catch (err) {
      alert('Upload thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (asset?.id && tab === 'maintenance') {
      fetchMaintenance();
    }
  }, [asset?.id, tab]);

  const fetchMaintenance = async () => {
    try {
      setLoadingMaint(true);
      const res = await client.get(`/assets/${asset.id}/maintenance`);
      setMaintenance(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch maintenance:', err);
    } finally {
      setLoadingMaint(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xoá tài sản này?')) return;
    try {
      setDeleting(true);
      await client.delete(`/assets/${asset.id}`);
      onClose();
      onRefresh();
    } catch (err) {
      alert('Xoá thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleApproval = async (status) => {
    try {
      setApproving(true);
      await client.patch(`/assets/${asset.id}/approval`, { approvalStatus: status });
      onRefresh();
    } catch (err) {
      alert('Duyệt thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setApproving(false);
    }
  };

  const handleMaintenanceSaved = () => {
    setShowMaintForm(false);
    fetchMaintenance();
    setToastMessage('Đã tạo báo cáo sự cố thành công!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (!asset) return null;

  const photos = asset.photos || [];
  const approvalStatus = asset.approvalStatus || 'approved';
  const canApprove = hasRole('admin') || hasRole('technician');

  return (
    <div className="h-full flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] w-max max-w-[90%] animate-fade-in">
          <div className="bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-400/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-surface-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{typeIcons[asset.assetType]}</span>
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
          <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusStyles[asset.status]}`}>
            {statusLabels[asset.status]}
          </span>
          {approvalStatus !== 'approved' && (
            <span className={`text-xs px-2 py-0.5 rounded-lg ${approvalStyles[approvalStatus]}`}>
              {approvalLabels[approvalStatus]}
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
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'info' ? (
          <div className="space-y-4 animate-fade-in">
            <InfoRow label="Loại tài sản" value={typeLabels[asset.assetType]} />
            <InfoRow label="Vật liệu" value={asset.material || '—'} />
            <InfoRow 
              label="Kích thước" 
              value={asset.dimensions ? `${asset.dimensions.width || 0}m x ${asset.dimensions.length || asset.dimensions.height || 0}m (${asset.dimensions.unit || 'm'})` : '—'} 
            />
            <InfoRow label="Khu vực" value={asset.managedAreaId?.name || '—'} />
            <InfoRow label="Nguồn dữ liệu" value={asset.source === 'manual' ? 'Nhập tay' : asset.source === 'imported_osm' ? 'Import OSM' : 'Demo'} />
            <InfoRow label="Phương thức thu thập" value={asset.captureMethod === 'manual' ? 'Thực địa' : asset.captureMethod === 'gps' ? 'GPS' : asset.captureMethod === 'imported_osm' ? 'OSM' : 'Demo'} />
            <InfoRow label="Kiểm tra gần nhất" value={asset.lastInspectionAt ? new Date(asset.lastInspectionAt).toLocaleDateString('vi-VN') : '—'} />
            <InfoRow label="Ngày thu thập" value={asset.capturedAt ? new Date(asset.capturedAt).toLocaleDateString('vi-VN') : '—'} />
            <InfoRow label="Cập nhật" value={new Date(asset.updatedAt).toLocaleDateString('vi-VN')} />

            {/* Coordinates */}
            <div>
              <span className="label-text">Toạ độ</span>
              <div className="bg-surface-800/50 rounded-lg p-2.5 font-mono text-xs text-surface-400">
                {asset.geometry?.type === 'Point'
                  ? `[${asset.geometry.coordinates[0].toFixed(6)}, ${asset.geometry.coordinates[1].toFixed(6)}]`
                  : `${asset.geometry?.coordinates?.length || 0} điểm`
                }
              </div>
            </div>

            {/* Approval actions */}
            {canApprove && approvalStatus === 'pending' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
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
            {hasRole('admin') && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => onEdit(asset)} className="btn-secondary flex-1 text-sm">
                  Chỉnh sửa
                </button>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger text-sm px-4">
                  {deleting ? '...' : 'Xoá'}
                </button>
              </div>
            )}
          </div>
        ) : tab === 'photos' ? (
          <div className="animate-fade-in">
            {photos.length === 0 ? (
              <div className="text-center py-8 text-surface-500 text-sm">
                Chưa có ảnh hiện trường
              </div>
            ) : (
              <div className="space-y-3">
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
                      {photo.aiTags && photo.aiTags.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-surface-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-surface-400">AI Nhận diện:</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                              photo.aiSeverity === 'normal' || photo.aiSeverity === 'low' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : photo.aiSeverity === 'medium'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              Cảnh báo: {photo.aiSeverity}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {photo.aiTags.map((tag, idx) => (
                              <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
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
                className="btn-secondary w-full text-sm py-2 disabled:opacity-50"
              >
                {uploading ? 'Đang tải lên...' : '+ Thêm ảnh'}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in relative pb-8">
            <button
              onClick={() => setShowMaintForm(!showMaintForm)}
              className="btn-primary w-full text-sm mb-4"
            >
              {showMaintForm ? 'Hủy' : (hasRole('user') ? '🚨 Báo cáo sự cố' : '+ Tạo bản ghi mới')}
            </button>

            {showMaintForm && (
              <MaintenanceForm
                assetId={asset.id}
                onSaved={handleMaintenanceSaved}
                onCancel={() => setShowMaintForm(false)}
              />
            )}

            <MaintenanceHistory records={maintenance} loading={loadingMaint} onRefresh={fetchMaintenance} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="label-text">{label}</span>
      <p className="text-surface-200 text-sm">{value}</p>
    </div>
  );
}
