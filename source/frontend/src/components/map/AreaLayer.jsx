import { Polygon } from 'react-leaflet';
import { convertPolygon } from '../../utils/geoconvert';

const AREA_COLORS = {
  default: '#6366f1',
};

export function AreaPopup({ area }) {
  return (
    <div className="min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📍</span>
        <strong>{area.name}</strong>
      </div>
      <div className="text-sm space-y-1">
        <p><strong>Mã:</strong> {area.code}</p>
      </div>
    </div>
  );
}

export function AreaPolygon({ area, isSelected, onClick }) {
  const positions = convertPolygon(area.geometry);
  if (!positions) return null;

  const color = AREA_COLORS.default;

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: isSelected ? '#818cf8' : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.25 : 0.1,
        weight: isSelected ? 2 : 1,
        dashArray: isSelected ? null : '5, 5',
      }}
      eventHandlers={{ click: () => onClick?.(area) }}
    />
  );
}

export default function AreaLayer({ areas, selectedAreaId, onAreaClick }) {
  if (!areas || areas.length === 0) return null;

  return (
    <>
      {areas.map(area => (
        <AreaPolygon
          key={area.id || area._id}
          area={area}
          isSelected={area.id === selectedAreaId || area._id === selectedAreaId}
          onClick={onAreaClick}
        />
      ))}
    </>
  );
}
