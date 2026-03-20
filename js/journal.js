// ==================== PLANT JOURNAL MODULE ====================

const JournalManager = (function() {
  // Store journal entries per plant
  let journalEntries = {};
  
  // Current plant being viewed
  let currentPlantId = null;
  let currentPhotoData = null;
  let selectedTags = [];
  
  // Edit mode state
  let editingEntryId = null;
  let isEditMode = false;
  
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
      // Use proper slide transition from plant-info screen
      const plantInfoScreen = document.getElementById('plant-info');
      
      if (window.TransitionManager && plantInfoScreen) {
        TransitionManager.slideTransition(plantInfoScreen, journalScreen, 'forward');
      } else {
        journalScreen.style.display = 'block';
        journalScreen.style.opacity = '0';
        requestAnimationFrame(() => {
          journalScreen.style.transition = 'opacity 0.3s ease';
          journalScreen.style.opacity = '1';
        });
      }
      
      if (window.NavigationManager) {
        NavigationManager.pushScreen('journal-screen');
      }
    }
  }
  
  // Close journal screen
  function closeJournalScreen() {
    if (journalScreen) {
      const plantInfoScreen = document.getElementById('plant-info');
      
      if (window.TransitionManager && plantInfoScreen) {
        TransitionManager.slideTransition(journalScreen, plantInfoScreen, 'back');
      } else {
        journalScreen.style.transition = 'opacity 0.3s ease';
        journalScreen.style.opacity = '0';
        setTimeout(() => {
          journalScreen.style.display = 'none';
          journalScreen.style.transition = '';
        }, 300);
      }
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
    
    journalEntriesContainer.innerHTML = sortedEntries.map((entry) => `
      <div class="journal-entry" data-entry-id="${entry.id}">
        <div class="journal-entry-header">
          <span class="journal-entry-date dm-reg">${formatDate(entry.date)}</span>
          <div class="journal-entry-actions">
            <button class="journal-edit-btn" data-entry-id="${entry.id}" aria-label="Edit entry" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="journal-delete-btn" data-entry-id="${entry.id}" aria-label="Delete entry" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        ${entry.tags && entry.tags.length > 0 ? `
          <div class="journal-entry-tags">
            ${entry.tags.map(tag => `<span class="journal-entry-tag dm-light">${tag}</span>`).join('')}
          </div>
        ` : ''}
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
    
    // Add event listeners for edit and delete buttons
    attachEntryEventListeners();
  }
  
  // Attach event listeners to entry action buttons
  function attachEntryEventListeners() {
    // Edit buttons
    document.querySelectorAll('.journal-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entryId = btn.dataset.entryId;
        openEditEntrySheet(entryId);
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.journal-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const entryId = btn.dataset.entryId;
        confirmDeleteEntry(entryId);
      });
    });
  }
  
  // Open edit entry sheet with populated data
  function openEditEntrySheet(entryId) {
    if (!currentPlantId) return;
    
    const entries = journalEntries[currentPlantId] || [];
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) return;
    
    isEditMode = true;
    editingEntryId = entryId;
    
    // Update header text
    const headerTitle = addJournalCard.querySelector('.add-journal-header h2');
    if (headerTitle) {
      headerTitle.textContent = 'Edit Entry';
    }
    
    // Populate form with entry data
    if (journalEntryDate) {
      journalEntryDate.value = entry.date;
    }
    
    if (journalEntryNote) {
      journalEntryNote.value = entry.note || '';
    }
    
    // Set photo if exists
    if (entry.photo) {
      currentPhotoData = entry.photo;
      if (journalPhotoPreview) {
        journalPhotoPreview.innerHTML = `<img src="${entry.photo}" alt="Entry photo">`;
      }
    }
    
    // Set selected tags
    selectedTags = entry.tags ? [...entry.tags] : [];
    journalTags.forEach(tag => {
      const tagValue = tag.dataset.tag;
      if (selectedTags.includes(tagValue)) {
        tag.classList.add('selected');
      } else {
        tag.classList.remove('selected');
      }
    });
    
    // Open sheet
    if (window.TransitionManager) {
      TransitionManager.bottomSheetOpen(addJournalCard);
    } else if (addJournalCard) {
      addJournalCard.style.display = 'grid';
      addJournalCard.style.opacity = '1';
    }
  }
  
  // Confirm and delete entry
  function confirmDeleteEntry(entryId) {
    if (confirm('Delete this journal entry? This cannot be undone.')) {
      deleteEntry(entryId);
    }
  }
  
  // Delete a journal entry
  function deleteEntry(entryId) {
    if (!currentPlantId) return;
    
    const entries = journalEntries[currentPlantId] || [];
    const entryIndex = entries.findIndex(e => e.id === entryId);
    
    if (entryIndex === -1) return;
    
    // Remove the entry
    entries.splice(entryIndex, 1);
    journalEntries[currentPlantId] = entries;
    saveJournalEntries();
    
    // Update plant's display photo to latest entry's photo
    updatePlantPhotoToLatest();
    
    // Re-render entries immediately
    renderEntries();

    // force repaint (mobile Safari hack)
    requestAnimationFrame(() => {
      journalEntriesContainer.style.transform = 'translateZ(0)';
    });
  }
  
  // Update plant photo to the latest journal entry's photo
  function updatePlantPhotoToLatest() {
    if (!currentPlantId) return;
    
    const latestPhoto = getLatestPhoto(currentPlantId);
    
    // Get saved plants from localStorage
    const savedPlantsStr = localStorage.getItem('savedPlants');
    if (!savedPlantsStr) return;
    
    const savedPlants = JSON.parse(savedPlantsStr);
    const plantIndex = savedPlants.findIndex(p => p.id === currentPlantId);
    
    if (plantIndex !== -1) {
      if (latestPhoto) {
        savedPlants[plantIndex].latestPhoto = latestPhoto;
      } else {
        // No journal photos left, remove latestPhoto (revert to original)
        delete savedPlants[plantIndex].latestPhoto;
      }
      localStorage.setItem('savedPlants', JSON.stringify(savedPlants));
      
      // Dispatch event to refresh plant displays
      window.dispatchEvent(new CustomEvent('plant-photo-updated', { 
        detail: { plantId: currentPlantId, photoData: latestPhoto } 
      }));
    }
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
    isEditMode = false;
    editingEntryId = null;
    
    // Update header text for new entry
    const headerTitle = addJournalCard.querySelector('.add-journal-header h2');
    if (headerTitle) {
      headerTitle.textContent = 'New Entry';
    }
    
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
    isEditMode = false;
    editingEntryId = null;
    
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
    isEditMode = false;
    editingEntryId = null;
    
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
    
    if (journalEntryDate) {
      journalEntryDate.value = '';
    }
    
    journalTags.forEach(tag => tag.classList.remove('selected'));
    
    // Reset file input
    if (journalPhotoInput) {
      journalPhotoInput.value = '';
    }
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
  
  // Save journal entry (handles both new and edit)
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
    
    if (isEditMode && editingEntryId) {
      // Update existing entry
      const entryIndex = journalEntries[currentPlantId].findIndex(e => e.id === editingEntryId);
      
      if (entryIndex !== -1) {
        journalEntries[currentPlantId][entryIndex] = {
          ...journalEntries[currentPlantId][entryIndex],
          date: date,
          photo: currentPhotoData,
          note: note,
          tags: [...selectedTags],
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // Create new entry
      const entry = {
        id: Date.now().toString(),
        date: date,
        photo: currentPhotoData,
        note: note,
        tags: [...selectedTags],
        createdAt: new Date().toISOString()
      };
      
      journalEntries[currentPlantId].push(entry);
    }
    
    saveJournalEntries();
    
    // Update plant's display photo to the latest dated entry with a photo
    updatePlantPhotoToLatest();
    
    // Close sheet first, then render after animation completes
    resetEntryForm();
    renderEntries();

    // Then just animate
    if (window.TransitionManager) {
      TransitionManager.bottomSheetClose(addJournalCard);
    } else if (addJournalCard) {
      addJournalCard.style.display = 'none';
    }
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
