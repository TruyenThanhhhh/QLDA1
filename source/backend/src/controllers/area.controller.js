const areaService = require('../services/area.service');
const { success, paginated, error } = require('../utils/response');

const getAreas = async (req, res, next) => {
  try {
    const result = await areaService.getAllAreas();
    paginated(res, result.items, result.items.length, 1, result.items.length);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAreas };
