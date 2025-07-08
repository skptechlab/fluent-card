// mobile.js - Mobile-specific functionality and touch handling

// Mobile state management
const mobileState = {
  isMobile: false,
  touchStartTime: 0,
  touchStartPos: { x: 0, y: 0 },
  selectedCard: null,
  isGestureActive: false,
  lastTap: 0,
  gestureThresholds: {
    swipeDistance: 50,
    longPressTime: 500,
    doubleTapTime: 300,
    swipeVelocity: 0.5
  }
};

// Initialize mobile detection and setup
function initializeMobile() {
  // More accurate mobile detection - prioritize user agent over screen size
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouchDevice = ('ontouchstart' in window);
  const isSmallScreen = window.innerWidth <= 768;
  
  // Only enable mobile mode if it's actually a mobile device OR (touch device AND small screen)
  mobileState.isMobile = isMobileDevice || (isTouchDevice && isSmallScreen);
  
  if (mobileState.isMobile) {
    document.body.classList.add('mobile-device');
    setupMobileEventListeners();
    setupMobileUI();
    console.log('Mobile mode activated for', isMobileDevice ? 'mobile device' : 'touch device');
    console.log('Body classes:', document.body.className);
    console.log('Screen size:', window.innerWidth + 'x' + window.innerHeight);
  } else {
    console.log('Desktop mode - mobile UI disabled');
    console.log('isMobileDevice:', isMobileDevice);
    console.log('isTouchDevice:', isTouchDevice);
    console.log('isSmallScreen:', isSmallScreen);
  }
  
  return mobileState.isMobile;
}

// Setup mobile-specific event listeners
function setupMobileEventListeners() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  
  // Touch events
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Prevent default touch behaviors
  canvas.addEventListener('touchstart', preventDefault);
  canvas.addEventListener('touchmove', preventDefault);
  
  // Handle orientation change
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleMobileResize);
}

function preventDefault(e) {
  e.preventDefault();
}

// Touch event handlers
function handleTouchStart(event) {
  if (event.touches.length !== 1) return; // Only handle single touch
  
  const touch = event.touches[0];
  mobileState.touchStartTime = Date.now();
  mobileState.touchStartPos = { x: touch.clientX, y: touch.clientY };
  mobileState.isGestureActive = true;
  
  // Convert touch to mouse coordinates for existing game logic
  const mouseEvent = touchToMouseEvent(touch, 'mousedown');
  
  // Check if touching a card (async)
  getCardFromTouch(touch).then(card => {
    if (card) {
      mobileState.selectedCard = card;
      addTouchFeedback(touch.clientX, touch.clientY);
      
      // Check for double tap
      const now = Date.now();
      if (now - mobileState.lastTap < mobileState.gestureThresholds.doubleTapTime) {
        handleDoubleTap(card);
      }
      mobileState.lastTap = now;
    }
  });
}

function handleTouchMove(event) {
  if (!mobileState.isGestureActive || event.touches.length !== 1) return;
  
  const touch = event.touches[0];
  const deltaX = touch.clientX - mobileState.touchStartPos.x;
  const deltaY = touch.clientY - mobileState.touchStartPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Visual feedback for drag
  if (mobileState.selectedCard && distance > 20) {
    showDragFeedback(touch.clientX, touch.clientY);
  }
}

function handleTouchEnd(event) {
  if (!mobileState.isGestureActive) return;
  
  const touchEndTime = Date.now();
  const touchDuration = touchEndTime - mobileState.touchStartTime;
  
  // Get the touch that ended
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - mobileState.touchStartPos.x;
  const deltaY = touch.clientY - mobileState.touchStartPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Clear feedback
  clearTouchFeedback();
  
  // Determine gesture type
  if (touchDuration > mobileState.gestureThresholds.longPressTime) {
    handleLongPress(mobileState.selectedCard);
  } else if (distance > mobileState.gestureThresholds.swipeDistance) {
    handleSwipe(deltaX, deltaY, mobileState.selectedCard);
  } else {
    handleTap(mobileState.selectedCard);
  }
  
  // Reset state
  mobileState.isGestureActive = false;
  mobileState.selectedCard = null;
}

// Gesture handlers
function handleTap(card) {
  if (card) {
    // Simple tap to select card - use main game's card zoom system
    import('./game.js').then(game => {
      const mouseEvent = touchToMouseEvent(mobileState.touchStartPos, 'click');
      game.onMouseClick(mouseEvent);
    });
  }
}

