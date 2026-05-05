import { useState, useRef } from 'react';
import client from '../../api/client';

const ASSET_TYPES = [
  { value: 'sign', label: '🪧 Biển báo' },
  { value: 'traffic_light', label: '🚦 Đèn tín hiệu' },
  { value: 'manhole', label: '🕳️ Nắp cống' },
  { value: 'lamp_post', label: '💡 Cột đèn' },
  { value: 'road', label: '🛣️ Đường' },
  { value: 'sidewalk', label: '🚶 Vỉa hè' },
];

const STATUS_OPTIONS = [
  { value: 'good', label: '🟢 Tốt' },
  { value: 'fair', label: '🟡 Trung bình' },
  { value: 'damaged', label: '🔴 Hư hỏng' },
];

export default function AssetForm({ asset, onClose, onSaved, presetLocation }) {
  const isEdit = !!asset;
  const hasPresetLocation = !!presetLocation && !isEdit;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    assetType: 'sign',
    description: '',
    status: 'good',
    material: '',
  });
  const [location, setLocation] = useState(
    presetLocation || (asset?.geometry?.type === 'Point'
      ? [asset.geometry.coordinates[1], asset.geometry.coordinates[0]]
      : null)
  );
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLocationSet = (latLng) => {
    setLocation(latLng);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);

    const newPhotos = [...photos, ...toAdd];
    const newPreviews = [...photoPreviews];

    toAdd.forEach(file => {
      newPreviews.push(URL.createObjectURL(file));
    });

    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!location) {
      setError('Vui lòng chọn vị trí trên bản đồ');
      return;
    }

    if (!isEdit && photos.length === 0) {
      setError('Bắt buộc phải có ít nhất 1 ảnh hiện trường');
      return;
    }

    setSaving(true);

    try {
      const data = {
        name: form.name,
        assetType: form.assetType,
        description: form.description,
        status: form.status,
        material: form.material,
        geometry: {
          type: 'Point',
          coordinates: [location[1], location[0]],
        },
      };

      let assetId;

      if (isEdit) {
        await client.patch(`/assets/${asset.id}`, data);
        assetId = asset.id;
      } else {
        const res = await client.post('/assets', data);
        assetId = res.data.id;
      }

      if (!isEdit && photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => {
          formData.append('photos', photo);
        });

        await client.post(`/assets/${assetId}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = form.name && location && (isEdit || photos.length > 0);
  const canNextStep = (step === 1 && form.assetType) || (step === 2 && location);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-surface-700/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {isEdit ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-surface-500 hover:text-white hover:bg-surface-700/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isEdit && (
          <div className="flex gap-1 mt-3">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary-500' : 'bg-surface-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {isEdit ? (
          <>
            <div>
              <label className="label-text">Tên tài sản *</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="label-text">Loại tài sản</label>
              <select name="assetType" value={form.assetType} onChange={handleChange} className="select-field">
                {ASSET_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Mô tả</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input-field min-h-[80px] resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="label-text">Tình trạng</label>
              <select name="status" value={form.status} onChange={handleChange} className="select-field">
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Vật liệu</label>
              <input name="material" value={form.material} onChange={handleChange} className="input-field" />
            </div>
          </>
        ) : (
          <>
            {step === 1 && (
              <>
                <div>
                  <label className="label-text">Loại đối tượng *</label>
                  <select
                    name="assetType"
                    value={form.assetType}
                    onChange={handleChange}
                    className="select-field"
                  >
                    {ASSET_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-sm">
                  💡 Click vào vị trí trên bản đồ để đặt điểm
                </div>
                {location ? (
                  <div className="bg-surface-800/50 rounded-lg p-3">
                    <p className="text-sm text-surface-300 mb-1">Vị trí đã chọn:</p>
                    <p className="font-mono text-xs text-emerald-400">
                      [{location[0].toFixed(6)}, {location[1].toFixed(6)}]
                    </p>
                    <button
                      type="button"
                      onClick={() => setLocation(null)}
                      className="text-xs text-surface-500 hover:text-white mt-2"
                    >
                      Chọn lại
                    </button>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-surface-700 rounded-lg text-center text-surface-500 text-sm">
                    Chưa chọn vị trí
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className="label-text">Tên đối tượng *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="VD: Biển báo cấm đỗ xe"
                    required
                  />
                </div>

                <div>
                  <label className="label-text">Ảnh hiện trường * (tối đa 5)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={photos.length >= 5}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= 5}
                    className="w-full p-4 border-2 border-dashed border-surface-700 rounded-lg text-surface-500 hover:text-white hover:border-surface-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {photos.length >= 5
                      ? `Đủ ${photos.length}/5 ảnh`
                      : photos.length > 0
                        ? `+ Thêm ảnh (${photos.length}/5)`
                        : '+ Chọn ảnh hiện trường'
                    }
                  </button>

                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          <img
                            src={src}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-surface-700"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label-text">Mô tả ngắn</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="Mô tả hiện trường..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="label-text">Tình trạng</label>
                  <select name="status" value={form.status} onChange={handleChange} className="select-field">
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </>
        )}

        <div className="flex gap-2 pt-2">
          {!isEdit && step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
            >
              ← Quay lại
            </button>
          )}
          {!isEdit && step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (canNextStep) {
                  const nextStep = (step === 1 && hasPresetLocation) ? 3 : step + 1;
                  setStep(nextStep);
                }
              }}
              disabled={!canNextStep}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 1 && hasPresetLocation ? 'Tiếp tục →' : 'Tiếp tục →'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary">
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
