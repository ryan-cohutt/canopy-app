// ==================== PLANT.ID API CONFIGURATION ====================
// This file handles API key management for client-side API calls
// The key is lightly obfuscated to prevent casual scraping (not truly secure)

const PlantAPI = (function() {
  // Obfuscated API key - split and encoded to avoid plain text in source
  // To update: encode your key with btoa() split into parts
  const _p1 = 'Q3NQczNIOTZq';  // Part 1
  const _p2 = 'M21NYUlZM0VF';  // Part 2
  const _p3 = 'cFBLbHhlaGZz';  // Part 3
  const _p4 = 'VnlvVHFmTE9E';  // Part 4
  const _p5 = 'bXhkbWNKT0lo';  // Part 5
  const _p6 = 'VDlRamw=';      // Part 6
  
  function _dk() {
    try {
      return atob(_p1 + _p2 + _p3 + _p4 + _p5 + _p6);
    } catch(e) {
      console.error('API configuration error');
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
