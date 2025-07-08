// game.js - Simplified PvP Card Battle Game

import { cardData, Card } from './cards.js';
import { shuffle } from './utils.js';
import { scene, camera, renderer } from './threeSetup.js';
import { mobileState } from './mobile.js';

// Debug: Check if Card class is properly imported
console.log('Card class imported:', Card);

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
  zoomedCard: null, // Card currently being viewed in zoom modal
  refereeMode: false, // Whether referee evaluation is enabled
  pendingEvaluation: null // Card waiting for referee approval
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
  
  // Initialize referee integration
  initializeRefereeIntegration();
  
  // Make sure mobile state is available
  if (typeof mobileState === 'undefined') {
    // Fallback if mobile module not loaded
    window.mobileState = { isMobile: false };
  }
  
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
  
  // Played cards (left side, face down, stacked)
  gameState.player1.playedCards.slice(-10).forEach((card, index) => {
    const stackOffset = index * 0.1;
    card.targetPosition.set(
      -7, 
      -2 + stackOffset, 
      0.1 + stackOffset
    );
    card.targetRotation.set(0, 0, 0); // Keep flat
    card.targetScale.set(0.8, 0.8, 0.8);
    card.showBack(); // Show card back
  });
  
  gameState.player2.playedCards.slice(-10).forEach((card, index) => {
    const stackOffset = index * 0.1;
    card.targetPosition.set(
      -7, 
      2 + stackOffset, 
      0.1 + stackOffset
    );
    card.targetRotation.set(0, 0, 0); // Keep flat
    card.targetScale.set(0.8, 0.8, 0.8);
    card.showBack(); // Show card back
  });
}

// Play a card
export async function playCard(card) {
  if (!gameState.isGameActive || gameState.animationInProgress) return;
  if (gameState.currentPlayer !== 1) return; // Only player 1 can click
  if (!gameState.player1.hand.includes(card)) return;
  
  // Check if referee mode is enabled
  console.log('Referee mode status:', gameState.refereeMode);
  if (gameState.refereeMode) {
    console.log('Redirecting to referee evaluation');
    await sendCardForEvaluation(card);
    return;
  }
  
  gameState.animationInProgress = true;
  
  // Remove card from hand
  const cardIndex = gameState.player1.hand.indexOf(card);
  gameState.player1.hand.splice(cardIndex, 1);
  
  // Ensure card starts at normal scale (1x) before flying
  card.mesh.scale.set(1, 1, 1);
  
  // Animate card flying across screen
  await animateCardFlight(card, true);
  
  // Deal damage
  const damage = card.data.atk;
  gameState.player2.hp = Math.max(0, gameState.player2.hp - damage);
  
  // Update via API if online
  if (gameState.gameSession) {
    await playCardAPI(card.data.id, damage);
  }
  
  // Move to played cards (will be handled by animation)
  gameState.player1.playedCards.push(card);
  
  // Draw new card
  drawCard(gameState.player1);
  
  log(`You played ${card.data.name} dealing ${damage} damage! Enemy HP: ${gameState.player2.hp}`);
  
  // Check win condition
  if (gameState.player2.hp <= 0) {
    endGame(true);
    return;
  }
  
  // Switch to AI turn after animation completes
  setTimeout(() => {
    gameState.currentPlayer = 2;
    updateBoard();
    updateUI();
    
    // AI plays after short delay
    setTimeout(async () => {
      await aiPlayCard();
      gameState.animationInProgress = false;
    }, 1500);
  }, 2000); // Wait for damage animation to complete
}

// AI plays a card
async function aiPlayCard() {
  if (!gameState.isGameActive) return;
  if (gameState.player2.hand.length === 0) return;
  
  // AI picks random card for now
  const randomIndex = Math.floor(Math.random() * gameState.player2.hand.length);
  const aiCard = gameState.player2.hand[randomIndex];
  
  // Check if referee mode is enabled for AI cards too
  if (gameState.refereeMode) {
    console.log('AI card needs referee evaluation:', aiCard.data.name);
    await sendAICardForEvaluation(aiCard);
    return;
  }
  
  // Execute AI card play normally
  await executeAICardPlay(aiCard);
}

