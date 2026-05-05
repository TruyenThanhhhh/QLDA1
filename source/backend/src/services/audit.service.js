const AuditLog = require('../models/AuditLog');

const log = async ({ action, entityType, entityId, performedBy, before, after, details }) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      before,
      after,
      details,
    });
  } catch (err) {
    console.error('AuditLog error:', err);
  }
};

module.exports = { log };
