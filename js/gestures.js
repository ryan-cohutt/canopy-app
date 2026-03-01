// ==================== iOS-STYLE GESTURES & NAVIGATION ====================

const NavigationManager = (function() {
  const SWIPE_THRESHOLD = 50; // Minimum swipe distance to trigger navigation
  const EDGE_WIDTH = 30; // Width of left edge detection zone
  const VELOCITY_THRESHOLD = 0.3; // Minimum velocity for quick swipe

  let navigationStack = [];
  let currentScreen = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let isSwiping = false;
  let swipeStartTime = 0;
  let swipeIndicator = null;

  // Screen definitions for navigation
  const screens = {
    'load-screen': { canSwipeBack: false },
    'home-screen': { canSwipeBack: false },
    'plant-screen': { canSwipeBack: true, backTo: 'home-screen' },
    'plant-info': { canSwipeBack: true, backTo: 'plant-screen' },
    'reminders-screen': { canSwipeBack: true, backTo: 'home-screen' },
    'settings-screen': { canSwipeBack: true, backTo: null }, // Dynamic back
    'journal-screen': { canSwipeBack: true, backTo: 'plant-info' },
    'health-screen': { canSwipeBack: true, backTo: 'plant-info' }
  };

  function init() {
    createSwipeIndicator();
    setupTouchListeners();
    console.log('[v0] NavigationManager initialized');
  }

  function createSwipeIndicator() {
    swipeIndicator = document.createElement('div');
    swipeIndicator.className = 'swipe-indicator';
    document.body.appendChild(swipeIndicator);
  }

  function setupTouchListeners() {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchCurrentX = touchStartX;
    swipeStartTime = Date.now();

    // Only enable swiping if starting from left edge
    if (touchStartX <= EDGE_WIDTH && canCurrentScreenSwipeBack()) {
      isSwiping = true;
      swipeIndicator.classList.add('active');
    }
  }

  function handleTouchMove(e) {
    if (!isSwiping) return;

    const touch = e.touches[0];
    touchCurrentX = touch.clientX;
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Cancel if scrolling vertically
    if (deltaY > Math.abs(deltaX) && deltaX < 30) {
      isSwiping = false;
      swipeIndicator.classList.remove('active');
      return;
    }

    // Only process rightward swipes
    if (deltaX > 0) {
      e.preventDefault();
      
      // Update swipe indicator
      const progress = Math.min(deltaX / 150, 1);
      swipeIndicator.style.opacity = 0.3 + (progress * 0.4);
      swipeIndicator.style.width = `${4 + (progress * 4)}px`;

      // Apply transform to current screen for real-time feedback
      const currentEl = getCurrentScreenElement();
      if (currentEl) {
        const translateX = Math.min(deltaX, window.innerWidth);
        currentEl.style.transform = `translateX(${translateX}px)`;
        currentEl.style.transition = 'none';
      }
    }
  }

  function handleTouchEnd(e) {
    if (!isSwiping) return;

    const deltaX = touchCurrentX - touchStartX;
    const elapsed = Date.now() - swipeStartTime;
    const velocity = deltaX / elapsed;

    swipeIndicator.classList.remove('active');
    swipeIndicator.style.opacity = '';
    swipeIndicator.style.width = '';

    const currentEl = getCurrentScreenElement();
    
    // Check if swipe was strong enough
    if (deltaX > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      // Complete the swipe - navigate back
      if (currentEl) {
        currentEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        currentEl.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
          navigateBack();
          currentEl.style.transform = '';
          currentEl.style.transition = '';
        }, 300);
      }
    } else {
      // Cancel swipe - snap back
      if (currentEl) {
        currentEl.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        currentEl.style.transform = 'translateX(0)';
        
        setTimeout(() => {
          currentEl.style.transform = '';
          currentEl.style.transition = '';
        }, 250);
      }
    }

    isSwiping = false;
  }

  function canCurrentScreenSwipeBack() {
    if (!currentScreen) return false;
    const config = screens[currentScreen];
    return config && config.canSwipeBack;
  }

  function getCurrentScreenElement() {
    if (!currentScreen) return null;
    return document.getElementById(currentScreen);
  }

  function setCurrentScreen(screenId) {
    currentScreen = screenId;
  }

  function pushScreen(screenId) {
    if (currentScreen && currentScreen !== screenId) {
      navigationStack.push(currentScreen);
    }
    currentScreen = screenId;
  }

  function navigateBack() {
    if (navigationStack.length === 0) {
      // Use default back target
      const config = screens[currentScreen];
      if (config && config.backTo) {
        triggerNavigation(config.backTo);
      }
      return;
    }

    const previousScreen = navigationStack.pop();
    triggerNavigation(previousScreen);
  }

  function triggerNavigation(targetScreen) {
    // Dispatch custom event for main.js to handle
    const event = new CustomEvent('navigate-back', {
      detail: { from: currentScreen, to: targetScreen }
    });
    document.dispatchEvent(event);
  }

  function clearStack() {
    navigationStack = [];
  }

  function getStack() {
    return [...navigationStack];
  }

  return {
    init,
    setCurrentScreen,
    pushScreen,
    navigateBack,
    clearStack,
    getStack,
    screens
  };
})();

