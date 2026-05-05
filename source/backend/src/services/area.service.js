const Area = require('../models/Area');

const getAllAreas = async () => {
  const areas = await Area.find({}).sort({ name: 1 });
  return { items: areas };
};

module.exports = { getAllAreas };
