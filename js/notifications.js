// ==================== LOCAL NOTIFICATIONS SYSTEM ====================

const NotificationManager = (function() {
  const STORAGE_KEY = 'canopy_notification_settings';
  const CHECK_INTERVAL = 60000; // Check every minute
  
  let settings = {
    enabled: false,
    mode: 'exact', // 'exact' or 'digest'
    digestTime: '08:00',
    lastDigestDate: null
  };
  
  let checkInterval = null;
  let notifiedReminders = new Set(); // Track which reminders we've notified

  function init() {
    loadSettings();
    
    // Request notification permission on init if enabled
    if (settings.enabled) {
      requestPermission();
    }
    
    // Start checking for due reminders
    startChecking();
    
    // Check immediately on init
    checkReminders();
    
    console.log('[v0] NotificationManager initialized', settings);
  }

  function loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        settings = { ...settings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load notification settings:', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save notification settings:', e);
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  async function setEnabled(enabled) {
    settings.enabled = enabled;
    
    if (enabled) {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        settings.enabled = false;
        saveSettings();
        return false;
      }
    }
    
    saveSettings();
    return settings.enabled;
  }

  function setMode(mode) {
    settings.mode = mode;
    saveSettings();
  }

  function setDigestTime(time) {
    settings.digestTime = time;
    saveSettings();
  }

  function getSettings() {
    return { ...settings };
  }

  function startChecking() {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    checkInterval = setInterval(checkReminders, CHECK_INTERVAL);
  }

  function stopChecking() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }

  function checkReminders() {
    if (!settings.enabled) return;
    
    const events = JSON.parse(localStorage.getItem('events') || '{}');
    const now = new Date();
    const today = formatDate(now);
    
    if (settings.mode === 'digest') {
      checkDigestMode(events, now, today);
    } else {
      checkExactMode(events, now, today);
    }
  }

  function checkExactMode(events, now, today) {
    const todayEvents = events[today] || [];
    
    todayEvents.forEach((event, index) => {
      if (event.completed) return;
      
      const reminderKey = `${today}-${index}`;
      if (notifiedReminders.has(reminderKey)) return;
      
      // Parse event time
      const eventTime = parseEventTime(event.time);
      if (!eventTime) return;
      
      const eventDate = new Date(now);
      eventDate.setHours(eventTime.hours, eventTime.minutes, 0, 0);
      
      // Notify 5 minutes before or at the time
      const diffMs = eventDate - now;
      const diffMinutes = diffMs / 60000;
      
      if (diffMinutes <= 5 && diffMinutes >= -1) {
        showNotification(
          `Time to ${event.type.toLowerCase()}!`,
          `${event.plant} needs ${event.type.toLowerCase()} ${diffMinutes > 0 ? 'in 5 minutes' : 'now'}.`
        );
        notifiedReminders.add(reminderKey);
      }
    });
  }

  function checkDigestMode(events, now, today) {
    // Check if we already sent digest today
    if (settings.lastDigestDate === today) return;
    
    // Parse digest time
    const [digestHours, digestMinutes] = settings.digestTime.split(':').map(Number);
    const digestDate = new Date(now);
    digestDate.setHours(digestHours, digestMinutes, 0, 0);
    
    // Check if it's time for digest (within 5 minute window)
    const diffMs = Math.abs(now - digestDate);
    const diffMinutes = diffMs / 60000;
    
    if (diffMinutes <= 5) {
      const todayEvents = (events[today] || []).filter(e => !e.completed);
      
      if (todayEvents.length > 0) {
        const plantNames = [...new Set(todayEvents.map(e => e.plant))];
        const tasksText = todayEvents.length === 1 
          ? '1 task' 
          : `${todayEvents.length} tasks`;
        
        showNotification(
          `Good morning! You have ${tasksText} today`,
          `Plants needing care: ${plantNames.join(', ')}`
        );
      }
      
      settings.lastDigestDate = today;
      saveSettings();
    }
  }

  function parseEventTime(timeStr) {
    // Parse times like "3:30 pm" or "10:00 am"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const isPM = match[3].toLowerCase() === 'pm';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    return { hours, minutes };
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async function showNotification(title, body) {
    if (!settings.enabled) return;
    
    if (Notification.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    try {
      // Try service worker notification first (works better on mobile)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: '/images/canopy-logo.png',
            badge: '/images/canopy-logo.png',
            vibrate: [200, 100, 200],
            tag: 'canopy-reminder',
            renotify: true
          });
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          body,
          icon: '/images/canopy-logo.png'
        });
      }
    } catch (e) {
      console.warn('Failed to show notification:', e);
    }
  }

  // Test notification function
  function testNotification() {
    showNotification(
      'Canopy Test Notification',
      'Notifications are working correctly!'
    );
  }

  // Clear notified reminders at midnight
  function resetDailyTracking() {
    notifiedReminders.clear();
  }

  // Schedule daily reset
  function scheduleDailyReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;
    
    setTimeout(() => {
      resetDailyTracking();
      scheduleDailyReset(); // Schedule next reset
    }, msUntilMidnight);
  }

  // Initialize daily reset scheduling
  scheduleDailyReset();

  return {
    init,
    setEnabled,
    setMode,
    setDigestTime,
    getSettings,
    requestPermission,
    testNotification,
    checkReminders
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', NotificationManager.init);
} else {
  NotificationManager.init();
}

// Export for use in main.js
window.NotificationManager = NotificationManager;