// ==================== SCREEN TRANSITION MANAGER ====================

const TransitionManager = (function() {
  const TRANSITION_DURATION = 350;
  const EASE_CURVE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  function slideTransition(fromEl, toEl, direction = 'forward', callback) {
    if (!fromEl || !toEl) {
      if (callback) callback();
      return;
    }

    // Prepare elements
    fromEl.style.position = 'absolute';
    fromEl.style.top = '0';
    fromEl.style.left = '0';
    fromEl.style.width = '100%';
    fromEl.style.zIndex = direction === 'forward' ? '1' : '2';

    toEl.style.display = 'grid';
    toEl.style.position = 'absolute';
    toEl.style.top = '0';
    toEl.style.left = '0';
    toEl.style.width = '100%';
    toEl.style.zIndex = direction === 'forward' ? '2' : '1';
    toEl.style.opacity = '1';

    if (direction === 'forward') {
      // Entering screen slides in from right
      toEl.style.transform = 'translateX(100%)';
      fromEl.style.transform = 'translateX(0)';
    } else {
      // Entering screen slides in from left (was behind)
      toEl.style.transform = 'translateX(-30%)';
      toEl.style.opacity = '0.7';
      fromEl.style.transform = 'translateX(0)';
    }

    // Force reflow
    void toEl.offsetWidth;

    // Start transition
    fromEl.style.transition = `transform ${TRANSITION_DURATION}ms ${EASE_CURVE}, opacity ${TRANSITION_DURATION}ms ${EASE_CURVE}`;
    toEl.style.transition = `transform ${TRANSITION_DURATION}ms ${EASE_CURVE}, opacity ${TRANSITION_DURATION}ms ${EASE_CURVE}`;

    requestAnimationFrame(() => {
      if (direction === 'forward') {
        toEl.style.transform = 'translateX(0)';
        fromEl.style.transform = 'translateX(-30%)';
        fromEl.style.opacity = '0.7';
      } else {
        toEl.style.transform = 'translateX(0)';
        toEl.style.opacity = '1';
        fromEl.style.transform = 'translateX(100%)';
      }
    });

    setTimeout(() => {
      // Clean up
      fromEl.style.display = 'none';
      fromEl.style.position = '';
      fromEl.style.transform = '';
      fromEl.style.opacity = '';
      fromEl.style.transition = '';
      fromEl.style.zIndex = '';

      toEl.style.position = '';
      toEl.style.transform = '';
      toEl.style.transition = '';
      toEl.style.zIndex = '';

      if (callback) callback();
    }, TRANSITION_DURATION);
  }

  function fadeTransition(fromEl, toEl, callback) {
    if (!fromEl || !toEl) {
      if (callback) callback();
      return;
    }

    fromEl.style.transition = `opacity 200ms ease`;
    fromEl.style.opacity = '0';

    setTimeout(() => {
      fromEl.style.display = 'none';
      fromEl.style.transition = '';
      
      toEl.style.display = 'grid';
      toEl.style.opacity = '0';
      
      requestAnimationFrame(() => {
        toEl.style.transition = `opacity 200ms ease`;
        toEl.style.opacity = '1';
      });

      setTimeout(() => {
        toEl.style.transition = '';
        if (callback) callback();
      }, 200);
    }, 200);
  }

  function bottomSheetOpen(sheetEl) {
    if (!sheetEl) return;

    sheetEl.style.display = 'grid';
    sheetEl.style.top = '100dvh';
    sheetEl.style.opacity = '1';

    requestAnimationFrame(() => {
      sheetEl.style.transition = 'top 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      sheetEl.style.top = 'auto';
      sheetEl.style.bottom = '0';
    });
  }

  function bottomSheetClose(sheetEl, callback) {
    if (!sheetEl) {
      if (callback) callback();
      return;
    }

    sheetEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s ease';
    sheetEl.style.transform = 'translateY(100%)';
    sheetEl.style.opacity = '0';

    setTimeout(() => {
      sheetEl.style.display = 'none';
      sheetEl.style.transform = '';
      sheetEl.style.opacity = '';
      sheetEl.style.transition = '';
      sheetEl.style.top = '100dvh';
      sheetEl.style.bottom = 'auto';
      if (callback) callback();
    }, 300);
  }

  return {
    slideTransition,
    fadeTransition,
    bottomSheetOpen,
    bottomSheetClose,
    TRANSITION_DURATION
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', NavigationManager.init);
} else {
  NavigationManager.init();
}

// Export for use in main.js
window.NavigationManager = NavigationManager;
window.TransitionManager = TransitionManager;
