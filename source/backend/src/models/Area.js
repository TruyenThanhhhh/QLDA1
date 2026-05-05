const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  code: {
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
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
}, {
  timestamps: true,
});

areaSchema.index({ geometry: '2dsphere' });

areaSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Area', areaSchema);