// Send AI card for referee evaluation
async function sendAICardForEvaluation(card) {
  console.log('Sending AI card for evaluation:', card.data.name);
  gameState.pendingEvaluation = card;
  
  const evaluationData = {
    id: `${card.data.id}_${Date.now()}_AI`, // Unique ID for AI evaluation
    name: card.data.name,
    atk: card.data.atk,
    imagePath: card.data.imagePath,
    playerName: gameState.player2.username || 'AI Opponent',
    targetPlayer: 'Player',
    isAI: true, // Flag to indicate this is an AI card
    timestamp: new Date().toISOString()
  };
  
  // Add to pending evaluations queue
  const pendingEvaluations = JSON.parse(localStorage.getItem('pendingCardEvaluations') || '[]');
  pendingEvaluations.push(evaluationData);
  localStorage.setItem('pendingCardEvaluations', JSON.stringify(pendingEvaluations));
  
  console.log('AI card evaluation stored:', evaluationData);
  
  // Update game state for referee
  saveGameStateForReferee();
  
  log(`AI card sent for referee evaluation: ${card.data.name}`);
  
  // Wait for referee decision
  waitForAIRefereeDecision(evaluationData.id);
}

// Wait for AI card referee decision
function waitForAIRefereeDecision(evaluationId) {
  const checkForResult = () => {
    const result = localStorage.getItem('cardEvaluationResult');
    if (result) {
      try {
        const evaluation = JSON.parse(result);
        if (evaluation.cardId === evaluationId) {
          localStorage.removeItem('cardEvaluationResult');
          handleAIRefereeDecision(evaluation);
          return;
        }
      } catch (error) {
        console.error('Error parsing AI evaluation result:', error);
      }
    }
    
    // Continue polling if game is still active
    if (gameState.isGameActive && gameState.pendingEvaluation) {
      setTimeout(checkForResult, 500);
    }
  };
  
  checkForResult();
}

// Handle AI card referee decision
async function handleAIRefereeDecision(evaluation) {
  if (!gameState.pendingEvaluation) return;
  
  const card = gameState.pendingEvaluation;
  gameState.pendingEvaluation = null;
  
  if (evaluation.approved) {
    // Execute AI card play with potentially modified damage
    const damage = evaluation.modifiedDamage || card.data.atk;
    await executeAICardPlay(card, damage);
    
    if (evaluation.modifiedDamage && evaluation.modifiedDamage !== card.data.atk) {
      log(`Referee modified AI damage: ${card.data.atk} → ${damage}`);
    } else {
      log(`Referee approved AI card: ${card.data.name}`);
    }
  } else {
    // AI card was rejected - AI draws a new card and continues
    log(`Referee rejected AI card: ${card.data.name}`);
    drawCard(gameState.player2);
    
    // Switch back to player turn
    gameState.currentPlayer = 1;
    updateBoard();
    updateUI();
    gameState.animationInProgress = false;
  }
  
  saveGameStateForReferee();
}

// Execute AI card play with specified damage
async function executeAICardPlay(card, damage = null) {
  // Remove from AI hand
  const cardIndex = gameState.player2.hand.indexOf(card);
  if (cardIndex !== -1) {
    gameState.player2.hand.splice(cardIndex, 1);
  }
  
  // Reveal and animate
  card.reveal();
  // Ensure card starts at normal scale (1x) before flying
  card.mesh.scale.set(1, 1, 1);
  await animateCardFlight(card, false);
  
  // Deal specified damage (potentially modified by referee)
  const finalDamage = damage || card.data.atk;
  gameState.player1.hp = Math.max(0, gameState.player1.hp - finalDamage);
  
  // Move to played cards
  gameState.player2.playedCards.push(card);
  
  // Draw new card
  drawCard(gameState.player2);
  
  log(`AI played ${card.data.name} dealing ${finalDamage} damage! Your HP: ${gameState.player1.hp}`);
  
  // Check win condition
  if (gameState.player1.hp <= 0) {
    endGame(false);
    return;
  }
  
  // Switch back to player after animation completes
  setTimeout(() => {
    gameState.currentPlayer = 1;
    updateBoard();
    updateUI();
  }, 2000); // Wait for damage animation to complete
}

