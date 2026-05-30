const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  assetType: {
    type: String,
    required: true,
    // ĐÃ BỔ SUNG: 'tree' (Cây xanh)
    enum: ['road', 'sign', 'traffic_light', 'manhole', 'lamp_post', 'sidewalk', 'tree'],
  },
  geometryType: {
    type: String,
    required: true,
    enum: ['Point', 'LineString', 'Polygon'],
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point', 'LineString', 'Polygon'],
      required: true,
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  // ĐÃ BỔ SUNG: Trường thông tin quy hoạch
  planningInfo: {
    type: String,
    trim: true,
  },
  material: {
    type: String,
    trim: true,
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: String,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['good', 'fair', 'damaged'],
    default: 'good',
  },
  managedAreaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    index: true,
  },
  source: {
    type: String,
    enum: ['manual', 'imported_osm', 'demo'],
    default: 'manual',
  },
  lastInspectionAt: {
    type: Date,
  },
  photos: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    aiTags: [String], 
    aiSeverity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'normal'],
    }, 
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  capturedAt: {
    type: Date,
    default: Date.now,
  },
  captureMethod: {
    type: String,
    enum: ['manual', 'gps', 'imported_osm', 'demo'],
    default: 'manual',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

assetSchema.index({ geometry: '2dsphere' });
assetSchema.index({ assetType: 1, status: 1 });

assetSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Asset', assetSchema);