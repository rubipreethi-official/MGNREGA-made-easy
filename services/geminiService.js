const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  constructor() {
    // Use the latest stable Gemini model
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  
  async detectRegionalLanguages(lat, lon, stateName, districtName) {
    try {
      const prompt = `You are a linguistics expert for India. Based on the following location information:
      
      Latitude: ${lat}
      Longitude: ${lon}
      State: ${stateName}
      District: ${districtName}
      
      Provide a JSON array of the top 2-3 most commonly spoken languages in this region (excluding English).
      Return ONLY a JSON array like: ["Hindi", "Marathi"] or ["Telugu", "English", "Urdu"]
      
      Important: Return ONLY the JSON array, no other text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

     
      const languages = JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, '').trim());
      
      console.log(`Detected languages for ${districtName}:`, languages);
      return languages;
    } catch (error) {
      console.error('Error detecting languages:', error.message);
      
      return ['Hindi', 'English'];
    }
  }

  async translateToLanguage(text, targetLanguage) {
    try {
      const prompt = `Translate the following text to ${targetLanguage}. 
      
      Keep the tone simple and easy to understand for rural citizens with low literacy.
      Use simple words and short sentences.
      
      Text to translate: "${text}"
      
      Return ONLY the translated text, no explanations.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      
      const cleaned = translatedText
        .replace(/Translation:/g, '')
        .replace(/Translated text:/g, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      console.log(`✅ Translated to ${targetLanguage}`);
      return cleaned;
    } catch (error) {
      console.error(`❌ Error translating to ${targetLanguage}:`, error.message);
      return text; // Return original if translation fails
    }
  }

  /**
   * Generate easy-to-understand explanations of data visualizations
   */
  async generateExplanation(visualizationType, data) {
    try {
      let prompt = '';

      if (visualizationType === 'employment') {
        prompt = `Create a simple, friendly explanation (2-3 sentences) for rural citizens about employment data in their district:
        
        Persons Demanded Work: ${data.personsDemanded}
        Persons Actually Got Work: ${data.personsEmployed}
        Employment Rate: ${data.employmentRate}%
        
        Explain this in simple language that even someone with low education can understand. Be encouraging and positive.`;
      } else if (visualizationType === 'expenditure') {
        prompt = `Create a simple, friendly explanation (2-3 sentences) about where the MGNREGA money is being spent in their district:
        
        Total Money Spent: ₹${data.totalExpenditure}
        Wages Paid: ₹${data.wagesPaid}
        Material Cost: ₹${data.materialExpenditure}
        
        Explain this in simple language. Help them understand how their district's money is being used.`;
      } else if (visualizationType === 'works') {
        prompt = `Create a simple, friendly explanation (2-3 sentences) about ongoing projects in their district:
        
        Total Projects: ${data.totalWorks}
        Completed: ${data.completedWorks}
        In Progress: ${data.inProgressWorks}
        
        Explain this in simple, positive language. Make it easy to understand.`;
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const explanation = response.text().trim();

      return explanation;
    } catch (error) {
      console.error('❌ Error generating explanation:', error.message);
      return 'Data shows important information about MGNREGA programs in your district.';
    }
  }

  /**
   * Translate district name to regional languages
   */
  async translateDistrictName(districtName, stateName, languages) {
    try {
      const prompt = `Translate the district name "${districtName}" in state "${stateName}" to these languages: ${languages.join(', ')}.
      
      Return a JSON object like: {"Hindi": "जिला_नाम", "Marathi": "जिल्हा_नाव"}
      Only return the JSON object, no other text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      const translations = JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, '').trim());
      
      return Object.entries(translations).map(([language, name]) => ({
        language,
        name
      }));
    } catch (error) {
      console.error('❌ Error translating district name:', error.message);
      return languages.map(lang => ({ language: lang, name: districtName }));
    }
  }
}

module.exports = new GeminiService();

