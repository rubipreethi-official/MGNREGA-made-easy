# MGNREGA Made Easy 🎯

**Know Where Your Region Stands**

A user-friendly portal that makes MGNREGA government data accessible to rural citizens through simple visualizations and multilingual support.

## 🌟 Features

- 📊 **Simple Visualizations**: Pie charts and line graphs with clear descriptions
- 🌍 **Auto Location Detection**: Automatically detects user's district using browser geolocation or IP
- 🗣️ **Multilingual Support**: Content automatically translated to regional languages via Gemini AI
- 📈 **Historical Data**: View performance trends over last 12 months
- 🎨 **Low-Literacy Friendly**: Designed for rural citizens with simple language
- 💾 **Production Ready**: Cached data for reliability, MongoDB for persistence
- 🤖 **AI-Powered**: Uses Google Gemini API for language detection and translation

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### Installation Steps

1. **Clone and Install**
```bash
# Install dependencies
npm install
```

2. **Set Up Environment Variables**

Create a `.env` file in the root directory with:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://rubipreethi2004_db_user:mgnrega25@cluster0.j0xbanx.mongodb.net/mgnrega_db?retryWrites=true&w=majority&appName=Cluster0

# Gemini API Key
GEMINI_API_KEY=AIzaSyDws-FYnk7hpi-OY1m4AQMLI2_iXpX9Kc4

# Data.gov.in API Key (optional)
DATA_GOV_API_KEY=579b464db66ec23bdd000001

# Server Configuration
PORT=3000
NODE_ENV=production
```

3. **Initialize Database with Sample Data**
```bash
# This will collect initial data for sample districts
npm run collect-data
```

4. **Start the Server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

5. **Access the Application**
- Open your browser and navigate to `http://localhost:3000`
- The app will automatically detect your location and display your district's MGNREGA data

## 📁 Project Structure

```
├── public/                    # Frontend static files
│   ├── index.html            # Main HTML page
│   ├── app.js               # Frontend JavaScript
│   └── styles.css           # Styling
├── server.js                 # Express server entry point
├── routes/                   # API routes
│   └── api.js               # Dashboard and data endpoints
├── models/                   # MongoDB models
│   ├── DistrictData.js      # District data schema
│   ├── Analytics.js         # User analytics schema
│   └── Cache.js             # Caching schema
├── services/                 # Business logic
│   ├── dataCollectorService.js  # Data collection from APIs
│   ├── geminiService.js     # Gemini AI integration
│   └── locationService.js    # Location detection
├── scripts/                  # Data collection scripts
│   └── dataCollector.js     # Standalone data collector
├── config/                   # Configuration files
│   └── database.js          # MongoDB connection
└── .env                      # Environment variables (not in git)
```

## 🔧 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Charts**: Chart.js 4.4.1
- **Frontend**: Vanilla JavaScript (progressive enhancement)
- **Geolocation**: Browser Geolocation API + OpenStreetMap Nominatim

## 🏗️ Architecture

### How It Works

1. **Location Detection**
   - Primary: Browser Geolocation API (most accurate)
   - Fallback: IP-based geolocation
   - Reverse geocoding via OpenStreetMap to get district name

2. **Data Collection**
   - Attempts to fetch real data from data.gov.in APIs
   - Falls back to realistic sample data if APIs are unavailable
   - Stores data in MongoDB for offline access

3. **Language Detection & Translation**
   - Uses Gemini AI to detect common languages in user's region
   - Translates explanations to regional languages
   - Stores translations for faster access

4. **Visualization**
   - Pie charts for employment status, expenditure breakdown, works progress
   - Line charts for historical trends (last 12 months)
   - Simple explanations in English + regional languages below each chart

## 📊 Data Sources

- **Primary**: Data.gov.in MGNREGA API
- **Fallback**: Generated realistic sample data
- **Geolocation**: OpenStreetMap Nominatim API (free)

## 🎯 Key Features Explained

### 1. Location-Based Detection
The app automatically detects your location when you visit. It asks for browser geolocation permission, and if granted, uses GPS coordinates for accurate district detection. Otherwise, it falls back to IP-based detection.

### 2. Multilingual Support
Using Gemini AI, the app:
- Detects the most common languages in your region
- Generates simple, easy-to-understand explanations
- Translates them to regional languages
- Displays both English and regional language versions

### 3. Simple Visualizations
- **Pie Charts**: Show proportions (e.g., how many got work vs didn't)
- **Line Charts**: Show trends over time
- Each chart has a simple explanation below in plain language

### 4. Production-Ready Features
- Rate limiting to prevent abuse
- Data caching for performance
- Error handling and fallbacks
- Responsive design for mobile devices
- Health check endpoint for monitoring

## 🚢 Deployment

### Environment Setup
1. Set all environment variables in your hosting platform
2. Ensure MongoDB Atlas allows connections from your server IP
3. Deploy using:
   - **Heroku**: Use Procfile (already included)
   - **Vercel**: Use vercel.json (already included)
   - **Docker**: Use Dockerfile (already included)

### Required Environment Variables
```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
DATA_GOV_API_KEY=your_data_gov_api_key (optional)
PORT=3000
NODE_ENV=production
```

## 🎬 Demo Video Requirements

Your 2-minute demo video should cover:
1. **How the website works** - Show the user flow from landing to viewing charts
2. **Design choices** - Explain why simple visualizations and multilingual support
3. **Database structure** - Show how district data is stored and organized
4. **Technical decisions** - Explain location detection, caching, and AI integration

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check your MongoDB Atlas IP whitelist
- Verify connection string includes database name
- Ensure network access is allowed

### Location Detection Not Working
- Grant browser geolocation permissions
- Check browser console for errors
- Fallback to IP detection will work automatically

### Gemini API Errors
- Verify API key is correct
- Check API quota/limits
- Translations will fallback to English if API fails

## 📝 License

MIT License - Feel free to use and modify for your needs!

## 🤝 Contributing

This is a competition submission. For improvements, please:
1. Fork the repository
2. Make your changes
3. Submit a pull request

---

**Built with ❤️ for rural empowerment and transparent governance**

