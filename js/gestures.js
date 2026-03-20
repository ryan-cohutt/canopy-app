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
  const TRANSITION_DURATION = 320;
  const EASE_CURVE = 'cubic-bezier(0.32, 0.72, 0, 1)';

  let isTransitioning = false;
  let transitionTimer = null;

  function slideTransition(fromEl, toEl, direction = 'forward', callback) {
    if (!fromEl || !toEl) {
      if (callback) callback();
      return;
    }

    // If a transition is already running, force-complete it immediately
    // before starting the new one so screens never get stuck
    if (isTransitioning) {
      if (transitionTimer) {
        clearTimeout(transitionTimer);
        transitionTimer = null;
      }
      // Clean up any lingering animation containers
      document.querySelectorAll('.transition-container').forEach(el => el.remove());
      // Reset all screen styles that might be mid-animation
      document.querySelectorAll('section').forEach(el => {
        el.style.transition = '';
        el.style.transform = '';
      });
      isTransitioning = false;
    }

    isTransitioning = true;

    // Position both screens for animation without cloning —
    // cloning loses scroll state and can snapshot stale content
    const toStartX = direction === 'forward' ? '100%' : '-25%';
    const fromEndX = direction === 'forward' ? '-25%' : '100%';

    // Make sure destination is visible but off-screen
    toEl.style.display = 'grid';
    toEl.style.opacity = direction === 'forward' ? '1' : '0.85';
    toEl.style.transform = `translateX(${toStartX})`;
    toEl.style.transition = 'none';
    toEl.style.position = 'fixed';
    toEl.style.top = '0';
    toEl.style.left = '0';
    toEl.style.width = '100%';
    toEl.style.zIndex = direction === 'forward' ? '5001' : '4999';

    fromEl.style.transition = 'none';
    fromEl.style.transform = 'translateX(0)';
    fromEl.style.opacity = '1';
    fromEl.style.position = 'fixed';
    fromEl.style.top = '0';
    fromEl.style.left = '0';
    fromEl.style.width = '100%';
    fromEl.style.zIndex = direction === 'forward' ? '4999' : '5001';

    // Force a reflow so the browser registers the start positions
    void toEl.offsetWidth;
    void fromEl.offsetWidth;

    // Apply transitions and animate in a single rAF — no double rAF needed
    // because we forced reflow above
    requestAnimationFrame(() => {
      const t = `transform ${TRANSITION_DURATION}ms ${EASE_CURVE}, opacity ${TRANSITION_DURATION}ms ${EASE_CURVE}`;
      toEl.style.transition = t;
      fromEl.style.transition = t;

      toEl.style.transform = 'translateX(0)';
      toEl.style.opacity = '1';
      fromEl.style.transform = `translateX(${fromEndX})`;
      fromEl.style.opacity = direction === 'forward' ? '0.85' : '1';
    });

    transitionTimer = setTimeout(() => {
      transitionTimer = null;

      // Clean up fromEl — hide it and reset all inline styles
      fromEl.style.display = 'none';
      fromEl.style.position = '';
      fromEl.style.transform = '';
      fromEl.style.opacity = '';
      fromEl.style.transition = '';
      fromEl.style.zIndex = '';
      fromEl.style.top = '';
      fromEl.style.left = '';
      fromEl.style.width = '';

      // Clean up toEl — it's now the active screen, just reset positioning
      toEl.style.position = '';
      toEl.style.transform = '';
      toEl.style.opacity = '1';
      toEl.style.transition = '';
      toEl.style.zIndex = '';
      toEl.style.top = '';
      toEl.style.left = '';
      toEl.style.width = '';

      isTransitioning = false;
      if (callback) callback();
    }, TRANSITION_DURATION + 20);
  }

  function fadeTransition(fromEl, toEl, callback) {
    if (!fromEl || !toEl) {
      if (callback) callback();
      return;
    }

    fromEl.style.transition = 'opacity 200ms ease';
    fromEl.style.opacity = '0';

    setTimeout(() => {
      fromEl.style.display = 'none';
      fromEl.style.transition = '';
      fromEl.style.opacity = '';

      toEl.style.display = 'grid';
      toEl.style.opacity = '0';
      toEl.style.transition = 'none';

      void toEl.offsetWidth;

      requestAnimationFrame(() => {
        toEl.style.transition = 'opacity 200ms ease';
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

    sheetEl.style.transition = 'none';
    sheetEl.style.transform = 'translateY(100%)';
    sheetEl.style.opacity = '1';
    sheetEl.style.display = 'grid';
    sheetEl.style.bottom = '0';
    sheetEl.style.top = 'auto';

    // Force reflow so translateY(100%) is the committed start position
    void sheetEl.offsetWidth;

    // Single rAF is safe here because reflow above committed the start state
    requestAnimationFrame(() => {
      sheetEl.style.transition = 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)';
      sheetEl.style.transform = 'translateY(0)';
    });
  }

  function bottomSheetClose(sheetEl, callback) {
    if (!sheetEl) {
      if (callback) callback();
      return;
    }

    // Force reflow to commit current position before animating out
    void sheetEl.offsetWidth;

    sheetEl.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
    sheetEl.style.transform = 'translateY(100%)';

    setTimeout(() => {
      sheetEl.style.display = 'none';
      sheetEl.style.transform = '';
      sheetEl.style.opacity = '';
      sheetEl.style.transition = '';
      sheetEl.style.top = '';
      sheetEl.style.bottom = '';
      if (callback) callback();
    }, 280);
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