function handleDoubleTap(card) {
  if (card) {
    // Double tap to zoom/view card details - use main game's card zoom system
    import('./game.js').then(game => {
      const mouseEvent = touchToMouseEvent(mobileState.touchStartPos, 'click');
      game.onMouseClick(mouseEvent);
    });
  }
}

function handleLongPress(card) {
  if (card) {
    // Long press for context menu or alternative action
    navigator.vibrate && navigator.vibrate(50); // Haptic feedback
    // Use main game's card zoom system
    import('./game.js').then(game => {
      const mouseEvent = touchToMouseEvent(mobileState.touchStartPos, 'click');
      game.onMouseClick(mouseEvent);
    });
  }
}

function handleSwipe(deltaX, deltaY, card) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  
  if (card) {
    if (absY > absX && deltaY < 0) {
      // Swipe up to play card
      playCardMobile(card);
    } else if (absX > absY && deltaX > 0) {
      // Swipe right to view details - use main game's card zoom system
      import('./game.js').then(game => {
        const mouseEvent = touchToMouseEvent(mobileState.touchStartPos, 'click');
        game.onMouseClick(mouseEvent);
      });
    }
  }
}

// Mobile UI setup
function setupMobileUI() {
  // Double-check we're actually on a mobile device or small screen
  if (window.innerWidth > 768 && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    console.log('Skipping mobile UI setup - detected desktop environment');
    return;
  }
  
  // Add mobile-specific UI elements
  addMobileControlPanel();
  addMobileBottomSheet();
  addMobileGestureIndicators();
  
  // Adjust viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
}

function addMobileControlPanel() {
  const controlPanel = document.createElement('div');
  controlPanel.id = 'mobileControlPanel';
  controlPanel.className = 'mobile-control-panel';
  controlPanel.innerHTML = `
    <div class="mobile-actions">
      <button class="mobile-btn play-btn" id="mobilePlayBtn" disabled>
        <span class="btn-icon">⚔️</span>
        <span>Play</span>
      </button>
      <button class="mobile-btn details-btn" id="mobileDetailsBtn" disabled>
        <span class="btn-icon">👁️</span>
        <span>Details</span>
      </button>
      <button class="mobile-btn menu-btn" id="mobileMenuBtn">
        <span class="btn-icon">☰</span>
        <span>Menu</span>
      </button>
    </div>
    <div class="mobile-gesture-hints">
      <div class="hint">Tap: Select • Swipe ↑: Play • Long press: Details</div>
    </div>
  `;
  
  document.body.appendChild(controlPanel);
  
  // Add event listeners
  document.getElementById('mobilePlayBtn').addEventListener('click', () => {
    if (mobileState.selectedCard) {
      playCardMobile(mobileState.selectedCard);
    }
  });
  
  document.getElementById('mobileDetailsBtn').addEventListener('click', () => {
    if (mobileState.selectedCard) {
      showMobileCardDetails(mobileState.selectedCard);
    }
  });
  
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    // Toggle mobile menu or return to main menu
    window.returnToMenu();
  });
}

