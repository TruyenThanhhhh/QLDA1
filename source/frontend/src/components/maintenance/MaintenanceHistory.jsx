import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

const typeLabels = { incident: 'Sự cố', maintenance: 'Bảo trì' };
const typeStyles = {
  incident: 'bg-red-500/20 text-red-400',
  maintenance: 'bg-blue-500/20 text-blue-400',
};
const sevLabels = { low: 'Thấp', medium: 'TB', high: 'Cao', critical: 'Nghiêm trọng' };
const sevStyles = {
  low: 'text-surface-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};
const statusLabels = { open: 'Mở', in_progress: 'Đang xử lý', resolved: 'Đã xử lý', cancelled: 'Đã hủy' };
const statusStyles = {
  open: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-surface-500/20 text-surface-400',
};

const formatCurrency = (n) => {
  if (!n) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
};

export default function MaintenanceHistory({ records, loading, onRefresh }) {
  const { hasRole } = useAuth();
  const [updating, setUpdating] = useState(null);

  const handleUpdateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await client.patch(`/maintenance/${id}`, { status });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-surface-500 text-sm py-8">
        Chưa có bản ghi bảo trì nào
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.id} className="glass-card-light p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${typeStyles[record.recordType]}`}>
                {typeLabels[record.recordType]}
              </span>
              <span className={`text-[10px] font-medium ${sevStyles[record.severity]}`}>
                {sevLabels[record.severity]}
              </span>
            </div>
            {hasRole('admin', 'technician') ? (
              <select
                value={record.status}
                onChange={(e) => handleUpdateStatus(record.id, e.target.value)}
                disabled={updating === record.id}
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium cursor-pointer border-0 outline-none ${statusStyles[record.status]}`}
              >
                {Object.entries(statusLabels).map(([val, label]) => (
                  <option key={val} value={val} className="text-surface-900 bg-white">
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${statusStyles[record.status]}`}>
                {statusLabels[record.status]}
              </span>
            )}
          </div>

          <p className="text-xs text-surface-300 leading-relaxed">{record.description}</p>

          <div className="flex items-center justify-between text-[10px] text-surface-500">
            <span>{record.reportedBy?.fullName || '—'}</span>
            <span>{new Date(record.recordedAt).toLocaleDateString('vi-VN')}</span>
          </div>

          {(record.costEstimate || record.costActual) && (
            <div className="flex gap-4 text-[10px] text-surface-500 pt-1 border-t border-surface-700/30">
              {record.costEstimate && <span>Ước tính: {formatCurrency(record.costEstimate)}</span>}
              {record.costActual && <span>Thực tế: {formatCurrency(record.costActual)}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
