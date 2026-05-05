import { useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function MaintenanceForm({ assetId, onSaved, onCancel }) {
  const { hasRole } = useAuth();
  const [form, setForm] = useState({
    recordType: 'incident',
    title: '',
    description: '',
    severity: 'medium',
    performedBy: '',
    costEstimate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = { ...form };
      if (data.costEstimate) data.costEstimate = parseFloat(data.costEstimate);
      else delete data.costEstimate;
      
      if (!data.performedBy) delete data.performedBy;
      await client.post(`/assets/${assetId}/maintenance`, data);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card-light p-4 mb-4 space-y-3 animate-slide-up">
      {!hasRole('admin', 'technician') && (
        <h4 className="text-sm font-medium text-white border-b border-surface-700/50 pb-2">Báo cáo sự cố</h4>
      )}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">{error}</div>
      )}

      <div className={hasRole('admin', 'technician') ? "grid grid-cols-2 gap-3" : ""}>
        {hasRole('admin', 'technician') && (
          <div>
            <label className="label-text text-xs">Loại</label>
            <select name="recordType" value={form.recordType} onChange={handleChange} className="select-field text-xs">
              <option value="incident">Sự cố</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
        )}
        <div>
          <label className="label-text text-xs">Mức độ</label>
          <select name="severity" value={form.severity} onChange={handleChange} className="select-field text-xs">
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="critical">Nghiêm trọng</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label-text text-xs">Tiêu đề *</label>
        <input name="title" value={form.title} onChange={handleChange}
          className="input-field text-xs" placeholder="Tiêu đề ngắn gọn" required />
      </div>

      <div>
        <label className="label-text text-xs">Mô tả *</label>
        <textarea name="description" value={form.description} onChange={handleChange}
          className="input-field text-xs h-20 resize-none" required />
      </div>

      {hasRole('admin', 'technician') && (
        <div>
          <label className="label-text text-xs">Chi phí ước tính (VNĐ)</label>
          <input name="costEstimate" type="number" value={form.costEstimate} onChange={handleChange} className="input-field text-xs" />
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-xs flex-1">
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-xs">Huỷ</button>
      </div>
    </form>
  );
}
