import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const tempIcon = L.divIcon({
  className: 'temp-marker',
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #3b82f640;
    border: 3px solid #3b82f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 15px #3b82f660;
    animation: pulse 1.5s infinite;
  ">📍</div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  </style>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function MapPicker({ onLocationPicked, position, interactive = true }) {
  useMapEvents({
    click: interactive
      ? (e) => {
          const { lat, lng } = e.latlng;
          onLocationPicked?.([lat, lng]);
        }
      : undefined,
  });

  if (!position) return null;

  return <Marker position={position} icon={tempIcon} />;
}
