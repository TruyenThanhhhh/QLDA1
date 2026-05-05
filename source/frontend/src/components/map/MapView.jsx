import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import {
  convertPoint,
  convertLineString,
  convertPolygon,
  convertGeometry,
} from '../../utils/geoconvert';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const statusColors = {
  good: '#22c55e',
  fair: '#f59e0b',
  damaged: '#ef4444',
};

const typeIcons = {
  road: '🛣️',
  sign: '🪧',
  traffic_light: '🚦',
  manhole: '🕳️',
  lamp_post: '💡',
  sidewalk: '🚶',
};

const typeLabels = {
  road: 'Đường',
  sign: 'Biển báo',
  traffic_light: 'Đèn tín hiệu',
  manhole: 'Nắp cống',
  lamp_post: 'Cột đèn',
  sidewalk: 'Vỉa hè',
};

const statusLabels = {
  good: 'Tốt',
  fair: 'Trung bình',
  damaged: 'Hư hỏng',
};

function createCustomIcon(asset, isSelected) {
  const color = statusColors[asset.status] || '#64748b';
  const icon = typeIcons[asset.assetType] || '📍';
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

function AssetPopup({ asset }) {
  const color = statusColors[asset.status] || '#64748b';
  return (
    <Popup>
      <div className="min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{typeIcons[asset.assetType]}</span>
          <strong className="text-white">{asset.name}</strong>
        </div>
        <div className="text-surface-400 text-xs space-y-1">
          <p>Mã: {asset.assetCode}</p>
          <p>Loại: {typeLabels[asset.assetType]}</p>
          <p>Tình trạng: <span style={{ color }}>{statusLabels[asset.status]}</span></p>
        </div>
      </div>
    </Popup>
  );
}

function PointLayer({ asset, isSelected, onClick }) {
  const position = convertPoint(asset.geometry);
  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={createCustomIcon(asset, isSelected)}
      eventHandlers={{ click: () => onClick(asset) }}
    >
      <AssetPopup asset={asset} />
    </Marker>
  );
}

function LineLayer({ asset, isSelected, onClick }) {
  const positions = convertLineString(asset.geometry);
  if (!positions) return null;

  const color = statusColors[asset.status] || '#64748b';

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 1 : 0.7,
      }}
      eventHandlers={{ click: () => onClick(asset) }}
    >
      <AssetPopup asset={asset} />
    </Polyline>
  );
}

function PolygonLayer({ asset, isSelected, onClick }) {
  const positions = convertPolygon(asset.geometry);
  if (!positions) return null;

  const color = statusColors[asset.status] || '#64748b';

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: isSelected ? 0.4 : 0.2,
        weight: isSelected ? 3 : 2,
      }}
      eventHandlers={{ click: () => onClick(asset) }}
    >
      <AssetPopup asset={asset} />
    </Polygon>
  );
}

function FitBounds({ assets }) {
  const map = useMap();

  useEffect(() => {
    if (assets.length === 0) return;

    const allCoords = [];
    assets.forEach(asset => {
      const coords = convertGeometry(asset.geometry);
      if (!coords) return;

      if (asset.geometry.type === 'Point') {
        allCoords.push(coords);
      } else if (asset.geometry.type === 'LineString') {
        allCoords.push(...coords);
      } else if (asset.geometry.type === 'Polygon') {
        coords.forEach(ring => allCoords.push(...ring));
      }
    });

    if (allCoords.length > 0) {
      const frame = requestAnimationFrame(() => {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [assets, map]);

  return null;
}

function FocusSelectedAsset({ asset }) {
  const map = useMap();

  useEffect(() => {
    if (!asset?.geometry) return;

    if (asset.geometry.type === 'Point') {
      const position = convertPoint(asset.geometry);
      if (position) {
        map.flyTo(position, Math.max(map.getZoom(), 16), {
          animate: true,
          duration: 0.6,
        });
      }
      return;
    }

    const positions = convertGeometry(asset.geometry);
    if (positions && positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16,
        duration: 0.6,
      });
    }
  }, [asset, map]);

  return null;
}

function SyncMapSize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const syncSize = () => map.invalidateSize({ animate: false });
    syncSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(syncSize);
      observer.observe(container);
      return () => observer.disconnect();
    }
    return undefined;
  }, [map]);

  return null;
}

function AssetRenderer({ assets, selectedAssetId, onAssetClick }) {
  const pointAssets = assets.filter(
    a => a.geometryType === 'Point' || a.geometry?.type === 'Point'
  );
  const lineAssets = assets.filter(
    a => a.geometryType === 'LineString' || a.geometry?.type === 'LineString'
  );
  const polygonAssets = assets.filter(
    a => a.geometryType === 'Polygon' || a.geometry?.type === 'Polygon'
  );

  return (
    <>
      {polygonAssets.map(asset => (
        <PolygonLayer
          key={asset.id}
          asset={asset}
          isSelected={asset.id === selectedAssetId}
          onClick={onAssetClick}
        />
      ))}
      {lineAssets.map(asset => (
        <LineLayer
          key={asset.id}
          asset={asset}
          isSelected={asset.id === selectedAssetId}
          onClick={onAssetClick}
        />
      ))}
      {pointAssets.map(asset => (
        <PointLayer
          key={asset.id}
          asset={asset}
          isSelected={asset.id === selectedAssetId}
          onClick={onAssetClick}
        />
      ))}
    </>
  );
}

export default function MapView({ assets, onAssetClick, selectedAssetId, selectedAsset }) {
  const center = [16.0544, 108.2022];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <SyncMapSize />
      <FitBounds assets={assets} />
      <FocusSelectedAsset asset={selectedAsset} />
      <AssetRenderer
        assets={assets}
        selectedAssetId={selectedAssetId}
        onAssetClick={onAssetClick}
      />
    </MapContainer>
  );
}

export { PointLayer, LineLayer, PolygonLayer, AssetPopup };
