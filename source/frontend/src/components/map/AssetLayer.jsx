import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { convertPoint } from '../../utils/geoconvert';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_COLORS = {
  good: '#22c55e',
  fair: '#f59e0b',
  damaged: '#ef4444',
};

const TYPE_ICONS = {
  road: '🛣️',
  sign: '🪧',
  traffic_light: '🚦',
  manhole: '🕳️',
  lamp_post: '💡',
  sidewalk: '🚶',
  bus_station: '🚌',
  parking: '🅿️',
};

const TYPE_LABELS = {
  road: 'Đường',
  sign: 'Biển báo',
  traffic_light: 'Đèn tín hiệu',
  manhole: 'Nắp cống',
  lamp_post: 'Cột đèn',
  sidewalk: 'Vỉa hè',
  bus_station: 'Trạm xe buýt',
  parking: 'Bãi đỗ xe',
};

const STATUS_LABELS = {
  good: 'Tốt',
  fair: 'Trung bình',
  damaged: 'Hư hỏng',
};

function createCustomIcon(assetType, status, isSelected) {
  const color = STATUS_COLORS[status] || '#64748b';
  const icon = TYPE_ICONS[assetType] || '📍';
  const size = isSelected ? 36 : 28;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color}20;
      border: ${borderWidth}px solid ${color};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isSelected ? 16 : 13}px;
      box-shadow: 0 0 ${isSelected ? 20 : 10}px ${color}40;
      transition: all 0.2s ease;
      cursor: pointer;
    ">${icon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function AssetPopup({ asset }) {
  const color = STATUS_COLORS[asset.status] || '#64748b';
  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{TYPE_ICONS[asset.assetType]}</span>
        <strong>{asset.name}</strong>
      </div>
      <div className="text-sm space-y-1">
        <p><strong>Mã:</strong> {asset.assetCode}</p>
        <p><strong>Loại:</strong> {TYPE_LABELS[asset.assetType]}</p>
        <p><strong>Tình trạng:</strong> <span style={{ color }}>{STATUS_LABELS[asset.status]}</span></p>
        {asset.material && <p><strong>Vật liệu:</strong> {asset.material}</p>}
      </div>
    </div>
  );
}

export function PointAsset({ asset, isSelected, onClick }) {
  const position = convertPoint(asset.geometry);
  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={createCustomIcon(asset.assetType, asset.status, isSelected)}
      eventHandlers={{ click: () => onClick?.(asset) }}
    />
  );
}

export default function AssetLayer({ assets, selectedAssetId, onAssetClick }) {
  if (!assets || assets.length === 0) return null;

  return (
    <>
      {assets.map(asset => {
        const isSelected = asset.id === selectedAssetId;
        const geometryType = asset.geometry?.type || asset.geometryType;

        if (geometryType !== 'Point') {
          return null;
        }

        return (
          <PointAsset
            key={asset.id}
            asset={asset}
            isSelected={isSelected}
            onClick={onAssetClick}
          />
        );
      })}
    </>
  );
}
