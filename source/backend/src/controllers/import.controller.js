const Asset = require('../models/Asset');
const { validateGeoJSON } = require('../utils/geojson');
const { success, error } = require('../utils/response');

const importGeoJSON = async (req, res, next) => {
  try {
    const { features, assetType, source } = req.body;

    if (!features || !Array.isArray(features) || features.length === 0) {
      return error(res, 'Dữ liệu GeoJSON không hợp lệ', 400);
    }

    const results = { imported: 0, errors: [] };

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      try {
        const geoCheck = validateGeoJSON(feature.geometry);
        if (!geoCheck.valid) {
          results.errors.push({ index: i, message: geoCheck.message });
          continue;
        }

        const props = feature.properties || {};
        const prefix = (assetType || 'AST').substring(0, 3).toUpperCase();
        const count = await Asset.countDocuments();

        const asset = new Asset({
          assetCode: props.assetCode || `${prefix}-${String(count + i + 1).padStart(5, '0')}`,
          name: props.name || `Tài sản ${count + i + 1}`,
          assetType: assetType || props.assetType || 'road',
          geometryType: feature.geometry.type,
          geometry: feature.geometry,
          material: props.material,
          dimensions: props.dimensions,
          status: props.status || 'good',
          source: source || 'imported_osm',
        });

        await asset.save();
        results.imported++;
      } catch (err) {
        results.errors.push({ index: i, message: err.message });
      }
    }

    success(res, results, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { importGeoJSON };
