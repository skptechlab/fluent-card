// game.js - Simplified PvP Card Battle Game

import { cardData, Card } from './cards.js';
import { shuffle } from './utils.js';
import { scene, camera, renderer } from './threeSetup.js';

export const gameState = {
  player1: { id: null, username: null, hp: 100, maxHp: 100, hand: [], playedCards: [] },
  player2: { id: null, username: null, hp: 100, maxHp: 100, hand: [], playedCards: [] },
  currentPlayer: 1,
  gameSession: null,
  selectedCard: null,
  draggingCard: null,
  isPaused: false,
  isGameActive: false,
  animationInProgress: false,
  availableCards: [],
  currentPlayerObj: null, // For authentication
  zoomedCard: null // Card currently being viewed in zoom modal
};

// API helper functions
async function apiCall(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  const url = method === 'GET' && data 
    ? `./api/${endpoint}?${new URLSearchParams(data).toString()}`
    : `./api/${endpoint}`;
  
  const response = await fetch(url, config);
  return await response.json();
}

// Authentication functions
export async function loginPlayer(username, email = null) {
  try {
    const result = await apiCall('login.php', 'POST', { username, email });
    if (result.success) {
      gameState.currentPlayerObj = result.data.player;
      log(`Welcome, ${result.data.player.username}!`);
      return result.data.player;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    log(`Login failed: ${error.message}`);
    throw error;
  }
}

// Load available cards
async function loadCards() {
  try {
    const result = await apiCall('get_cards.php');
    if (result.success) {
      gameState.availableCards = result.data.cards;
      log(`Loaded ${result.data.count} cards`);
    } else {
      // Fallback to local cards if API fails
      gameState.availableCards = cardData;
      log('Using local card data');
    }
  } catch (error) {
    gameState.availableCards = cardData;
    log('Using local card data due to API error');
  }
}

// Create new game session
async function createGameSession(player1Id, player2Id = null) {
  try {
    const result = await apiCall('create_game.php', 'POST', {
      player1_id: player1Id,
      player2_id: player2Id
    });
    
    if (result.success) {
      gameState.gameSession = result.data.game_session;
      log('Game session created');
      return result.data.game_session;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    log(`Failed to create game session: ${error.message}`);
    throw error;
  }
}

// Play a card
async function playCardAPI(cardId, damage) {
  if (!gameState.gameSession) return null;
  
  try {
    const currentPlayerId = gameState.currentPlayer === 1 
      ? gameState.player1.id 
      : gameState.player2.id;
      
    const result = await apiCall('play_card.php', 'POST', {
      session_id: gameState.gameSession.id,
      player_id: currentPlayerId,
      card_id: cardId,
      damage_dealt: damage
    });
    
    if (result.success) {
      // Update local game state
      gameState.gameSession = result.data.game_session;
      gameState.player1.hp = result.data.game_session.player1_hp;
      gameState.player2.hp = result.data.game_session.player2_hp;
      
      log(`Card played, dealt ${damage} damage`);
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    log(`Failed to play card: ${error.message}`);
    return null;
  }
}

// Initialize game
export async function initializeGame(username = null) {
  clearSceneAndState();
  
  // Load cards first
  await loadCards();
  
  // Set up players
  if (username && gameState.currentPlayerObj) {
    gameState.player1.id = gameState.currentPlayerObj.id;
    gameState.player1.username = gameState.currentPlayerObj.username;
  } else {
    // Guest mode
    gameState.player1.id = Date.now(); // Temporary ID for guest
    gameState.player1.username = username || 'Guest';
  }
  
  // Player 2 is AI for now
  gameState.player2.id = null;
  gameState.player2.username = 'AI';
  
  // Create game session if user is logged in
  if (gameState.currentPlayerObj) {
    try {
      await createGameSession(gameState.player1.id);
    } catch (error) {
      log('Playing offline mode');
    }
  }
  
  // Initialize game state
  gameState.player1.hp = 100;
  gameState.player2.hp = 100;
  gameState.currentPlayer = 1;
  gameState.isGameActive = true;
  
  // Deal cards
  dealInitialCards();
  updateBoard();
  updateUI();
  
  log('Game initialized! Click cards to attack.');
  animate();
}

// Deal 5 cards to each player
function dealInitialCards() {
  const shuffledCards = shuffle([...gameState.availableCards]);
  
  // Deal 5 cards to each player
  for (let i = 0; i < 5; i++) {
    // Player 1 card
    const p1CardData = shuffledCards[i * 2];
    const p1Card = new Card(p1CardData, true);
    gameState.player1.hand.push(p1Card);
    
    // Player 2 card (AI)
    const p2CardData = shuffledCards[i * 2 + 1];
    const p2Card = new Card(p2CardData, false);
    gameState.player2.hand.push(p2Card);
  }
}

// Update 3D card positions
export function updateBoard() {
  const centerSpacing = 2.5;
  
  // Player 1 hand (bottom) - exclude zoomed card
  gameState.player1.hand.forEach((card, index) => {
    if (card === gameState.zoomedCard || card.isZoomed) {
      // Keep zoomed card in its zoom position, don't reposition or rescale
      return;
    }
    
    const totalCards = gameState.player1.hand.length;
    card.targetPosition.set(
      (index - (totalCards - 1) / 2) * centerSpacing, 
      -5, 
      0.5
    );
    card.targetRotation.set(0, 0, 0);
    card.targetScale.set(1, 1, 1);
  });
  
  // Player 2 hand (top)
  gameState.player2.hand.forEach((card, index) => {
    const totalCards = gameState.player2.hand.length;
    card.targetPosition.set(
      (index - (totalCards - 1) / 2) * centerSpacing, 
      5, 
      0.5
    );
    card.targetRotation.set(0, 0, 0);
    card.targetScale.set(1, 1, 1);
  });
  
  // Played cards (smaller, on sides)
  const sideSpacing = 0.8;
  gameState.player1.playedCards.slice(-5).forEach((card, index) => {
    card.targetPosition.set(
      (index - 2) * sideSpacing + 8, 
      -2, 
      0.3
    );
    card.targetScale.set(0.4, 0.4, 0.4);
  });
  
  gameState.player2.playedCards.slice(-5).forEach((card, index) => {
    card.targetPosition.set(
      (index - 2) * sideSpacing + 8, 
      2, 
      0.3
    );
    card.targetScale.set(0.4, 0.4, 0.4);
  });
}

// Play a card
export async function playCard(card) {
  if (!gameState.isGameActive || gameState.animationInProgress) return;
  if (gameState.currentPlayer !== 1) return; // Only player 1 can click
  if (!gameState.player1.hand.includes(card)) return;
  
  gameState.animationInProgress = true;
  
  // Remove card from hand
  const cardIndex = gameState.player1.hand.indexOf(card);
  gameState.player1.hand.splice(cardIndex, 1);
  
  // Animate card flying across screen
  await animateCardFlight(card, true);
  
  // Deal damage
  const damage = card.data.atk;
  gameState.player2.hp = Math.max(0, gameState.player2.hp - damage);
  
  // Update via API if online
  if (gameState.gameSession) {
    await playCardAPI(card.data.id, damage);
  }
  
  // Move to played cards
  gameState.player1.playedCards.push(card);
  
  // Draw new card
  drawCard(gameState.player1);
  
  log(`You played ${card.data.name} dealing ${damage} damage! Enemy HP: ${gameState.player2.hp}`);
  
  // Check win condition
  if (gameState.player2.hp <= 0) {
    endGame(true);
    return;
  }
  
  // Switch to AI turn
  gameState.currentPlayer = 2;
  updateBoard();
  updateUI();
  
  // AI plays after short delay
  setTimeout(async () => {
    await aiPlayCard();
    gameState.animationInProgress = false;
  }, 1500);
}

// AI plays a card
async function aiPlayCard() {
  if (!gameState.isGameActive) return;
  if (gameState.player2.hand.length === 0) return;
  
  // AI picks random card for now
  const randomIndex = Math.floor(Math.random() * gameState.player2.hand.length);
  const aiCard = gameState.player2.hand[randomIndex];
  
  // Remove from AI hand
  gameState.player2.hand.splice(randomIndex, 1);
  
  // Reveal and animate
  aiCard.reveal();
  await animateCardFlight(aiCard, false);
  
  // Deal damage to player
  const damage = aiCard.data.atk;
  gameState.player1.hp = Math.max(0, gameState.player1.hp - damage);
  
  // Move to played cards
  gameState.player2.playedCards.push(aiCard);
  
  // Draw new card
  drawCard(gameState.player2);
  
  log(`AI played ${aiCard.data.name} dealing ${damage} damage! Your HP: ${gameState.player1.hp}`);
  
  // Check win condition
  if (gameState.player1.hp <= 0) {
    endGame(false);
    return;
  }
  
  // Switch back to player
  gameState.currentPlayer = 1;
  updateBoard();
  updateUI();
}

// Animate card flying across battlefield
function animateCardFlight(card, playerToAI) {
  return new Promise((resolve) => {
    const startY = playerToAI ? -5 : 5;
    const endY = playerToAI ? 2 : -2;
    const duration = 1000; // 1 second
    const startTime = Date.now();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth animation curve
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Calculate position
      const currentY = startY + (endY - startY) * eased;
      const currentZ = 2 + Math.sin(progress * Math.PI) * 3; // Arc motion
      
      card.targetPosition.set(0, currentY, currentZ);
      card.mesh.scale.set(1.2, 1.2, 1.2); // Slightly larger during flight
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    animate();
  });
}

// Draw a new card
function drawCard(player) {
  if (gameState.availableCards.length === 0) return;
  
  const randomCard = gameState.availableCards[
    Math.floor(Math.random() * gameState.availableCards.length)
  ];
  
  const newCard = new Card(randomCard, player === gameState.player1);
  player.hand.push(newCard);
}

// Update UI
function updateUI() {
  // Update HP displays
  const p1HPElement = document.getElementById('player1HP');
  const p2HPElement = document.getElementById('player2HP');
  const p1HPBar = document.getElementById('player1HPBar');
  const p2HPBar = document.getElementById('player2HPBar');
  
  if (p1HPElement) {
    p1HPElement.textContent = `${gameState.player1.hp}/100`;
    if (p1HPBar) {
      p1HPBar.style.width = `${(gameState.player1.hp / 100) * 100}%`;
    }
  }
  
  if (p2HPElement) {
    p2HPElement.textContent = `${gameState.player2.hp}/100`;
    if (p2HPBar) {
      p2HPBar.style.width = `${(gameState.player2.hp / 100) * 100}%`;
    }
  }
  
  // Update turn indicator
  const turnElement = document.getElementById('currentTurn');
  if (turnElement) {
    turnElement.textContent = gameState.currentPlayer === 1 ? 'Your Turn' : 'AI Turn';
    turnElement.className = gameState.currentPlayer === 1 ? 'your-turn' : 'ai-turn';
  }
}

// End game
function endGame(playerWon) {
  gameState.isGameActive = false;
  
  const message = playerWon ? 'Victory!' : 'Defeat!';
  const details = playerWon ? 'You have won the battle!' : 'The AI has defeated you.';
  
  log(message);
  
  // Show game over screen
  showGameOverScreen(playerWon, message, details);
}

// Show game over screen
function showGameOverScreen(won, title, message) {
  const gameOverDiv = document.createElement('div');
  gameOverDiv.className = 'game-over-screen';
  gameOverDiv.innerHTML = `
    <div class="game-over-content">
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="game-over-buttons">
        <button onclick="restartGame()">New Game</button>
        <button onclick="returnToMenu()">Main Menu</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(gameOverDiv);
}

// Restart game
window.restartGame = function() {
  const gameOverScreen = document.querySelector('.game-over-screen');
  if (gameOverScreen) {
    gameOverScreen.remove();
  }
  initializeGame(gameState.player1.username);
};

// Return to menu
window.returnToMenu = function() {
  const gameOverScreen = document.querySelector('.game-over-screen');
  if (gameOverScreen) {
    gameOverScreen.remove();
  }
  
  // Show main menu
  document.getElementById('gameCanvas').style.display = 'none';
  document.getElementById('gameUI').style.display = 'none';
  document.getElementById('homepage').style.display = 'block';
  
  clearSceneAndState();
};

// Clear scene and reset state
function clearSceneAndState() {
  // Remove all card meshes from scene
  const objectsToRemove = [];
  scene.children.forEach(child => {
    if (child.userData instanceof Card) {
      objectsToRemove.push(child);
    }
  });
  
  objectsToRemove.forEach(obj => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => mat.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
  
  // Reset game state
  gameState.player1.hand = [];
  gameState.player1.playedCards = [];
  gameState.player2.hand = [];
  gameState.player2.playedCards = [];
  gameState.selectedCard = null;
  gameState.draggingCard = null;
  gameState.isPaused = false;
  gameState.isGameActive = false;
  gameState.animationInProgress = false;
}

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function onMouseMove(event) {
  if (gameState.isPaused || !gameState.isGameActive) return;
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(scene.children);
  const tooltip = document.getElementById('cardTooltip');
  
  let hovered = false;
  
  if (intersects.length > 0) {
    const card = intersects[0].object.userData;
    if (card instanceof Card && gameState.player1.hand.includes(card) && !card.isZoomed) {
      hovered = true;
      card.mesh.scale.set(1.3, 1.3, 1.3);
      card.mesh.position.z = 2;
      
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        tooltip.innerHTML = `${card.data.name}<br>Attack: ${card.data.atk}`;
      }
    }
  }
  
  if (!hovered) {
    gameState.player1.hand.forEach(card => {
      if (!card.isZoomed) { // Don't reset scale of zoomed card
        card.mesh.scale.set(1, 1, 1);
        card.targetPosition.z = 0.5;
      }
    });
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
}

export function onMouseClick(event) {
  if (gameState.isPaused || !gameState.isGameActive) return;
  if (gameState.currentPlayer !== 1) return;
  if (gameState.animationInProgress) return; // Don't allow clicks during animations
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    const card = intersects[0].object.userData;
    if (card instanceof Card && gameState.player1.hand.includes(card) && !gameState.zoomedCard) {
      showCardZoom(card);
    }
  }
}

// Show card zoom by flying card to right side
function showCardZoom(card) {
  if (gameState.animationInProgress || gameState.zoomedCard) return;
  
  gameState.zoomedCard = card;
  gameState.animationInProgress = true;
  
  // Store original position and scale
  card.originalPosition = card.mesh.position.clone();
  card.originalScale = card.mesh.scale.clone();
  card.originalRotation = card.mesh.rotation.clone();
  
  // Calculate target position (right side of screen where green X is marked)
  const targetPosition = new THREE.Vector3(7, 1, 2);
  const targetScale = new THREE.Vector3(3, 3, 3); // 3x larger
  const targetRotation = new THREE.Vector3(0, 0, 0);
  
  // Animate card flying to right side and enlarging
  animateCardToZoom(card, targetPosition, targetScale, targetRotation).then(() => {
    // Set final zoom position and scale, mark as zoomed to prevent repositioning
    card.mesh.position.copy(targetPosition);
    card.mesh.scale.copy(targetScale);
    card.mesh.rotation.copy(targetRotation);
    card.isZoomed = true; // Prevent automatic repositioning
    
    // Show info panel after animation completes
    showZoomInfoPanel(card);
    gameState.animationInProgress = false;
  });
}

// Animate card to zoom position
function animateCardToZoom(card, targetPosition, targetScale, targetRotation) {
  return new Promise((resolve) => {
    const duration = 800; // 0.8 seconds
    const startTime = Date.now();
    const startPosition = card.mesh.position.clone();
    const startScale = card.mesh.scale.clone();
    const startRotation = card.mesh.rotation.clone();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate position
      card.mesh.position.lerpVectors(startPosition, targetPosition, eased);
      
      // Interpolate scale
      card.mesh.scale.lerpVectors(startScale, targetScale, eased);
      
      // Interpolate rotation
      card.mesh.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
      card.mesh.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;
      card.mesh.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    animate();
  });
}

// Show info panel on right side
function showZoomInfoPanel(card) {
  const panel = document.getElementById('cardZoomPanel');
  const nameEl = document.getElementById('cardZoomName');
  const attackEl = document.getElementById('cardZoomAttack');
  const descriptionEl = document.getElementById('cardZoomDescription');
  
  // Populate panel with card data
  nameEl.textContent = card.data.name;
  attackEl.textContent = card.data.atk;
  descriptionEl.textContent = `This powerful card deals ${card.data.atk} damage to your opponent. Use it wisely in battle!`;
  
  // Show panel
  panel.style.display = 'block';
}

// Close card zoom and return card to original position
function closeCardZoom() {
  if (!gameState.zoomedCard) return;
  
  const card = gameState.zoomedCard;
  const panel = document.getElementById('cardZoomPanel');
  
  // Hide info panel
  panel.style.display = 'none';
  
  // Animate card back to original position
  if (card.originalPosition && card.originalScale && card.originalRotation) {
    gameState.animationInProgress = true;
    
    animateCardFromZoom(card, card.originalPosition, card.originalScale, card.originalRotation).then(() => {
      // Clean up and re-enable repositioning
      card.isZoomed = false; // Allow repositioning again
      delete card.originalPosition;
      delete card.originalScale;
      delete card.originalRotation;
      gameState.zoomedCard = null;
      gameState.animationInProgress = false;
      updateBoard(); // Re-position cards properly
    });
  } else {
    // If no original position stored, just clear zoom state
    if (card) card.isZoomed = false;
    gameState.zoomedCard = null;
    gameState.animationInProgress = false;
  }
}

// Animate card back from zoom position
function animateCardFromZoom(card, targetPosition, targetScale, targetRotation) {
  return new Promise((resolve) => {
    const duration = 600; // Slightly faster return
    const startTime = Date.now();
    const startPosition = card.mesh.position.clone();
    const startScale = card.mesh.scale.clone();
    const startRotation = card.mesh.rotation.clone();
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate position
      card.mesh.position.lerpVectors(startPosition, targetPosition, eased);
      
      // Interpolate scale
      card.mesh.scale.lerpVectors(startScale, targetScale, eased);
      
      // Interpolate rotation
      card.mesh.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
      card.mesh.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;
      card.mesh.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    animate();
  });
}

// Confirm and play the zoomed card
function confirmPlayCard() {
  if (gameState.zoomedCard) {
    const card = gameState.zoomedCard;
    const panel = document.getElementById('cardZoomPanel');
    
    // Hide info panel immediately
    panel.style.display = 'none';
    
    // Clear zoom state and allow repositioning for play animation
    card.isZoomed = false;
    gameState.zoomedCard = null;
    
    // Clean up zoom positioning data
    delete card.originalPosition;
    delete card.originalScale;
    delete card.originalRotation;
    
    // Play the card directly (it will animate across the battlefield)
    playCard(card);
  }
}

// Make functions globally accessible
window.closeCardZoom = closeCardZoom;
window.confirmPlayCard = confirmPlayCard;

// Animation loop
export function animate() {
  if (!gameState.isPaused) {
    requestAnimationFrame(animate);
    
    // Update all cards
    [...gameState.player1.hand, ...gameState.player1.playedCards].forEach(card => {
      if (card.update) card.update();
    });
    [...gameState.player2.hand, ...gameState.player2.playedCards].forEach(card => {
      if (card.update) card.update();
    });
    
    renderer.render(scene, camera);
  }
}

// Logging function
function log(message) {
  console.log(message);
  const logElement = document.getElementById('gameLog');
  if (logElement) {
    logElement.innerHTML += `<div>${message}</div>`;
    logElement.scrollTop = logElement.scrollHeight;
  }
}

// Event listeners
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick);

// Export for global access
window.initializeGame = initializeGame;
window.loginPlayer = loginPlayer;