// Animate card flying to center and inflicting damage
function animateCardFlight(card, playerToAI) {
  return new Promise((resolve) => {
    const startY = playerToAI ? -5 : 5;
    const centerY = 0; // Center of battlefield
    // Faster animation on mobile for better performance
    const duration = (mobileState && mobileState.isMobile) ? 750 : 1000; // 0.75s on mobile, 1s on desktop
    const startTime = Date.now();
    
    // Store starting position and scale
    const startX = card.mesh.position.x;
    const startZ = card.mesh.position.z;
    const startScale = 1; // Always start from 1x
    const targetScale = 2; // End at 2x
    
    // Disable automatic updates during animation
    card.isZoomed = true;
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth animation curve
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Calculate position - move to center while flying
      const currentX = startX + (0 - startX) * eased; // Move to center X
      const currentY = startY + (centerY - startY) * eased;
      const currentZ = startZ + (2 - startZ) * eased + Math.sin(progress * Math.PI) * 1; // Arc motion
      
      // Scale up while flying: 1x to 2x
      const currentScale = startScale + (targetScale - startScale) * eased;
      
      // Apply position and scale directly (bypass update() method)
      card.mesh.position.set(currentX, currentY, currentZ);
      card.mesh.scale.set(currentScale, currentScale, currentScale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Keep card in center at 2x size briefly
        setTimeout(() => {
          // Show damage animation
          showDamageAnimation(card, playerToAI);
          resolve();
        }, 500);
      }
    }
    
    animate();
  });
}

// Show damage animation with floating damage number
function showDamageAnimation(card, playerToAI) {
  const damage = card.data.atk;
  
  // Create floating damage text
  const damageElement = document.createElement('div');
  damageElement.className = 'damage-animation';
  damageElement.textContent = `-${damage}`;
  damageElement.style.cssText = `
    position: fixed;
    left: 50%;
    top: ${playerToAI ? '20%' : '80%'};
    transform: translateX(-50%);
    font-size: 48px;
    font-weight: bold;
    color: #FF0000;
    font-family: 'Orbitron', sans-serif;
    text-shadow: 0 0 10px #FF0000, 0 0 20px #FF0000;
    z-index: 1000;
    pointer-events: none;
    animation: damageFloat 2s ease-out forwards;
  `;
  
  document.body.appendChild(damageElement);
  
  // Remove after animation
  setTimeout(() => {
    damageElement.remove();
  }, 2000);
  
  // Move card to played cards area after damage shown
  setTimeout(() => {
    // Re-enable automatic updates for the move to played area
    card.isZoomed = false;
    moveCardToPlayedArea(card, playerToAI);
  }, 1000);
}

// Move card to played cards area (left side, face down, stacked)
function moveCardToPlayedArea(card, playerToAI) {
  const player = playerToAI ? gameState.player1 : gameState.player2;
  const playedCards = player.playedCards;
  
  // Position on left side, stacked
  const stackOffset = playedCards.length * 0.1; // Small offset for stacking
  const baseY = playerToAI ? -2 : 2;
  
  const finalPosition = new THREE.Vector3(-7, baseY + stackOffset, 0.1 + stackOffset);
  const finalScale = new THREE.Vector3(0.8, 0.8, 0.8);
  
  // Animate to final position - faster on mobile
  const duration = (mobileState && mobileState.isMobile) ? 600 : 800;
  const startTime = Date.now();
  const startPos = card.mesh.position.clone();
  const startScale = card.mesh.scale.clone(); // Keep current 2x scale
  
  function animateToPlayedArea() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    
    // Animate position
    const currentPos = startPos.clone().lerp(finalPosition, eased);
    card.mesh.position.copy(currentPos);
    
    // Animate scale down from 2x to 0.8x
    const currentScale = startScale.clone().lerp(finalScale, eased);
    card.mesh.scale.copy(currentScale);
    
    // Animate rotation to show card back (face down)
    card.mesh.rotation.y = Math.PI * eased;
    
    if (progress < 1) {
      requestAnimationFrame(animateToPlayedArea);
    } else {
      // Set final values
      card.targetPosition.copy(finalPosition);
      card.targetRotation.set(0, Math.PI, 0);
      card.targetScale.copy(finalScale);
    }
  }
  
  animateToPlayedArea();
}

