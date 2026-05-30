import React from 'react';
import { Circle } from 'react-leaflet';
import { convertPoint } from '../../utils/geoconvert';

export default function HeatmapLayer({ assets }) {
  if (!assets || assets.length === 0) return null;

  // Filter out assets that are damaged or need maintenance
  const damagedAssets = assets.filter(
    (asset) =>
      asset.status === 'damaged' ||
      asset.needsMaintenance === true ||
      (asset.riskScore && asset.riskScore > 50)
  );

  return (
    <>
      {damagedAssets.map((asset) => {
        const position = convertPoint(asset.geometry);
        if (!position) return null;

        const assetId = asset.id || asset._id;
        
        // Determine severity multiplier based on riskScore or status
        let intensityFactor = 1.0;
        if (asset.riskScore) {
          intensityFactor = asset.riskScore / 100; // 0.0 to 1.0
        } else if (asset.status === 'damaged') {
          intensityFactor = 0.8;
        }

        // Adjust radii based on intensity
        const outerRadius = 150 + intensityFactor * 150; // 150m - 300m
        const midRadius = 70 + intensityFactor * 80;    // 70m - 150m
        const coreRadius = 30 + intensityFactor * 30;   // 30m - 60m

        return (
          <React.Fragment key={assetId}>
            {/* Outer heat ring: Yellow, low density/range */}
            <Circle
              center={position}
              radius={outerRadius}
              pathOptions={{
                fillColor: '#eab308',
                fillOpacity: 0.08 * intensityFactor,
                stroke: false,
                interactive: false,
              }}
            />
            {/* Mid heat ring: Orange, medium density/range */}
            <Circle
              center={position}
              radius={midRadius}
              pathOptions={{
                fillColor: '#f97316',
                fillOpacity: 0.15 * intensityFactor,
                stroke: false,
                interactive: false,
              }}
            />
            {/* Core heat ring: Red, high severity/density */}
            <Circle
              center={position}
              radius={coreRadius}
              pathOptions={{
                fillColor: '#ef4444',
                fillOpacity: 0.35 * intensityFactor,
                stroke: false,
                interactive: false,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
