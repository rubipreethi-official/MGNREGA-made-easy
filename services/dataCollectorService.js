const axios = require('axios');
const DistrictData = require('../models/DistrictData');
const Cache = require('../models/Cache');

class DataCollectorService {
  constructor() {
    
    this.baseUrl = 'https://api.data.gov.in/resource/';
    this.apiKey = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001';
    
    
    this.resourceIds = {
      employment: 'mgnrega-employment-data',
      expenditure: 'mgnrega-expenditure-data',
      works: 'mgnrega-works-data'
    };
    
    
    this.sampleDistricts = [
      {
        districtCode: 'IN-DL-ND',
        districtName: 'New Delhi',
        stateCode: 'IN-DL',
        stateName: 'Delhi',
        latitude: 28.6139,
        longitude: 77.2090
      },
      {
        districtCode: 'IN-MH-MU',
        districtName: 'Mumbai',
        stateCode: 'IN-MH',
        stateName: 'Maharashtra',
        latitude: 19.0760,
        longitude: 72.8777
      },
      {
        districtCode: 'IN-KA-BG',
        districtName: 'Bangalore',
        stateCode: 'IN-KA',
        stateName: 'Karnataka',
        latitude: 12.9716,
        longitude: 77.5946
      },
      {
        districtCode: 'IN-TN-CN',
        districtName: 'Chennai',
        stateCode: 'IN-TN',
        stateName: 'Tamil Nadu',
        latitude: 13.0827,
        longitude: 80.2707
      },
      {
        districtCode: 'IN-GJ-AH',
        districtName: 'Ahmedabad',
        stateCode: 'IN-GJ',
        stateName: 'Gujarat',
        latitude: 23.0225,
        longitude: 72.5714
      }
    ];
  }

  
  async fetchGovernmentData(resourceId, districtCode) {
    try {
      const url = `${this.baseUrl}${resourceId}`;
      const params = {
        'api-key': this.apiKey,
        format: 'json',
        'filters[district_code]': districtCode,
        limit: 100
      };

      console.log(`📡 Fetching from data.gov.in: ${resourceId} for ${districtCode}`);
      const response = await axios.get(url, { 
        params, 
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.records && response.data.records.length > 0) {
        console.log(`✅ Successfully fetched ${response.data.records.length} records`);
        return response.data;
      } else {
        console.log('⚠️ API returned empty data');
        return null;
      }
    } catch (error) {
      console.warn(`⚠️ Government API failed for ${resourceId}: ${error.message}`);
      console.log('📝 Falling back to sample data generation');
      return null;
    }
  }

  
  parseGovernmentData(apiData, districtCode) {

    return null;
  }

 
  generateSampleData(districtCode, districtName) {
    const dataPoints = [];
    const currentDate = new Date();
    
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().slice(0, 7); 
      const year = date.getFullYear();

      
      const baseDemand = 5000 + Math.floor(Math.random() * 10000);
      const demandVariation = 0.7 + Math.random() * 0.3;
      const personsDemanded = Math.floor(baseDemand * demandVariation);
      
      const employmentRate = 0.75 + Math.random() * 0.2; 
      const personsEmployed = Math.floor(personsDemanded * employmentRate);
      
      const avgWage = 200 + Math.floor(Math.random() * 50);
      const wagesPaid = personsEmployed * avgWage;
      
      const totalExpenditure = wagesPaid * (1.3 + Math.random() * 0.3);
      const materialExpenditure = totalExpenditure * (0.15 + Math.random() * 0.1);
      const adminExpenditure = totalExpenditure * (0.05 + Math.random() * 0.05);

      const householdsProvidedWork = Math.floor(personsEmployed * 0.4);
      const totalHouseholds = Math.floor(personsDemanded * 0.45);

      const totalWorks = 50 + Math.floor(Math.random() * 100);
      const completionRate = 0.4 + Math.random() * 0.4;
      const completedWorks = Math.floor(totalWorks * completionRate);
      const inProgressWorks = totalWorks - completedWorks;

      dataPoints.push({
        month,
        year,
        personsDemanded,
        personsEmployed,
        householdsProvidedWork,
        totalHouseholds,
        totalExpenditure,
        averageWagePaid: avgWage,
        wagesPaid,
        materialExpenditure,
        administrativeExpenditure: adminExpenditure,
        totalWorks,
        completedWorks,
        inProgressWorks
      });
    }

    return dataPoints;
  }


  async collectAllData() {
    console.log('📊 Starting data collection...');
    
    for (const district of this.sampleDistricts) {
      try {
        await this.collectDistrictData(district);
      } catch (error) {
        console.error(`❌ Failed to collect data for ${district.districtName}:`, error.message);
      }
    }
    
    console.log('✅ Data collection completed');
  }

  
  async collectDistrictData(districtInfo) {
    try {
      console.log(`📥 Collecting data for ${districtInfo.districtName}...`);

      const existingDistrict = await DistrictData.findOne({ 
        districtCode: districtInfo.districtCode 
      });

      const dataPoints = this.generateSampleData(
        districtInfo.districtCode,
        districtInfo.districtName
      );

      if (existingDistrict) {
        
        const existingMonths = new Set(
          existingDistrict.dataPoints.map(dp => dp.month)
        );
        
        const newDataPoints = dataPoints.filter(
          dp => !existingMonths.has(dp.month)
        );

        if (newDataPoints.length > 0) {
          existingDistrict.dataPoints.push(...newDataPoints);
          existingDistrict.dataPoints.sort((a, b) => a.month.localeCompare(b.month));
        }
        
        existingDistrict.lastUpdated = new Date();
        await existingDistrict.save();
        console.log(`✅ Updated ${districtInfo.districtName} with ${newDataPoints.length} new data points`);
      } else {
        
        const newDistrict = new DistrictData({
          districtCode: districtInfo.districtCode,
          districtName: districtInfo.districtName,
          stateCode: districtInfo.stateCode,
          stateName: districtInfo.stateName,
          latitude: districtInfo.latitude,
          longitude: districtInfo.longitude,
          dataPoints: dataPoints,
          lastUpdated: new Date()
        });

        await newDistrict.save();
        console.log(`✅ Created ${districtInfo.districtName} with ${dataPoints.length} data points`);
      }
    } catch (error) {
      console.error(`❌ Error collecting data for ${districtInfo.districtName}:`, error.message);
      throw error;
    }
  }

 
  async findNearestDistrict(lat, lon) {
    try {
      const districts = await DistrictData.find({
        latitude: { $ne: 0 },
        longitude: { $ne: 0 }
      });

      if (districts.length === 0) return null;

      let nearest = null;
      let minDistance = Infinity;

      districts.forEach(district => {
        const distance = this.calculateDistance(
          lat, lon,
          district.latitude, district.longitude
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearest = district;
        }
      });

      return nearest;
    } catch (error) {
      console.error('❌ Error finding nearest district:', error.message);
      return null;
    }
  }

 
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new DataCollectorService();

