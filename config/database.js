const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      console.error('❌ MongoDB connection error: MONGODB_URI is not defined in .env file');
      console.error('📝 Please create a .env file in the root directory with:');
      console.error('   MONGODB_URI=mongodb+srv://rubipreethi2004_db_user:mgnrega25@cluster0.j0xbanx.mongodb.net/mgnrega_db?retryWrites=true&w=majority&appName=Cluster0');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

