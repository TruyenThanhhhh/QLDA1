const maintenanceService = require('../services/maintenance.service');
const { success, paginated } = require('../utils/response');
const { getIo } = require('../config/socket');

const getByAsset = async (req, res, next) => {
  try {
    const result = await maintenanceService.getByAsset(req.params.id, req.query);
    paginated(res, result.records, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const record = await maintenanceService.create(
      req.params.id,
      req.body,
      req.user
    );
    getIo().emit('new_maintenance_event', { type: 'CREATE_MAINTENANCE', data: record });
    success(res, { id: record.id, message: 'Record created successfully' }, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const record = await maintenanceService.update(req.params.id, req.body, req.user);
    getIo().emit('new_maintenance_event', { type: 'UPDATE_MAINTENANCE', data: record });
    success(res, { id: record.id, message: 'Record updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getByAsset, create, update };