function addMobileBottomSheet() {
  const bottomSheet = document.createElement('div');
  bottomSheet.id = 'mobileBottomSheet';
  bottomSheet.className = 'mobile-bottom-sheet';
  bottomSheet.innerHTML = `
    <div class="bottom-sheet-header">
      <div class="bottom-sheet-handle"></div>
      <h3 id="bottomSheetTitle">Card Details</h3>
      <button class="close-btn" onclick="closeMobileBottomSheet()">✕</button>
    </div>
    <div class="bottom-sheet-content">
      <div class="card-preview-mobile">
        <img id="bottomSheetCardImage" src="" alt="Card">
        <div class="card-info-mobile">
          <h4 id="bottomSheetCardName">Card Name</h4>
          <div class="card-stats-mobile">
            <div class="stat">
              <span class="stat-label">Attack:</span>
              <span class="stat-value" id="bottomSheetCardAttack">0</span>
            </div>
          </div>
        </div>
      </div>
      <div class="mobile-card-actions">
        <button class="mobile-action-btn play-action" onclick="playSelectedCardMobile()">
          <span class="btn-icon">⚔️</span>
          <span>Play Card</span>
        </button>
        <button class="mobile-action-btn cancel-action" onclick="closeMobileBottomSheet()">
          <span class="btn-icon">✕</span>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(bottomSheet);
}

function addMobileGestureIndicators() {
  // Add visual indicators for gestures
  const indicators = document.createElement('div');
  indicators.id = 'mobileGestureIndicators';
  indicators.className = 'mobile-gesture-indicators';
  indicators.innerHTML = `
    <div class="gesture-indicator swipe-up" id="swipeUpIndicator">
      <div class="gesture-icon">↑</div>
      <div class="gesture-text">Swipe up to play</div>
    </div>
  `;
  
  document.body.appendChild(indicators);
}

// Mobile card interactions
function showMobileCardDetails(card) {
  if (!card) return;
  
  const bottomSheet = document.getElementById('mobileBottomSheet');
  const cardImage = document.getElementById('bottomSheetCardImage');
  const cardName = document.getElementById('bottomSheetCardName');
  const cardAttack = document.getElementById('bottomSheetCardAttack');
  
  cardImage.src = card.data.imagePath;
  cardName.textContent = card.data.name;
  cardAttack.textContent = card.data.atk;
  
  mobileState.selectedCard = card;
  bottomSheet.classList.add('open');
  
  // Enable mobile action buttons
  document.getElementById('mobilePlayBtn').disabled = false;
  document.getElementById('mobileDetailsBtn').disabled = false;
}

function playCardMobile(card) {
  if (!card) return;
  
  // Add haptic feedback
  navigator.vibrate && navigator.vibrate(25);
  
  // Close bottom sheet if open
  closeMobileBottomSheet();
  
  // Play the card using existing game logic
  import('./game.js').then(game => {
    game.playCard(card);
  });
}

// Utility functions
function getCardFromTouch(touch) {
  // Convert touch to raycaster intersection
  const rect = document.getElementById('gameCanvas').getBoundingClientRect();
  const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Use existing raycaster logic - return promise for async handling
  return new Promise((resolve) => {
    import('./threeSetup.js').then(three => {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, three.camera);
      const intersects = raycaster.intersectObjects(three.scene.children);
      
      if (intersects.length > 0) {
        resolve(intersects[0].object.userData);
      } else {
        resolve(null);
      }
    });
  });
}

function touchToMouseEvent(touch, type) {
  return {
    clientX: touch.x || touch.clientX,
    clientY: touch.y || touch.clientY,
    type: type
  };
}

function addTouchFeedback(x, y) {
  const feedback = document.createElement('div');
  feedback.className = 'touch-feedback';
  feedback.style.left = x + 'px';
  feedback.style.top = y + 'px';
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 300);
}

function clearTouchFeedback() {
  document.querySelectorAll('.touch-feedback').forEach(el => el.remove());
}

function showDragFeedback(x, y) {
  let dragIndicator = document.getElementById('dragIndicator');
  if (!dragIndicator) {
    dragIndicator = document.createElement('div');
    dragIndicator.id = 'dragIndicator';
    dragIndicator.className = 'drag-indicator';
    document.body.appendChild(dragIndicator);
  }
  
  dragIndicator.style.left = x + 'px';
  dragIndicator.style.top = y + 'px';
  dragIndicator.style.display = 'block';
}

// Event handlers for mobile UI
function handleOrientationChange() {
  setTimeout(() => {
    handleMobileResize();
  }, 100);
}

function handleMobileResize() {
  // Adjust UI for new orientation/size
  const isLandscape = window.innerWidth > window.innerHeight;
  document.body.classList.toggle('landscape', isLandscape);
  document.body.classList.toggle('portrait', !isLandscape);
}

// Global functions for mobile UI
window.closeMobileBottomSheet = function() {
  const bottomSheet = document.getElementById('mobileBottomSheet');
  bottomSheet.classList.remove('open');
  
  // Disable mobile action buttons
  document.getElementById('mobilePlayBtn').disabled = true;
  document.getElementById('mobileDetailsBtn').disabled = true;
  
  mobileState.selectedCard = null;
};

window.playSelectedCardMobile = function() {
  if (mobileState.selectedCard) {
    playCardMobile(mobileState.selectedCard);
  }
};

// Export mobile state and functions
export { initializeMobile, mobileState };