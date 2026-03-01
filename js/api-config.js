// ==================== PLANT.ID API CONFIGURATION ====================
// This file handles API key management for client-side API calls
// 
// IMPORTANT: Replace 'YOUR_PLANT_ID_API_KEY_HERE' with your actual Plant.id API key
// Get your key at: https://web.plant.id/
//
// The key is base64 encoded to avoid plain text in source (light obfuscation)

const PlantAPI = (function() {
  // Base64 encoded API key - to update:
  // 1. Get your API key from https://web.plant.id/
  // 2. In browser console run: btoa('your-api-key-here')
  // 3. Paste the result below
  const _encodedKey = 'WU9VUl9QTEFOVF9JRF9BUElfS0VZX0hFUkU='; // <-- REPLACE THIS
  
  function _dk() {
    try {
      const key = atob(_encodedKey);
      // Check if key was replaced
      if (key === 'YOUR_PLANT_ID_API_KEY_HERE') {
        console.error('[Canopy] API key not configured! Edit js/api-config.js');
        return null;
      }
      return key;
    } catch(e) {
      console.error('[Canopy] API configuration error:', e);
      return null;
    }
  }
  
  const BASE_URL = 'https://plant.id/api/v3';
  
  // Generic API request handler
  async function request(endpoint, body) {
    const key = _dk();
    if (!key) {
      throw new Error('API key not configured');
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': key
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }
    
    return response.json();
  }
  
  // Identify plant from image
  async function identify(base64Image) {
    return request('/identification', {
      images: [base64Image],
      similar_images: true,
      classification_level: 'species'
    });
  }
  
  // Get care instructions via conversation endpoint
  async function getConversation(accessToken, question, prompt, temperature = 0.5) {
    const key = _dk();
    if (!key) {
      throw new Error('API key not configured');
    }
    
    const response = await fetch(`${BASE_URL}/identification/${accessToken}/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': key
      },
      body: JSON.stringify({
        question,
        prompt,
        temperature,
        app_name: 'CanopyApp'
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }
    
    return response.json();
  }
  
  // Health assessment
  async function healthAssessment(base64Image) {
    return request('/health_assessment', {
      images: [base64Image],
      similar_images: true
    });
  }
  
  return {
    identify,
    getConversation,
    healthAssessment
  };
})();
