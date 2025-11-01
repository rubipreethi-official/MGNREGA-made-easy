const axios = require('axios');

class LocationService {
  constructor() {
    this.ipstackApiKey = process.env.IPSTACK_API_KEY || '';
    this.freegeoipUrl = 'https://ipapi.co/json/';
  }

  /**
   * Get location from coordinates (from browser geolocation)
   * Uses reverse geocoding to get district and state
   */
  async getLocationFromCoordinates(lat, lon) {
    try {
      console.log(`📍 Getting location from coordinates: ${lat}, ${lon}`);

      // Use OpenStreetMap Nominatim API (free, no key required)
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: {
          lat: lat,
          lon: lon,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'MGNREGA-Made-Easy/1.0'
        },
        timeout: 5000
      });

      if (response.data && response.data.address) {
        const addr = response.data.address;
        const location = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          city: addr.city || addr.town || addr.village || 'Unknown',
          district: addr.city_district || addr.county || addr.district || addr.city || 'Unknown',
          state: this.mapStateName(addr.state || 'Unknown'),
          stateCode: addr.state_code || '',
          country: addr.country || 'India',
          countryCode: addr.country_code ? addr.country_code.toUpperCase() : 'IN'
        };

        console.log(`✅ Location detected from coordinates: ${location.district}, ${location.state}`);
        return location;
      }

      throw new Error('Invalid response from geocoding service');
    } catch (error) {
      console.error('❌ Error getting location from coordinates:', error.message);
      // Fallback to IP-based detection
      return this.getDefaultLocation();
    }
  }

  /**
   * Get location from IP address using free IP geolocation service
   */
  async getLocationFromIP(ip) {
    try {
      console.log(`📍 Detecting location for IP: ${ip}`);

      // Use ipapi.co (free tier)
      const response = await axios.get(this.freegeoipUrl + ip);
      
      if (response.data.error) {
        throw new Error('Failed to get location');
      }

      const location = {
        latitude: response.data.latitude || 0,
        longitude: response.data.longitude || 0,
        city: response.data.city || 'Unknown',
        district: response.data.district || response.data.city || 'Unknown',
        state: this.mapStateName(response.data.region || 'Unknown'),
        stateCode: response.data.region_code || '',
        country: response.data.country_name || 'India',
        countryCode: response.data.country_code || 'IN'
      };

      console.log(`✅ Location detected: ${location.district}, ${location.state}`);
      return location;
    } catch (error) {
      console.error('❌ Error detecting location:', error.message);
      // Return default location (New Delhi) if detection fails
      return this.getDefaultLocation();
    }
  }

  /**
   * Get default location (New Delhi)
   */
  getDefaultLocation() {
    return {
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      district: 'New Delhi',
      state: 'Delhi',
      stateCode: 'DL',
      country: 'India',
      countryCode: 'IN'
    };
  }

  /**
   * Get primary language for state (for translation service)
   */
  getPrimaryLanguage(stateName) {
    const stateLanguageMap = {
      'Tamil Nadu': 'Tamil',
      'Maharashtra': 'Marathi',
      'Karnataka': 'Kannada',
      'Gujarat': 'Gujarati',
      'West Bengal': 'Bengali',
      'Andhra Pradesh': 'Telugu',
      'Telangana': 'Telugu',
      'Kerala': 'Malayalam',
      'Punjab': 'Punjabi',
      'Odisha': 'Odia',
      'Assam': 'Assamese'
    };

    return stateLanguageMap[stateName] || 'Hindi';
  }

  /**
   * Map state names to standardized format
   */
  mapStateName(stateName) {
    const stateMap = {
      'Andaman and Nicobar Islands': 'Andaman and Nicobar Islands',
      'Andhra Pradesh': 'Andhra Pradesh',
      'Arunachal Pradesh': 'Arunachal Pradesh',
      'Assam': 'Assam',
      'Bihar': 'Bihar',
      'Chandigarh': 'Chandigarh',
      'Chhattisgarh': 'Chhattisgarh',
      'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli',
      'Daman and Diu': 'Daman and Diu',
      'Delhi': 'Delhi',
      'Goa': 'Goa',
      'Gujarat': 'Gujarat',
      'Haryana': 'Haryana',
      'Himachal Pradesh': 'Himachal Pradesh',
      'Jammu and Kashmir': 'Jammu and Kashmir',
      'Jharkhand': 'Jharkhand',
      'Karnataka': 'Karnataka',
      'Kerala': 'Kerala',
      'Ladakh': 'Ladakh',
      'Lakshadweep': 'Lakshadweep',
      'Madhya Pradesh': 'Madhya Pradesh',
      'Maharashtra': 'Maharashtra',
      'Manipur': 'Manipur',
      'Meghalaya': 'Meghalaya',
      'Mizoram': 'Mizoram',
      'Nagaland': 'Nagaland',
      'Odisha': 'Odisha',
      'Puducherry': 'Puducherry',
      'Punjab': 'Punjab',
      'Rajasthan': 'Rajasthan',
      'Sikkim': 'Sikkim',
      'Tamil Nadu': 'Tamil Nadu',
      'Telangana': 'Telangana',
      'Tripura': 'Tripura',
      'Uttar Pradesh': 'Uttar Pradesh',
      'Uttarakhand': 'Uttarakhand',
      'West Bengal': 'West Bengal'
    };

    return stateMap[stateName] || stateName;
  }

  /**
   * Get client IP from request
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           '127.0.0.1';
  }
}

module.exports = new LocationService();

