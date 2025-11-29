const axios = require('axios');


class TranslationService {
  constructor() {

    this.baseUrl = 'https://api.mymemory.translated.net/get';
  }


  detectRegionalLanguages(stateName) {
   
    const normalizedState = stateName ? stateName.trim() : '';
    
    const stateLanguageMap = {
      'Andhra Pradesh': ['Telugu', 'English'],
      'Arunachal Pradesh': ['English', 'Hindi'],
      'Assam': ['Assamese', 'English'],
      'Bihar': ['Hindi', 'English'],
      'Chhattisgarh': ['Hindi', 'English'],
      'Goa': ['Konkani', 'Marathi', 'English'],
      'Gujarat': ['Gujarati', 'English'],
      'Haryana': ['Hindi', 'English'],
      'Himachal Pradesh': ['Hindi', 'English'],
      'Jharkhand': ['Hindi', 'English'],
      'Karnataka': ['Kannada', 'English'],
      'Kerala': ['Malayalam', 'English'],
      'Madhya Pradesh': ['Hindi', 'English'],
      'Maharashtra': ['Marathi', 'English'],
      'Manipur': ['Manipuri', 'English'],
      'Meghalaya': ['English', 'Khasi'],
      'Mizoram': ['Mizo', 'English'],
      'Nagaland': ['English'],
      'Odisha': ['Odia', 'English'],
      'Punjab': ['Punjabi', 'English'],
      'Rajasthan': ['Hindi', 'English'],
      'Sikkim': ['Nepali', 'English'],
      'Tamil Nadu': ['Tamil', 'English'],
      'Tamilnadu': ['Tamil', 'English'], 
      'Tamil nadu': ['Tamil', 'English'], 
      'TAMIL NADU': ['Tamil', 'English'], 
      'Telangana': ['Telugu', 'English'],
      'Tripura': ['Bengali', 'English'],
      'Uttar Pradesh': ['Hindi', 'English'],
      'Uttarakhand': ['Hindi', 'English'],
      'West Bengal': ['Bengali', 'English'],
      'Delhi': ['Hindi', 'English'],
      'Jammu and Kashmir': ['Urdu', 'Hindi', 'English'],
      'Ladakh': ['Ladakhi', 'English']
    };

    
    let languages = stateLanguageMap[normalizedState];
    
    
    if (!languages) {
      const stateKey = Object.keys(stateLanguageMap).find(
        key => key.toLowerCase() === normalizedState.toLowerCase()
      );
      if (stateKey) {
        languages = stateLanguageMap[stateKey];
      }
    }
    
    
    if (!languages && normalizedState.length > 0) {
      const stateKey = Object.keys(stateLanguageMap).find(
        key => key.toLowerCase().includes(normalizedState.toLowerCase()) || 
               normalizedState.toLowerCase().includes(key.toLowerCase())
      );
      if (stateKey) {
        languages = stateLanguageMap[stateKey];
      }
    }
    
    
    if (!languages) {
      console.warn(`⚠️ State "${stateName}" not found in language map, defaulting to Hindi + English`);
      languages = ['Hindi', 'English'];
    }
    
    console.log(`🌍 Detected languages for "${stateName}" (normalized: "${normalizedState}"):`, languages);
    return languages;
  }

 
  async translateToLanguage(text, targetLanguage) {
    try {
      
      const languageCode = this.getLanguageCode(targetLanguage);
      
      if (!languageCode) {
        console.warn(`⚠️ Language code not found for ${targetLanguage}, returning original text`);
        return text;
      }

      
      if (languageCode === 'en' || !text || text.trim().length === 0) {
        return text;
      }

      
      const response = await axios.get(this.baseUrl, {
        params: {
          q: text,
          langpair: `en|${languageCode}`
        },
        timeout: 15000
      });

      if (response.data && response.data.responseData && response.data.responseData.translatedText) {
        const translated = response.data.responseData.translatedText.trim();
        
        const cleaned = translated
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        
        console.log(` Translated to ${targetLanguage} (${languageCode}): "${text.substring(0, 30)}..." -> "${cleaned.substring(0, 30)}..."`);
        return cleaned;
      }

      return text;
    } catch (error) {
      console.error(` Error translating to ${targetLanguage}:`, error.message);
      
      return text;
    }
  }
  async translateMultiple(texts, targetLanguage) {
    try {
      const translations = await Promise.all(
        texts.map(text => this.translateToLanguage(text, targetLanguage))
      );
      return translations;
    } catch (error) {
      console.error(' Error in batch translation:', error.message);
      return texts; 
    }
  }


  generateExplanation(visualizationType, data) {
    if (visualizationType === 'employment') {
      const rate = data.employmentRate || 0;
      const demanded = data.personsDemanded || 0;
      const employed = data.personsEmployed || 0;
      
      if (rate >= 80) {
        return `Great news! Out of ${demanded.toLocaleString()} people who asked for work, ${employed.toLocaleString()} people got jobs. That's ${rate}% - which is very good! Your district is doing well in providing employment.`;
      } else if (rate >= 60) {
        return `Out of ${demanded.toLocaleString()} people who asked for work, ${employed.toLocaleString()} people got jobs. That's ${rate}%. There's room for improvement, but many people are getting work.`;
      } else {
        return `Out of ${demanded.toLocaleString()} people who asked for work, ${employed.toLocaleString()} people got jobs. That's ${rate}%. More work opportunities are needed in your district.`;
      }
    } else if (visualizationType === 'expenditure') {
      const total = data.totalExpenditure || 0;
      const wages = data.wagesPaid || 0;
      const material = data.materialExpenditure || 0;
      
      const totalCr = (total / 10000000).toFixed(2);
      const wagesPercent = total > 0 ? ((wages / total) * 100).toFixed(1) : 0;
      
      return `Your district spent ₹${totalCr} Crores this month. Out of this, ₹${(wages / 10000000).toFixed(2)} Crores (${wagesPercent}%) went directly to workers as wages. The rest was used for buying materials and running the program.`;
    } else if (visualizationType === 'works') {
      const total = data.totalWorks || 0;
      const completed = data.completedWorks || 0;
      const inProgress = data.inProgressWorks || 0;
      
      return `There are ${total} projects happening in your district. ${completed} projects are finished, and ${inProgress} projects are still being built. These projects create jobs and improve your area.`;
    }
    
    return 'This chart shows important information about MGNREGA programs in your district.';
  }

  
  getLanguageCode(languageName) {
    const languageMap = {
      'Tamil': 'ta',
      'Hindi': 'hi',
      'Telugu': 'te',
      'Marathi': 'mr',
      'Bengali': 'bn',
      'Gujarati': 'gu',
      'Kannada': 'kn',
      'Malayalam': 'ml',
      'Punjabi': 'pa',
      'Odia': 'or',
      'Assamese': 'as',
      'Urdu': 'ur',
      'English': 'en',
      'Konkani': 'kok',
      'Nepali': 'ne',
      'Mizo': 'lus'
    };

    return languageMap[languageName] || null;
  }

  /**
   * Get language name from code
   */
  getLanguageName(languageCode) {
    const codeToName = {
      'ta': 'Tamil',
      'hi': 'Hindi',
      'te': 'Telugu',
      'mr': 'Marathi',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'pa': 'Punjabi',
      'or': 'Odia',
      'as': 'Assamese',
      'ur': 'Urdu',
      'en': 'English'
    };

    return codeToName[languageCode] || 'English';
  }
}

module.exports = new TranslationService();

