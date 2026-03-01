// ==================== PLANT JOURNAL MODULE ====================

const JournalManager = (function() {
  // Store journal entries per plant
  let journalEntries = {};
  
  // Current plant being viewed
  let currentPlantId = null;
  let currentPhotoData = null;
  let selectedTags = [];
  
  // DOM Elements
  const journalScreen = document.getElementById('journal-screen');
  const journalBackBtn = document.getElementById('journal-back-btn');
  const journalPlantName = document.getElementById('journal-plant-name');
  const journalEntriesContainer = document.getElementById('journal-entries');
  const addJournalEntryBtn = document.getElementById('add-journal-entry-btn');
  
  const addJournalCard = document.getElementById('add-journal-card');
  const journalEntryCloseBtn = document.getElementById('journal-entry-close-btn');
  const saveJournalEntryBtn = document.getElementById('save-journal-entry-btn');
  const journalPhotoPreview = document.getElementById('journal-photo-preview');
  const journalPhotoInput = document.getElementById('journal-photo-input');
  const journalEntryDate = document.getElementById('journal-entry-date');
  const journalEntryNote = document.getElementById('journal-entry-note');
  const journalTags = document.querySelectorAll('.journal-tag');
  
  // Initialize
  function init() {
    loadJournalEntries();
    setupEventListeners();
  }
  
  // Load journal entries from localStorage
  function loadJournalEntries() {
    const saved = localStorage.getItem('journalEntries');
    if (saved) {
      journalEntries = JSON.parse(saved);
    }
  }
  
  // Save journal entries to localStorage
  function saveJournalEntries() {
    localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Back button
    if (journalBackBtn) {
      journalBackBtn.addEventListener('click', closeJournalScreen);
    }
    
    // Add entry button
    if (addJournalEntryBtn) {
      addJournalEntryBtn.addEventListener('click', openAddEntrySheet);
    }
    
    // Close entry sheet
    if (journalEntryCloseBtn) {
      journalEntryCloseBtn.addEventListener('click', closeAddEntrySheet);
    }
    
    // Save entry
    if (saveJournalEntryBtn) {
      saveJournalEntryBtn.addEventListener('click', saveEntry);
    }
    
    // Photo selection
    if (journalPhotoPreview) {
      journalPhotoPreview.addEventListener('click', () => {
        journalPhotoInput?.click();
      });
    }
    
    if (journalPhotoInput) {
      journalPhotoInput.addEventListener('change', handlePhotoSelect);
    }
    
    // Tag selection
    journalTags.forEach(tag => {
      tag.addEventListener('click', () => {
        tag.classList.toggle('selected');
        const tagValue = tag.dataset.tag;
        if (tag.classList.contains('selected')) {
          selectedTags.push(tagValue);
        } else {
          selectedTags = selectedTags.filter(t => t !== tagValue);
        }
      });
    });
  }
  
  // Open journal screen for a plant
  function openJournal(plantId, plantName) {
    currentPlantId = plantId;
    
    if (journalPlantName) {
      journalPlantName.textContent = plantName || 'Journal';
    }
    
    renderEntries();
    
    if (journalScreen) {
      journalScreen.style.display = 'block';
      journalScreen.style.opacity = '0';
      requestAnimationFrame(() => {
        journalScreen.style.opacity = '1';
      });
      
      if (window.NavigationManager) {
        NavigationManager.pushScreen('journal-screen');
      }
    }
  }
  
  // Close journal screen
  function closeJournalScreen() {
    if (journalScreen) {
      journalScreen.style.opacity = '0';
      setTimeout(() => {
        journalScreen.style.display = 'none';
      }, 300);
    }
  }
  
  // Render journal entries
  function renderEntries() {
    if (!journalEntriesContainer || !currentPlantId) return;
    
    const entries = journalEntries[currentPlantId] || [];
    
    if (entries.length === 0) {
      journalEntriesContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--color-muted);">
          <p class="dm-light">No journal entries yet.</p>
          <p class="dm-light" style="font-size: 13px;">Tap "Add Entry" to start tracking your plant's growth.</p>
        </div>
      `;
      return;
    }
    
    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    journalEntriesContainer.innerHTML = sortedEntries.map((entry, index) => `
      <div class="journal-entry" data-entry-index="${index}">
        <div class="journal-entry-header">
          <span class="journal-entry-date dm-reg">${formatDate(entry.date)}</span>
          ${entry.tags && entry.tags.length > 0 ? `
            <div class="journal-entry-tags">
              ${entry.tags.map(tag => `<span class="journal-entry-tag dm-light">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        ${entry.photo ? `<img src="${entry.photo}" alt="Journal photo" class="journal-entry-image">` : ''}
        ${entry.note ? `<p class="journal-entry-note dm-light">${entry.note}</p>` : ''}
        ${entry.healthCheck ? `
          <div style="background: var(--color-bg); padding: 10px; border-radius: 6px; margin-top: 5px;">
            <span class="dm-reg" style="color: ${entry.healthCheck.isHealthy ? 'var(--color-green)' : 'rgb(184, 23, 76)'}; font-size: 13px;">
              ${entry.healthCheck.isHealthy ? 'Healthy' : 'Health Issue Detected'}
            </span>
          </div>
        ` : ''}
      </div>
    `).join('');
  }
  
  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }
  
  // Open add entry sheet
  function openAddEntrySheet() {
    resetEntryForm();
    
    // Set default date to today
    if (journalEntryDate) {
      journalEntryDate.value = new Date().toISOString().split('T')[0];
    }
    
    if (window.TransitionManager) {
      TransitionManager.bottomSheetOpen(addJournalCard);
    } else if (addJournalCard) {
      addJournalCard.style.display = 'block';
      addJournalCard.style.opacity = '1';
    }
  }
  
  // Close add entry sheet
  function closeAddEntrySheet() {
    if (window.TransitionManager) {
      TransitionManager.bottomSheetClose(addJournalCard, resetEntryForm);
    } else if (addJournalCard) {
      addJournalCard.style.display = 'none';
      resetEntryForm();
    }
  }
  
  // Reset entry form
  function resetEntryForm() {
    currentPhotoData = null;
    selectedTags = [];
    
    if (journalPhotoPreview) {
      journalPhotoPreview.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="dm-light">Add Photo</span>
      `;
    }
    
    if (journalEntryNote) {
      journalEntryNote.value = '';
    }
    
    journalTags.forEach(tag => tag.classList.remove('selected'));
  }
  
  // Handle photo selection
  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      currentPhotoData = event.target.result;
      
      if (journalPhotoPreview) {
        journalPhotoPreview.innerHTML = `<img src="${currentPhotoData}" alt="Selected photo">`;
      }
    };
    reader.readAsDataURL(file);
  }
  
  // Save journal entry
  function saveEntry() {
    if (!currentPlantId) return;
    
    const date = journalEntryDate?.value || new Date().toISOString().split('T')[0];
    const note = journalEntryNote?.value?.trim() || '';
    
    // Require at least a photo or note
    if (!currentPhotoData && !note) {
      alert('Please add a photo or note for your journal entry.');
      return;
    }
    
    // Initialize entries array for this plant if needed
    if (!journalEntries[currentPlantId]) {
      journalEntries[currentPlantId] = [];
    }
    
    // Create entry
    const entry = {
      id: Date.now().toString(),
      date: date,
      photo: currentPhotoData,
      note: note,
      tags: [...selectedTags],
      createdAt: new Date().toISOString()
    };
    
    journalEntries[currentPlantId].push(entry);
    saveJournalEntries();
    
    // Update plant's display photo if this entry has a photo
    if (currentPhotoData) {
      updatePlantDisplayPhoto(currentPlantId, currentPhotoData);
    }
    
    // Close sheet and refresh
    closeAddEntrySheet();
    renderEntries();
  }
  
  // Add health check entry
  function addHealthCheckEntry(plantId, healthData, photo) {
    if (!plantId) return;
    
    if (!journalEntries[plantId]) {
      journalEntries[plantId] = [];
    }
    
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      photo: photo,
      note: healthData.isHealthy 
        ? 'Health check: Plant appears healthy!' 
        : `Health check: ${healthData.issues?.map(i => i.name).join(', ') || 'Issue detected'}`,
      tags: ['health check'],
      healthCheck: healthData,
      createdAt: new Date().toISOString()
    };
    
    journalEntries[plantId].push(entry);
    saveJournalEntries();
    
    // Update plant's display photo
    if (photo) {
      updatePlantDisplayPhoto(plantId, photo);
    }
  }
  
  // Update plant's display photo to latest journal photo
  function updatePlantDisplayPhoto(plantId, photoData) {
    // Get saved plants from localStorage
    const savedPlantsStr = localStorage.getItem('savedPlants');
    if (!savedPlantsStr) return;
    
    const savedPlants = JSON.parse(savedPlantsStr);
    const plantIndex = savedPlants.findIndex(p => p.id === plantId);
    
    if (plantIndex !== -1) {
      savedPlants[plantIndex].latestPhoto = photoData;
      localStorage.setItem('savedPlants', JSON.stringify(savedPlants));
      
      // Dispatch event to refresh plant displays
      window.dispatchEvent(new CustomEvent('plant-photo-updated', { 
        detail: { plantId, photoData } 
      }));
    }
  }
  
  // Get latest photo for a plant
  function getLatestPhoto(plantId) {
    const entries = journalEntries[plantId] || [];
    const entriesWithPhotos = entries.filter(e => e.photo);
    
    if (entriesWithPhotos.length === 0) return null;
    
    // Sort by date and get most recent
    entriesWithPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
    return entriesWithPhotos[0].photo;
  }
  
  // Get entries for a plant
  function getEntries(plantId) {
    return journalEntries[plantId] || [];
  }
  
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Public API
  return {
    openJournal,
    closeJournalScreen,
    addHealthCheckEntry,
    getLatestPhoto,
    getEntries
  };
})();

// Export for global access
window.JournalManager = JournalManager;
