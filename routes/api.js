const express = require('express');
const router = express.Router();
const DistrictData = require('../models/DistrictData');
const Analytics = require('../models/Analytics');
const locationService = require('../services/locationService');
const translationService = require('../services/translationService');
const dataCollectorService = require('../services/dataCollectorService');

router.get('/dashboard', async (req, res) => {
  try {
    let location;
    const clientIP = locationService.getClientIP(req);

    
    if (req.query.lat && req.query.lon) {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        console.log('📍 Using browser geolocation coordinates');
        location = await locationService.getLocationFromCoordinates(lat, lon);
      } else {
        console.log('⚠️ Invalid coordinates, falling back to IP detection');
        location = await locationService.getLocationFromIP(clientIP);
      }
    } else {
      
      console.log('📍 Using IP-based location detection');
      location = await locationService.getLocationFromIP(clientIP);
    }
    
    console.log(`🌍 User location: ${location.district}, ${location.state}`);

    
    let districtData = await DistrictData.findOne({
      $or: [
        { districtName: { $regex: new RegExp(location.district, 'i') } },
        { stateName: { $regex: new RegExp(location.state, 'i') } }
      ]
    });

   
    if (!districtData && location.latitude !== 0 && location.longitude !== 0) {
      districtData = await dataCollectorService.findNearestDistrict(
        location.latitude,
        location.longitude
      );
    }

    
    if (!districtData) {
      districtData = await DistrictData.findOne({ districtCode: 'IN-DL-ND' });
    }

    if (!districtData) {
      return res.status(404).json({
        error: 'No district data found. Please run data collection first.'
      });
    }

    
    console.log(`🔍 Detecting regional languages for detected location state: ${location.state}`);
    const detectedLanguages = translationService.detectRegionalLanguages(location.state);
    console.log(`✅ Detected languages:`, detectedLanguages);
    
    
    if (!districtData.commonLanguages || districtData.commonLanguages.length === 0) {
      districtData.commonLanguages = detectedLanguages;
      districtData.regionalLanguages = detectedLanguages.map(lang => ({
        language: lang,
        name: districtData.districtName
      }));
      await districtData.save();
    }
    
    
    districtData.commonLanguages = detectedLanguages;

    
    await Analytics.create({
      ipAddress: clientIP,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        district: location.district,
        state: location.state,
        country: location.country
      },
      detectedLanguages: districtData.commonLanguages,
      userAgent: req.headers['user-agent']
    });

    
    const recentData = districtData.dataPoints
      .slice(-12)
      .sort((a, b) => a.month.localeCompare(b.month));

   
    const latest = recentData[recentData.length - 1] || {};
    
    const summary = {
      districtName: districtData.districtName,
      districtNameTranslations: districtData.regionalLanguages,
      stateName: districtData.stateName,
      detectedLanguages: districtData.commonLanguages,
      lastUpdated: districtData.lastUpdated,
      currentMonth: latest.month,
      employment: {
        personsDemanded: latest.personsDemanded || 0,
        personsEmployed: latest.personsEmployed || 0,
        employmentRate: latest.personsDemanded > 0 
          ? ((latest.personsEmployed / latest.personsDemanded) * 100).toFixed(1)
          : 0
      },
      expenditure: {
        total: latest.totalExpenditure || 0,
        wages: latest.wagesPaid || 0,
        material: latest.materialExpenditure || 0,
        admin: latest.administrativeExpenditure || 0
      },
      works: {
        total: latest.totalWorks || 0,
        completed: latest.completedWorks || 0,
        inProgress: latest.inProgressWorks || 0
      }
    };

    
    console.log('📝 Generating explanations...');
    const explanations = {
      employment: translationService.generateExplanation('employment', {
        personsDemanded: summary.employment.personsDemanded,
        personsEmployed: summary.employment.personsEmployed,
        employmentRate: parseFloat(summary.employment.employmentRate)
      }),
      expenditure: translationService.generateExplanation('expenditure', {
        totalExpenditure: summary.expenditure.total,
        wagesPaid: summary.expenditure.wages,
        materialExpenditure: summary.expenditure.material
      }),
      works: translationService.generateExplanation('works', {
        totalWorks: summary.works.total,
        completedWorks: summary.works.completed,
        inProgressWorks: summary.works.inProgress
      })
    };

    
    const translatedExplanations = {};

   
    const pageContentEn = {
      title: 'MGNREGA Made Easy',
      tagline: 'Know Where Your Region Stands',
      welcomeText: 'Welcome to Your District Dashboard',
      employmentTitle: 'Employment Status',
      expenditureTitle: 'Money Spent Analysis',
      worksTitle: 'Works Progress',
      trendTitle: 'Employment Trends (Last 12 Months)',
      statsTitle: 'Key Statistics',
      chooseLanguage: 'Choose Language:',
      employmentRateLabel: 'Employment Rate',
      gotWorkLabel: 'Got Work',
      totalPeopleLabel: 'Total People Employed',
      thisMonthLabel: 'This Month',
      totalMoneyLabel: 'Total Money Spent',
      totalProjectsLabel: 'Total Projects',
      ongoingLabel: 'Ongoing',
      completedProjectsLabel: 'Completed Projects',
      finishedLabel: 'Finished',
      averageWageLabel: 'Average Wage',
      perDayLabel: 'Per Day'
    };

    
    const translatedPageContent = { English: pageContentEn };

    
    const finalDetectedLanguages = detectedLanguages;
    
    res.json({
      success: true,
      detectedLocation: location,
      data: {
        summary: {
          ...summary,
          detectedLanguages: finalDetectedLanguages // Use languages from detected location
        },
        detectedLanguages: finalDetectedLanguages, // Use languages from detected location
        explanations: {
          English: explanations,
          ...translatedExplanations
        },
        pageContent: translatedPageContent, // Pre-translated content for all languages
        historical: recentData.map(dp => ({
          month: dp.month,
          year: dp.year,
          employment: {
            demanded: dp.personsDemanded,
            employed: dp.personsEmployed,
            rate: dp.personsDemanded > 0 
              ? ((dp.personsEmployed / dp.personsDemanded) * 100).toFixed(1)
              : 0
          },
          expenditure: dp.totalExpenditure,
          works: {
            total: dp.totalWorks,
            completed: dp.completedWorks
          }
        }))
      }
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error.message);
    res.status(500).json({
      error: 'Failed to load dashboard data',
      message: error.message
    });
  }
});


router.get('/districts', async (req, res) => {
  try {
    const districts = await DistrictData.find(
      {},
      'districtName stateName latitude longitude lastUpdated'
    ).sort({ districtName: 1 });

    res.json({
      success: true,
      count: districts.length,
      districts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'text and targetLanguage are required' });
    }

    const translated = await translationService.translateToLanguage(text, targetLanguage);
    
    res.json({
      success: true,
      original: text,
      translated: translated,
      language: targetLanguage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/translate-batch', async (req, res) => {
  try {
    const { texts, targetLanguage } = req.body;
    
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({ error: 'texts (array) and targetLanguage are required' });
    }

    const translated = await translationService.translateMultiple(texts, targetLanguage);
    
    res.json({
      success: true,
      original: texts,
      translated: translated,
      language: targetLanguage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/stats', async (req, res) => {
  try {
    const districtCount = await DistrictData.countDocuments();
    const totalViews = await Analytics.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    
    const todayViews = await Analytics.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({
      success: true,
      districts: districtCount,
      totalViews: totalViews[0]?.total || 0,
      todayViews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