// Draw a new card
function drawCard(player) {
  if (gameState.availableCards.length === 0) return;
  
  const randomCard = gameState.availableCards[
    Math.floor(Math.random() * gameState.availableCards.length)
  ];
  
  const newCard = new Card(randomCard, player === gameState.player1);
  player.hand.push(newCard);
  
  // Immediately position the new card in the correct hand position (not center)
  const centerSpacing = 2.5;
  const handIndex = player.hand.length - 1; // New card is at end of hand
  const totalCards = player.hand.length;
  
  if (player === gameState.player1) {
    // Player 1 hand (bottom)
    newCard.targetPosition.set(
      (handIndex - (totalCards - 1) / 2) * centerSpacing, 
      -5, 
      0.5
    );
    newCard.mesh.position.copy(newCard.targetPosition); // Set immediately, no animation from center
  } else {
    // Player 2 hand (top)
    newCard.targetPosition.set(
      (handIndex - (totalCards - 1) / 2) * centerSpacing, 
      5, 
      0.5
    );
    newCard.mesh.position.copy(newCard.targetPosition); // Set immediately, no animation from center
  }
  
  newCard.targetRotation.set(0, 0, 0);
  newCard.targetScale.set(1, 1, 1);
}

// Update UI
function updateUI() {
  // Update new compact HP displays
  const p1HPText = document.getElementById('player1HPText');
  const p2HPText = document.getElementById('player2HPText');
  const p1HPFill = document.getElementById('player1HPFill');
  const p2HPFill = document.getElementById('player2HPFill');
  
  if (p1HPText) {
    p1HPText.textContent = `${gameState.player1.hp}`;
    if (p1HPFill) {
      p1HPFill.style.width = `${(gameState.player1.hp / 100) * 100}%`;
    }
  }
  
  if (p2HPText) {
    p2HPText.textContent = `${gameState.player2.hp}`;
    if (p2HPFill) {
      p2HPFill.style.width = `${(gameState.player2.hp / 100) * 100}%`;
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
  showGameOverScreen(message, details);
}

// Show game over screen
function showGameOverScreen(title, message) {
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
  
  // Get proper canvas coordinates
  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(scene.children);
  console.log('Mouse click - intersects:', intersects.length, 'at', mouse.x, mouse.y);
  
  if (intersects.length > 0) {
    const card = intersects[0].object.userData;
    console.log('Clicked object:', card);
    
    if (card instanceof Card && gameState.player1.hand.includes(card) && !gameState.zoomedCard) {
      console.log('Showing card zoom for:', card.data.name);
      showCardZoom(card);
    } else if (card instanceof Card && card === gameState.zoomedCard) {
      console.log('Clicked on zoomed card, closing zoom');
      closeCardZoom();
    }
  }
}

// Show card zoom by flying card to left side
function showCardZoom(card) {
  if (gameState.animationInProgress || gameState.zoomedCard) return;
  
  gameState.zoomedCard = card;
  gameState.animationInProgress = true;
  
  // Store original position and scale
  card.originalPosition = card.mesh.position.clone();
  card.originalScale = card.mesh.scale.clone();
  card.originalRotation = card.mesh.rotation.clone();
  
  // Calculate target position (left side of screen)
  const targetPosition = new THREE.Vector3(-7, 1, 2);
  const targetScale = new THREE.Vector3(3, 3, 3); // 3x larger
  const targetRotation = new THREE.Vector3(0, 0, 0);
  
  // Animate card flying to left side and enlarging
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
    const duration = 400; // 0.4 seconds - faster animation
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
  
  // Check if all elements exist
  if (!panel || !nameEl || !attackEl || !descriptionEl) {
    console.error('Card zoom panel elements not found:', { panel, nameEl, attackEl, descriptionEl });
    return;
  }
  
  // Populate panel with card data
  nameEl.textContent = card.data.name;
  attackEl.textContent = card.data.atk;
  descriptionEl.textContent = `This powerful card deals ${card.data.atk} damage to your opponent. Use it wisely in battle!`;
  
  // Show panel
  panel.style.display = 'block';
  console.log('Card zoom panel shown for:', card.data.name);
}

// Close card zoom and return card to original position
function closeCardZoom() {
  if (!gameState.zoomedCard) return;
  
  const card = gameState.zoomedCard;
  const panel = document.getElementById('cardZoomPanel');
  
  // Hide info panel
  if (panel) {
    panel.style.display = 'none';
  }
  
  console.log('Closing card zoom for:', card.data.name);
  
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
    
    // First return card to hand position, then play it
    returnCardToHandThenPlay(card);
  }
}

// Return card from zoom to hand position, then play it
function returnCardToHandThenPlay(card) {
  if (!card.originalPosition || !card.originalScale) return;
  
  gameState.animationInProgress = true;
  
  // Animate back to original hand position - faster on mobile
  const duration = (mobileState && mobileState.isMobile) ? 400 : 600; // 0.4s on mobile, 0.6s on desktop
  const startTime = Date.now();
  const startPosition = card.mesh.position.clone();
  const startScale = card.mesh.scale.clone();
  const targetPosition = card.originalPosition.clone();
  const targetScale = card.originalScale.clone();
  
  function animateReturn() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate back to hand position
    card.mesh.position.lerpVectors(startPosition, targetPosition, eased);
    card.mesh.scale.lerpVectors(startScale, targetScale, eased);
    
    if (progress < 1) {
      requestAnimationFrame(animateReturn);
    } else {
      // Now clear zoom state and play the card
      card.isZoomed = false;
      gameState.zoomedCard = null;
      
      // Clean up zoom positioning data
      delete card.originalPosition;
      delete card.originalScale;
      delete card.originalRotation;
      
      // Reset animation state so playCard can proceed
      gameState.animationInProgress = false;
      
      // Now play the card (it will enlarge while flying to center)
      playCard(card);
    }
  }
  
  animateReturn();
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

// Referee Integration Functions

// Send card for referee evaluation
async function sendCardForEvaluation(card) {
  console.log('Sending card for evaluation:', card.data.name);
  gameState.pendingEvaluation = card;
  
  const evaluationData = {
    id: `${card.data.id}_${Date.now()}`, // Unique ID for this evaluation
    name: card.data.name,
    atk: card.data.atk,
    imagePath: card.data.imagePath,
    playerName: gameState.player1.username || 'Player 1',
    targetPlayer: 'Opponent',
    timestamp: new Date().toISOString()
  };
  
  // Add to pending evaluations queue
  const pendingEvaluations = JSON.parse(localStorage.getItem('pendingCardEvaluations') || '[]');
  pendingEvaluations.push(evaluationData);
  localStorage.setItem('pendingCardEvaluations', JSON.stringify(pendingEvaluations));
  
  console.log('Pending evaluations stored:', pendingEvaluations);
  
  // Update game state for referee
  saveGameStateForReferee();
  
  log(`Card sent for referee evaluation: ${card.data.name}`);
  
  // Wait for referee decision
  waitForRefereeDecision(evaluationData.id);
}

// Save current game state for referee view
function saveGameStateForReferee() {
  const refereeGameState = {
    player1: {
      username: gameState.player1.username,
      hp: gameState.player1.hp,
      maxHp: gameState.player1.maxHp,
      handCount: gameState.player1.hand.length
    },
    player2: {
      username: gameState.player2.username,
      hp: gameState.player2.hp,
      maxHp: gameState.player2.maxHp,
      handCount: gameState.player2.hand.length
    },
    currentPlayer: gameState.currentPlayer,
    isGameActive: gameState.isGameActive,
    isPaused: gameState.isPaused,
    lastUpdate: new Date().toISOString()
  };
  
  localStorage.setItem('battleArenaGameState', JSON.stringify(refereeGameState));
}

// Wait for referee decision
function waitForRefereeDecision(evaluationId) {
  const checkForResult = () => {
    const result = localStorage.getItem('cardEvaluationResult');
    if (result) {
      try {
        const evaluation = JSON.parse(result);
        if (evaluation.cardId === evaluationId) {
          localStorage.removeItem('cardEvaluationResult');
          handleRefereeDecision(evaluation);
          return;
        }
      } catch (error) {
        console.error('Error parsing evaluation result:', error);
      }
    }
    
    // Check for game actions from referee
    const gameAction = localStorage.getItem('gameAction');
    if (gameAction) {
      try {
        const action = JSON.parse(gameAction);
        localStorage.removeItem('gameAction');
        handleRefereeAction(action);
      } catch (error) {
        console.error('Error parsing game action:', error);
      }
    }
    
    // Continue polling if game is still active
    if (gameState.isGameActive && gameState.pendingEvaluation) {
      setTimeout(checkForResult, 500);
    }
  };
  
  checkForResult();
}

// Handle referee decision
async function handleRefereeDecision(evaluation) {
  if (!gameState.pendingEvaluation) return;
  
  const card = gameState.pendingEvaluation;
  gameState.pendingEvaluation = null;
  
  if (evaluation.approved) {
    // Execute card play with potentially modified damage
    const damage = evaluation.modifiedDamage || card.data.atk;
    await executeCardPlay(card, damage);
    
    if (evaluation.modifiedDamage && evaluation.modifiedDamage !== card.data.atk) {
      log(`Referee modified damage: ${card.data.atk} → ${damage}`);
    } else {
      log(`Referee approved: ${card.data.name}`);
    }
  } else {
    // Card was rejected - return to hand and allow new selection
    log(`Referee rejected: ${card.data.name}`);
    gameState.animationInProgress = false;
  }
  
  saveGameStateForReferee();
}

// Execute card play with specified damage
async function executeCardPlay(card, damage) {
  gameState.animationInProgress = true;
  
  // Remove card from hand
  const cardIndex = gameState.player1.hand.indexOf(card);
  gameState.player1.hand.splice(cardIndex, 1);
  
  // Ensure card starts at normal scale (1x) before flying
  card.mesh.scale.set(1, 1, 1);
  
  // Animate card flying across screen
  await animateCardFlight(card, true);
  
  // Deal specified damage (potentially modified by referee)
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
  
  // Switch to AI turn after animation completes
  setTimeout(() => {
    gameState.currentPlayer = 2;
    updateBoard();
    updateUI();
    
    // AI plays after short delay
    setTimeout(async () => {
      await aiPlayCard();
      gameState.animationInProgress = false;
    }, 1500);
  }, 2000); // Wait for damage animation to complete
}

// Handle referee actions (pause, resume, restart)
function handleRefereeAction(action) {
  switch (action.action) {
    case 'pause':
      gameState.isPaused = true;
      log('Game paused by referee');
      break;
    case 'resume':
      gameState.isPaused = false;
      log('Game resumed by referee');
      animate(); // Restart animation loop if needed
      break;
    case 'restart':
      location.reload(); // Simple restart - reload the page
      break;
  }
  
  saveGameStateForReferee();
}

// Toggle referee mode
window.toggleRefereeMode = function() {
  gameState.refereeMode = !gameState.refereeMode;
  const status = gameState.refereeMode ? 'enabled' : 'disabled';
  console.log(`Referee mode ${status}`);
  log(`Referee mode ${status}`);
  
  // Update UI to show referee mode status
  updateRefereeUI();
};

// Update UI to show referee mode status
function updateRefereeUI() {
  let refereeIndicator = document.getElementById('refereeIndicator');
  
  if (gameState.refereeMode) {
    if (!refereeIndicator) {
      refereeIndicator = document.createElement('div');
      refereeIndicator.id = 'refereeIndicator';
      refereeIndicator.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          left: 20px;
          background: linear-gradient(135deg, #FFD700, #FF8C00);
          color: black;
          padding: 10px 15px;
          border-radius: 8px;
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          z-index: 1000;
          border: 2px solid #FF0000;
        ">
          ⚖️ REFEREE MODE ACTIVE
          <br><small>Cards require approval</small>
        </div>
      `;
      document.body.appendChild(refereeIndicator);
    }
  } else if (refereeIndicator) {
    refereeIndicator.remove();
  }
}

// Initialize referee polling on game start
function initializeRefereeIntegration() {
  // Check if referee mode should be enabled (you can modify this logic)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('referee') === 'true') {
    gameState.refereeMode = true;
    updateRefereeUI();
  }
  
  // Start periodic game state saving for referee
  setInterval(() => {
    if (gameState.isGameActive) {
      saveGameStateForReferee();
    }
  }, 2000);
}

// Export for global access
window.initializeGame = initializeGame;
window.loginPlayer = loginPlayer;
window.toggleRefereeMode = toggleRefereeMode;