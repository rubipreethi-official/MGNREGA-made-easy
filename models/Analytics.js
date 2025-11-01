const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  ipAddress: {
    type: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    district: String,
    state: String,
    country: String
  },
  detectedLanguages: [{
    type: String
  }],
  views: {
    type: Number,
    default: 1
  },
  lastViewed: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

AnalyticsSchema.index({ createdAt: 1 });
AnalyticsSchema.index({ 'location.district': 1 });

module.exports = mongoose.model('Analytics', AnalyticsSchema);

