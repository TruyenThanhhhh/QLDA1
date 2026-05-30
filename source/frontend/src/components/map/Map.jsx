import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import AssetLayer from './AssetLayer';
import HeatmapLayer from './HeatmapLayer';
import AreaLayer from './AreaLayer';
import MapPicker from './MapPicker';
import { convertGeometry } from '../../utils/geoconvert';

const DANANG_CENTER = [16.0544, 108.2022];

function FitBounds({ assets, areas, showAreaLayer }) {
  const map = useMap();

  useEffect(() => {
    const allCoords = [];
    if (assets) {
      assets.forEach(asset => {
        if (asset.geometry?.type !== 'Point') return;
        const coords = convertGeometry(asset.geometry);
        if (!coords) return;
        allCoords.push(coords);
      });
    }
    if (showAreaLayer && areas) {
      areas.forEach(area => {
        const coords = convertGeometry(area.geometry);
        if (!coords) return;
        coords.forEach(ring => allCoords.push(...ring));
      });
    }
    if (allCoords.length > 0) {
      const frame = requestAnimationFrame(() => {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [assets, areas, map, showAreaLayer]);

  return null;
}

function FocusAsset({ asset }) {
  const map = useMap();

  useEffect(() => {
    if (!asset?.geometry || asset.geometry.type !== 'Point') return;
    const coords = convertGeometry(asset.geometry);
    if (!coords) return;
    map.flyTo(coords, Math.max(map.getZoom(), 16), { animate: true, duration: 0.6 });
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

function MapEvents({
  assets,
  areas,
  focusAsset,
  selectedAssetId,
  isPickingLocation,
  onLocationPicked,
  onAssetClick,
  pickerPosition,
  showAreaLayer,
  routePolyline,
  showHeatmap,
}) {
  // OSRM trả về [lon, lat], Polyline cần [lat, lon]
  const polylinePositions = routePolyline?.coordinates 
    ? routePolyline.coordinates.map(coord => [coord[1], coord[0]])
    : [];

  return (
    <>
      <SyncMapSize />
      <FitBounds assets={assets} areas={areas} showAreaLayer={showAreaLayer} />
      <FocusAsset asset={focusAsset} />
      {showAreaLayer && <AreaLayer areas={areas} />}
      {showHeatmap ? (
        <HeatmapLayer assets={assets} />
      ) : (
        <AssetLayer assets={assets} selectedAssetId={selectedAssetId} onAssetClick={onAssetClick} />
      )}
      {(isPickingLocation || pickerPosition) && (
        <MapPicker
          onLocationPicked={onLocationPicked}
          position={pickerPosition}
          interactive={isPickingLocation}
        />
      )}
      {polylinePositions.length > 0 && (
        <Polyline 
          positions={polylinePositions} 
          pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.8, dashArray: '10, 10' }} 
        />
      )}
    </>
  );
}

export default function Map({
  assets = [],
  areas = [],
  selectedAssetId,
  onAssetClick,
  focusAsset,
  center = DANANG_CENTER,
  zoom = 13,
  isPickingLocation = false,
  onLocationPicked,
  pickerPosition = null,
  showAreaLayer = false,
  routePolyline = null, // Prop dự phòng
  showHeatmap = false,
}) {
  const [eventRoute, setEventRoute] = useState(null);

  // Lắng nghe sự kiện vẽ đường từ AssetSidebar mà không cần thông qua Component cha
  useEffect(() => {
    const handleRoute = (e) => setEventRoute(e.detail);
    const handleClear = () => setEventRoute(null);
    
    window.addEventListener('map:routeFound', handleRoute);
    window.addEventListener('map:clearRoute', handleClear);
    
    return () => {
      window.removeEventListener('map:routeFound', handleRoute);
      window.removeEventListener('map:clearRoute', handleClear);
    };
  }, []);

  const activeRoute = routePolyline || eventRoute;

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0 absolute inset-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapEvents
          assets={assets}
          areas={areas}
          focusAsset={focusAsset}
          selectedAssetId={selectedAssetId}
          isPickingLocation={isPickingLocation}
          onLocationPicked={onLocationPicked}
          onAssetClick={onAssetClick}
          pickerPosition={pickerPosition}
          showAreaLayer={showAreaLayer}
          routePolyline={activeRoute}
          showHeatmap={showHeatmap}
        />
      </MapContainer>
    </div>
  );
}

export { MapContainer, TileLayer };