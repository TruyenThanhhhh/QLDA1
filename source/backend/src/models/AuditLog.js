const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout'],
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Asset', 'MaintenanceRecord', 'User', 'Area'],
  },
  entityId: {
    type: mongoose.Schema.Types.Mixed,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
  },
  details: {
    type: String,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

auditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
