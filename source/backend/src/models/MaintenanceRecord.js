const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
    index: true,
  },
  recordType: {
    type: String,
    enum: ['incident', 'maintenance'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    nullable: true,
  },
  costEstimate: {
    type: Number,
    min: 0,
  },
  costActual: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'pending_approval', 'resolved', 'cancelled'],
    default: 'open',
  },
  notes: {
    type: String,
    trim: true,
  },
  photos: [{
    path: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

maintenanceRecordSchema.index({ assetId: 1, recordedAt: -1 });

maintenanceRecordSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);