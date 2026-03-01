// ==================== PLANT HEALTH CHECK MODULE ====================

const HealthCheckManager = (function() {
  // Current state
  let currentPlantId = null;
  let currentPlantName = null;
  let currentPhotoData = null;
  let currentHealthResult = null;
  
  // DOM Elements
  const healthScreen = document.getElementById('health-screen');
  const healthBackBtn = document.getElementById('health-back-btn');
  const healthPlantName = document.getElementById('health-plant-name');
  const healthCaptureSection = document.getElementById('health-capture-section');
  const healthCameraBtn = document.getElementById('health-camera-btn');
  const healthCameraInput = document.getElementById('health-camera-input');
  const healthLoading = document.getElementById('health-loading');
  const healthResults = document.getElementById('health-results');
  
  // Initialize
  function init() {
    setupEventListeners();
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Back button
    if (healthBackBtn) {
      healthBackBtn.addEventListener('click', closeHealthScreen);
    }
    
    // Camera button
    if (healthCameraBtn) {
      healthCameraBtn.addEventListener('click', () => {
        healthCameraInput?.click();
      });
    }
    
    // Camera input change
    if (healthCameraInput) {
      healthCameraInput.addEventListener('change', handlePhotoCapture);
    }
  }
  
  // Open health check screen
  function openHealthCheck(plantId, plantName) {
    currentPlantId = plantId;
    currentPlantName = plantName;
    currentPhotoData = null;
    currentHealthResult = null;
    
    if (healthPlantName) {
      healthPlantName.textContent = plantName || 'Health Check';
    }
    
    // Reset to capture state
    showCaptureState();
    
    if (healthScreen) {
      healthScreen.style.display = 'block';
      healthScreen.style.opacity = '0';
      requestAnimationFrame(() => {
        healthScreen.style.opacity = '1';
      });
      
      if (window.NavigationManager) {
        NavigationManager.pushScreen('health-screen');
      }
    }
  }
  
  // Close health check screen
  function closeHealthScreen() {
    if (healthScreen) {
      healthScreen.style.opacity = '0';
      setTimeout(() => {
        healthScreen.style.display = 'none';
      }, 300);
    }
  }
  
  // Show capture state
  function showCaptureState() {
    if (healthCaptureSection) healthCaptureSection.style.display = 'flex';
    if (healthLoading) healthLoading.style.display = 'none';
    if (healthResults) healthResults.style.display = 'none';
  }
  
  // Show loading state
  function showLoadingState() {
    if (healthCaptureSection) healthCaptureSection.style.display = 'none';
    if (healthLoading) healthLoading.style.display = 'flex';
    if (healthResults) healthResults.style.display = 'none';
  }
  
  // Show results state
  function showResultsState() {
    if (healthCaptureSection) healthCaptureSection.style.display = 'none';
    if (healthLoading) healthLoading.style.display = 'none';
    if (healthResults) healthResults.style.display = 'flex';
  }
  
  // Handle photo capture
  async function handlePhotoCapture(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Read the file
    const reader = new FileReader();
    reader.onload = async (event) => {
      currentPhotoData = event.target.result;
      
      // Show loading
      showLoadingState();
      
      try {
        // Call health assessment API
        const result = await performHealthAssessment(currentPhotoData);
        currentHealthResult = result;
        
        // Display results
        displayHealthResults(result);
        showResultsState();
      } catch (error) {
        console.error('Health assessment failed:', error);
        alert('Failed to analyze plant health. Please try again.');
        showCaptureState();
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input for next use
    e.target.value = '';
  }
  
  // Perform health assessment API call
  async function performHealthAssessment(imageBase64) {
    // Extract base64 data (remove data URL prefix)
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    const response = await fetch('/api/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'health',
        images: [base64Data]
      })
    });
    
    if (!response.ok) {
      throw new Error('Health assessment request failed');
    }
    
    const data = await response.json();
    return parseHealthResult(data);
  }
  
  // Parse health assessment result
  function parseHealthResult(data) {
    const result = {
      isHealthy: true,
      healthProbability: 1,
      issues: []
    };
    
    // Check if healthy
    if (data.result && data.result.is_healthy !== undefined) {
      result.isHealthy = data.result.is_healthy.binary;
      result.healthProbability = data.result.is_healthy.probability;
    }
    
    // Parse disease suggestions
    if (data.result && data.result.disease && data.result.disease.suggestions) {
      result.issues = data.result.disease.suggestions.map(suggestion => ({
        name: suggestion.name || 'Unknown Issue',
        probability: suggestion.probability || 0,
        description: suggestion.details?.description || 'No description available.',
        treatment: suggestion.details?.treatment?.biological?.join(' ') || 
                   suggestion.details?.treatment?.chemical?.join(' ') ||
                   suggestion.details?.treatment?.prevention?.join(' ') ||
                   'Consult a plant specialist for treatment options.',
        cause: suggestion.details?.cause || null
      }));
    }
    
    return result;
  }
  
  // Display health results
  function displayHealthResults(result) {
    if (!healthResults) return;
    
    const isHealthy = result.isHealthy;
    const healthPercent = Math.round(result.healthProbability * 100);
    
    let html = `
      <div class="health-status">
        <div class="health-status-icon ${isHealthy ? 'healthy' : 'unhealthy'}">
          ${isHealthy ? '✓' : '!'}
        </div>
        <div class="health-status-text">
          <h3 class="dm-xtra">${isHealthy ? 'Plant Looks Healthy!' : 'Health Issues Detected'}</h3>
          <p class="dm-light">${healthPercent}% confidence</p>
        </div>
      </div>
    `;
    
    // Show issues if any
    if (result.issues && result.issues.length > 0) {
      html += `<h3 class="dm-reg" style="color: var(--color-cream); margin: 20px 0 10px;">Possible Issues</h3>`;
      
      result.issues.forEach((issue, index) => {
        const probability = Math.round(issue.probability * 100);
        html += `
          <div class="health-issue-card">
            <div class="health-issue-header" onclick="this.parentElement.classList.toggle('expanded')">
              <span class="health-issue-name dm-reg">${issue.name}</span>
              <span class="health-issue-probability dm-light">${probability}%</span>
            </div>
            <div class="health-issue-details" style="display: none;">
              <h4 class="dm-reg">Description</h4>
              <p class="dm-light">${issue.description}</p>
              ${issue.cause ? `
                <h4 class="dm-reg">Cause</h4>
                <p class="dm-light">${issue.cause}</p>
              ` : ''}
              <h4 class="dm-reg">Treatment</h4>
              <p class="dm-light">${issue.treatment}</p>
            </div>
          </div>
        `;
      });
    }
    
    // Action buttons
    html += `
      <div class="health-action-buttons">
        <button class="health-new-check-btn dm-reg" onclick="HealthCheckManager.newCheck()">New Check</button>
        <button class="health-save-btn dm-reg" onclick="HealthCheckManager.saveToJournal()">Save to Journal</button>
      </div>
    `;
    
    healthResults.innerHTML = html;
    
    // Add click handlers for expandable issue cards
    const issueHeaders = healthResults.querySelectorAll('.health-issue-header');
    issueHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const details = header.nextElementSibling;
        if (details) {
          details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
  }
  
  // Start a new check
  function newCheck() {
    currentPhotoData = null;
    currentHealthResult = null;
    showCaptureState();
  }
  
  // Save health check to journal
  function saveToJournal() {
    if (!currentPlantId || !currentHealthResult) return;
    
    if (window.JournalManager) {
      JournalManager.addHealthCheckEntry(
        currentPlantId, 
        currentHealthResult, 
        currentPhotoData
      );
      
      alert('Health check saved to journal!');
      closeHealthScreen();
    }
  }
  
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Public API
  return {
    openHealthCheck,
    closeHealthScreen,
    newCheck,
    saveToJournal
  };
})();

// Export for global access
window.HealthCheckManager = HealthCheckManager;
