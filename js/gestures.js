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
  const EASE_CURVE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // iOS-style deceleration curve
  
  // Track if a transition is in progress to prevent overlap
  let isTransitioning = false;

  function slideTransition(fromEl, toEl, direction = 'forward', callback) {
    if (!fromEl || !toEl) {
      if (callback) callback();
      return;
    }
    
    // Prevent overlapping transitions
    if (isTransitioning) {
      return;
    }
    isTransitioning = true;

    // Create a container for both screens to ensure proper layering
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 9999;
      background: var(--color-bg);
    `;
    document.body.appendChild(container);

    // Clone both elements into the container for clean animation
    const fromClone = fromEl.cloneNode(true);
    const toClone = toEl.cloneNode(true);
    
    // Style the clones for animation
    fromClone.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: grid;
      opacity: 1;
      transform: translateX(0);
      z-index: ${direction === 'forward' ? '1' : '2'};
      will-change: transform, opacity;
      pointer-events: none;
    `;
    
    toClone.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: grid;
      opacity: ${direction === 'forward' ? '1' : '0.85'};
      transform: translateX(${direction === 'forward' ? '100%' : '-25%'});
      z-index: ${direction === 'forward' ? '2' : '1'};
      will-change: transform, opacity;
      pointer-events: none;
    `;

    container.appendChild(fromClone);
    container.appendChild(toClone);

    // Hide originals immediately
    fromEl.style.display = 'none';
    
    // Force reflow
    void toClone.offsetWidth;

    // Apply transitions
    fromClone.style.transition = `transform ${TRANSITION_DURATION}ms ${EASE_CURVE}, opacity ${TRANSITION_DURATION}ms ${EASE_CURVE}`;
    toClone.style.transition = `transform ${TRANSITION_DURATION}ms ${EASE_CURVE}, opacity ${TRANSITION_DURATION}ms ${EASE_CURVE}`;

    // Animate
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (direction === 'forward') {
          // Forward: new screen slides in from right, old slides left
          toClone.style.transform = 'translateX(0)';
          fromClone.style.transform = 'translateX(-25%)';
          fromClone.style.opacity = '0.85';
        } else {
          // Back: old screen slides out to right, new slides in from left
          fromClone.style.transform = 'translateX(100%)';
          fromClone.style.opacity = '0.85';
          toClone.style.transform = 'translateX(0)';
          toClone.style.opacity = '1';
        }
      });
    });

    setTimeout(() => {
      // Show the real destination element
      toEl.style.display = 'grid';
      toEl.style.opacity = '1';
      toEl.style.transform = '';
      
      // Clean up from element
      fromEl.style.position = '';
      fromEl.style.transform = '';
      fromEl.style.opacity = '';
      fromEl.style.transition = '';
      fromEl.style.zIndex = '';
      
      // Remove the animation container
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      
      isTransitioning = false;

      if (callback) callback();
    }, TRANSITION_DURATION + 16); // Add a small buffer for smoother completion
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

    // Prepare sheet for animation
    sheetEl.style.display = 'grid';
    sheetEl.style.transform = 'translateY(100%)';
    sheetEl.style.opacity = '1';
    sheetEl.style.bottom = '0';
    sheetEl.style.top = 'auto';
    
    // Force reflow
    void sheetEl.offsetWidth;

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
