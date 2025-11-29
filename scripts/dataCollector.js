
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const dataCollectorService = require('../services/dataCollectorService');

async function main() {
    console.log('🔄 Starting MGNREGA data collection process...');
    console.log(`📅 ${new Date().toISOString()}`);
    
    try {
        await connectDB();
        console.log('✅ Connected to database');

        await dataCollectorService.collectAllData();

        console.log('✅ Data collection completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Data collection failed:', error.message);
        process.exit(1);
    }
}


if (require.main === module) {
    main();
}

module.exports = main;

