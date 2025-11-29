const mongoose = require('mongoose');

const DistrictDataSchema = new mongoose.Schema({
  districtCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  districtName: {
    type: String,
    required: true,
    index: true
  },
  stateCode: {
    type: String,
    required: true
  },
  stateName: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  dataPoints: [{
    month: {
      type: String,
      required: true 
    },
    year: {
      type: Number,
      required: true
    },
    personsDemanded: {
      type: Number,
      default: 0
    },
    personsEmployed: {
      type: Number,
      default: 0
    },
    householdsProvidedWork: {
      type: Number,
      default: 0
    },
    totalHouseholds: {
      type: Number,
      default: 0
    },
    totalExpenditure: {
      type: Number,
      default: 0 // in rupees
    },
    averageWagePaid: {
      type: Number,
      default: 0
    },
    wagesPaid: {
      type: Number,
      default: 0
    },
    materialExpenditure: {
      type: Number,
      default: 0
    },
    administrativeExpenditure: {
      type: Number,
      default: 0
    },
    totalWorks: {
      type: Number,
      default: 0
    },
    completedWorks: {
      type: Number,
      default: 0
    },
    inProgressWorks: {
      type: Number,
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  commonLanguages: [{
    type: String
  }],
  regionalLanguages: [{
    language: String,
    name: String // district name in regional language
  }]
}, {
  timestamps: true
});

// Index for fast location-based queries
DistrictDataSchema.index({ latitude: 1, longitude: 1 });
DistrictDataSchema.index({ 'dataPoints.month': 1 });

module.exports = mongoose.model('DistrictData', DistrictDataSchema);

