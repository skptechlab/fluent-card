// game.js - Simplified PvP Card Battle Game

import { cardData, Card, specialEffectCards, isSpecialEffectCard } from './cards.js';
import { shuffle } from './utils.js';
import { scene, camera, renderer } from './threeSetup.js';
import { mobileState } from './mobile.js';
import { getSpecialEffectProcessor, initializeSpecialEffectProcessor, SPECIAL_EFFECTS } from './specialEffects.js';

// Debug: Check if Card class is properly imported
console.log('Card class imported:', Card);

export const gameState = {
  player1: { id: null, username: null, hp: 500, maxHp: 500, hand: [], playedCards: [] },
  player2: { id: null, username: null, hp: 500, maxHp: 500, hand: [], playedCards: [] },
  currentPlayer: 1,
  gameSession: null,
  selectedCard: null,
  selectedCards: [], // Array of selected cards for multi-card play
  battlefieldCards: [], // Cards placed in battlefield center awaiting battle
  fieldEffects: [], // Special effect cards placed on field (right side)
  activeEffects: [], // Currently active special effects with duration
  turnPhase: 'selecting', // 'selecting', 'battlefield', 'battle'
  draggingCard: null,
  isPaused: false,
  isGameActive: false,
  animationInProgress: false,
  availableCards: [],
  currentPlayerObj: null, // For authentication
  zoomedCard: null, // Card currently being viewed in zoom modal
  refereeMode: false, // Whether referee evaluation is enabled
  pendingEvaluation: null, // Card waiting for referee approval
  isMultiplayer: false, // Whether this is a multiplayer game
  gameMode: 'single', // 'single', 'multiplayer', 'spectator'
  roomState: null, // Current room state from sync
  currentTurnPlayerId: null // Player ID whose turn it is (for multiplayer)
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
      // Always include special effects even if API provides cards
      gameState.availableCards = [...result.data.cards, ...specialEffectCards];
      log(`Loaded ${result.data.count} cards + ${specialEffectCards.length} special effects`);
    } else {
      // Fallback to local cards if API fails
      gameState.availableCards = [...cardData, ...specialEffectCards];
      log('Using local card data');
    }
  } catch (error) {
    gameState.availableCards = [...cardData, ...specialEffectCards];
    log('Using local card data due to API error');
  }
  
  // Debug: Log special effects count
  const specialCount = gameState.availableCards.filter(card => isSpecialEffectCard(card)).length;
  log(`📋 Available cards: ${gameState.availableCards.length} total, ${specialCount} special effects`);
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

// Functions will be exported globally at the end of the file

// Initialize game
export async function initializeGame(username = null, gameMode = 'single') {
  clearSceneAndState();
  
  // Add CSS animations for damage effects
  addDamageAnimations();
  
  // Load cards first
  await loadCards();
  
  // Set up players based on game mode
  if (gameMode === 'multiplayer' || gameMode === 'spectator') {
    // Multiplayer mode setup
    gameState.isMultiplayer = true;
    gameState.gameMode = gameMode;
    
    if (gameState.currentPlayerObj) {
      gameState.player1.id = gameState.currentPlayerObj.id;
      gameState.player1.username = gameState.currentPlayerObj.username;
      console.log('Multiplayer: Using logged player ID:', gameState.player1.id);
    } else {
      // Guest mode for multiplayer - but try to get saved student info
      const savedStudent = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('currentStudent') : null;
      if (savedStudent) {
        try {
          const studentInfo = JSON.parse(savedStudent);
          gameState.player1.id = studentInfo.id;
          gameState.player1.username = studentInfo.username;
          console.log('Multiplayer: Using saved student ID:', gameState.player1.id);
        } catch (e) {
          console.error('Failed to parse saved student info');
          gameState.player1.id = Date.now();
          gameState.player1.username = username || 'Guest';
        }
      } else {
        gameState.player1.id = Date.now();
        gameState.player1.username = username || 'Guest';
        console.log('Multiplayer: Using generated guest ID:', gameState.player1.id);
      }
    }
    
    // In multiplayer, player 2 will be set dynamically from room state
    gameState.player2.id = null;
    gameState.player2.username = 'Player 2';
    
    // Don't start game immediately in multiplayer - wait for room sync
    gameState.isGameActive = false;
    
    log(`Multiplayer mode initialized as ${gameMode}. Waiting for room sync...`);
  } else {
    // Single player mode (vs AI)
    gameState.isMultiplayer = false;
    gameState.gameMode = 'single';
    
    if (username && gameState.currentPlayerObj) {
      gameState.player1.id = gameState.currentPlayerObj.id;
      gameState.player1.username = gameState.currentPlayerObj.username;
    } else {
      // Guest mode
      gameState.player1.id = Date.now(); // Temporary ID for guest
      gameState.player1.username = username || 'Guest';
    }
    
    // Player 2 is AI for single player
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
    
    // Initialize game state for single player
    gameState.player1.hp = 500;
    gameState.player2.hp = 500;
    gameState.currentPlayer = 1;
    gameState.turnPhase = 'selecting';
    gameState.selectedCards = [];
    gameState.battlefieldCards = [];
    gameState.isGameActive = true;
    
    // Deal cards for single player
    dealInitialCards();
    updateBoard();
    updateUI();
    
    log('Single player game initialized! Click cards to attack.');
  }
  
  // Initialize referee integration
  initializeRefereeIntegration();
  
  // Make sure mobile state is available
  if (typeof mobileState === 'undefined') {
    // Fallback if mobile module not loaded
    window.mobileState = { isMobile: false };
  }
  
  // Setup card zoom event listeners
  setTimeout(() => {
    setupCardZoomEventListeners();
  }, 100); // Small delay to ensure DOM is ready
  
  animate();
}

// Deal 5 cards to each player
function dealInitialCards() {
  const shuffledCards = shuffle([...gameState.availableCards]);
  
  // Deal 5 cards to each player - normal random selection
  for (let i = 0; i < 5; i++) {
    // Player 1 card - random from all available cards
    const p1CardData = gameState.availableCards[Math.floor(Math.random() * gameState.availableCards.length)];
    const p1Card = new Card(p1CardData, true);
    gameState.player1.hand.push(p1Card);
    
    // Player 2 card (AI) - regular cards
    const p2CardData = cardData[i % cardData.length];
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
  
  // Battlefield cards (center, side by side)
  gameState.battlefieldCards.forEach((card, index) => {
    const totalCards = gameState.battlefieldCards.length;
    const totalWidth = (totalCards - 1) * centerSpacing;
    const startX = -totalWidth / 2;
    
    card.targetPosition.set(
      startX + (index * centerSpacing), 
      0, 
      2
    );
    card.targetRotation.set(0, 0, 0);
    card.targetScale.set(1.5, 1.5, 1.5);
  });
  
  // Special effect cards (right side, face up, stacked)
  gameState.fieldEffects.forEach((card, index) => {
    const stackOffset = index * 0.1;
    card.targetPosition.set(
      7, 
      0 + stackOffset, 
      0.1 + stackOffset
    );
    card.targetRotation.set(0, 0, 0); // Keep flat
    card.targetScale.set(1, 1, 1);
    // Keep face up to show special effect
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
  
  // Check turn permissions based on game mode
  if (gameState.isMultiplayer) {
    // In multiplayer, check if it's this player's turn based on room state
    if (!isPlayerTurn()) {
      log("It's not your turn!");
      return;
    }
  } else {
    // In single player, only player 1 can play
    if (gameState.currentPlayer !== 1) return;
  }
  
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
  
  // Check if this is a special effect card
  if (isSpecialEffectCard(card.data)) {
    await playSpecialEffectCard(card);
    return;
  }
  
  // Show sword animation above player card
  await showSwordAnimation(card);
  
  // Calculate damage with active effects
  let damage = card.data.atk;
  damage = applyActiveEffects(damage, card);
  
  // Deal damage
  gameState.player2.hp = Math.max(0, gameState.player2.hp - damage);
  
  // Show damage animation
  showDamageAnimation(damage, true); // true = player to AI
  
  // Update via API if online
  if (gameState.gameSession) {
    await playCardAPI(card.data.id, damage);
  }
  
  // Move to played cards array first
  gameState.player1.playedCards.push(card);
  
  // Animate card flying to played area
  await animateCardToPlayedArea(card);
  
  // Draw new card
  drawCard(gameState.player1);
  
  log(`You played ${card.data.name} dealing ${damage} damage! Enemy HP: ${gameState.player2.hp}`);
  
  // Check win condition
  if (gameState.player2.hp <= 0) {
    endGame(true);
    return;
  }
  
  // Handle turn switching based on game mode
  if (gameState.isMultiplayer) {
    // In multiplayer, update room state and let sync handle turn switching
    setTimeout(async () => {
      await updateMultiplayerGameState(card, damage);
      gameState.animationInProgress = false;
    }, 2000);
  } else {
    // Single player: Switch to AI turn after animation completes
    setTimeout(() => {
      gameState.currentPlayer = 2;
      processActiveEffects(); // Process turn-based effects
      updateBoard();
      updateUI();
      
      // AI plays after short delay
      setTimeout(async () => {
        await aiPlayCard();
        gameState.animationInProgress = false;
      }, 1500);
    }, 2000); // Wait for damage animation to complete
  }
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
  console.log(`AI playing card: ${card.data.name}`);
  
  // Remove from AI hand
  const cardIndex = gameState.player2.hand.indexOf(card);
  if (cardIndex !== -1) {
    gameState.player2.hand.splice(cardIndex, 1);
  }
  
  // Reveal card
  card.reveal();
  
  // Show sword animation above AI card (same as player)
  console.log('Showing AI sword animation...');
  await showSwordAnimation(card);
  
  // Deal specified damage (potentially modified by referee)
  const finalDamage = damage || card.data.atk;
  gameState.player1.hp = Math.max(0, gameState.player1.hp - finalDamage);
  
  // Show damage animation
  showDamageAnimation(finalDamage, false); // false = AI to player
  
  // Move to played cards array first
  gameState.player2.playedCards.push(card);
  
  // Animate card flying to AI's played area (left side, top)
  await animateAICardToPlayedArea(card);
  
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
    gameState.turnPhase = 'selecting';
    processActiveEffects(); // Process turn-based effects
    updateBoard();
    updateUI();
  }, 2000); // Wait for damage animation to complete
}

// Animate card flying to center and inflicting damage
function animateCardFlight(card, playerToAI, skipDamage = false) {
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
          // Show damage animation only if not skipping damage
          if (!skipDamage) {
            showDamageAnimation(card, playerToAI);
          } else {
            // If skipping damage, still move card to played area
            setTimeout(() => {
              card.isZoomed = false;
              moveCardToPlayedArea(card, playerToAI);
            }, 1000);
          }
          resolve();
        }, 500);
      }
    }
    
    animate();
  });
}

// Show damage animation with floating damage number
function showDamageAnimation(damage, playerToAI = true) {
  // Handle both card object and direct damage value
  const damageAmount = typeof damage === 'number' ? damage : damage.data.atk;
  
  // Create floating damage text
  const damageElement = document.createElement('div');
  damageElement.className = 'damage-animation';
  damageElement.textContent = `-${damageAmount}`;
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
  
  // Note: Card movement to played area is now handled in the new battle flow
  // No need to move cards here anymore since animateCardToPlayedArea() handles it
}

// Show sword emoji animation above a battlefield card
function showSwordAnimation(card) {
  return new Promise((resolve) => {
    console.log(`Showing sword animation for card: ${card.data.name}`);
    
    // Get card's screen position
    const cardPosition = card.mesh.position.clone();
    const vector = cardPosition.clone();
    vector.project(camera);
    
    // Convert to screen coordinates
    const canvas = document.getElementById('gameCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    const screenX = (vector.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
    const screenY = (-vector.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top;
    
    // Create sword emoji element
    const swordElement = document.createElement('div');
    swordElement.className = 'sword-animation';
    swordElement.textContent = '⚔️';
    swordElement.style.cssText = `
      position: fixed;
      left: ${screenX}px;
      top: ${screenY - 60}px;
      transform: translateX(-50%);
      font-size: 36px;
      z-index: 1000;
      pointer-events: none;
      animation: swordAttack 1.5s ease-out forwards;
    `;
    
    document.body.appendChild(swordElement);
    
    // Remove sword element after animation
    setTimeout(() => {
      swordElement.remove();
      console.log(`Sword animation complete for: ${card.data.name}`);
      resolve();
    }, 1500);
    
    // Keep card in battlefield position (don't move to played area yet)
    // The cards will be moved to played area after all sword animations complete
  });
}

// Animate card flying to the played area (left side) - for player cards
function animateCardToPlayedArea(card) {
  return new Promise((resolve) => {
    const duration = (mobileState && mobileState.isMobile) ? 600 : 800; // Faster on mobile
    const startTime = Date.now();
    
    // Store starting position and scale
    const startX = card.mesh.position.x;
    const startY = card.mesh.position.y;
    const startZ = card.mesh.position.z;
    const startScale = card.mesh.scale.x;
    
    // Target position (left side played area - bottom for player)
    const targetX = -8; // Far left
    const targetY = -2; // Bottom side for player
    const targetZ = 0; // Back to normal Z
    const targetScale = 0.8; // Smaller size in played area
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Calculate position - arc motion to the left
      const currentX = startX + (targetX - startX) * eased;
      const currentY = startY + (targetY - startY) * eased + Math.sin(progress * Math.PI) * 0.5; // Small arc
      const currentZ = startZ + (targetZ - startZ) * eased;
      const currentScale = startScale + (targetScale - startScale) * eased;
      
      // Apply position and scale
      card.mesh.position.set(currentX, currentY, currentZ);
      card.mesh.scale.set(currentScale, currentScale, currentScale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Set final target position to prevent updateBoard from repositioning
        card.targetPosition.set(targetX, targetY, targetZ);
        card.targetScale.set(targetScale, targetScale, targetScale);
        card.showBack(); // Show card back in played area
        
        // Animation complete
        resolve();
      }
    }
    
    animate();
  });
}

// Animate AI card flying to the played area (left side, top) - for AI cards
function animateAICardToPlayedArea(card) {
  return new Promise((resolve) => {
    const duration = (mobileState && mobileState.isMobile) ? 600 : 800; // Faster on mobile
    const startTime = Date.now();
    
    // Store starting position and scale
    const startX = card.mesh.position.x;
    const startY = card.mesh.position.y;
    const startZ = card.mesh.position.z;
    const startScale = card.mesh.scale.x;
    
    // Target position (left side played area - top for AI)
    const targetX = -8; // Far left
    const targetY = 2; // Top side for AI
    const targetZ = 0; // Back to normal Z
    const targetScale = 0.8; // Smaller size in played area
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Calculate position - arc motion to the left
      const currentX = startX + (targetX - startX) * eased;
      const currentY = startY + (targetY - startY) * eased + Math.sin(progress * Math.PI) * 0.5; // Small arc
      const currentZ = startZ + (targetZ - startZ) * eased;
      const currentScale = startScale + (targetScale - startScale) * eased;
      
      // Apply position and scale
      card.mesh.position.set(currentX, currentY, currentZ);
      card.mesh.scale.set(currentScale, currentScale, currentScale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Set final target position to prevent updateBoard from repositioning
        card.targetPosition.set(targetX, targetY, targetZ);
        card.targetScale.set(targetScale, targetScale, targetScale);
        card.showBack(); // Show card back in played area
        
        // Animation complete
        resolve();
      }
    }
    
    animate();
  });
}

// Show poison damage animation
function showPoisonDamageAnimation() {
  // Create floating poison damage text
  const damageElement = document.createElement('div');
  damageElement.className = 'poison-damage-animation';
  damageElement.textContent = '☠️ -2';
  damageElement.style.cssText = `
    position: fixed;
    left: 50%;
    top: 20%;
    transform: translateX(-50%);
    font-size: 42px;
    font-weight: bold;
    color: #00FF00;
    font-family: 'Orbitron', sans-serif;
    text-shadow: 0 0 15px #00FF00, 0 0 30px #00FF00;
    z-index: 1000;
    pointer-events: none;
    animation: poisonFloat 2.5s ease-out forwards;
  `;
  
  document.body.appendChild(damageElement);
  
  // Remove after animation
  setTimeout(() => {
    damageElement.remove();
  }, 2500);
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
  
  // For player 1 in card picker mode, show card picker instead of drawing automatically
  if (player === gameState.player1 && window.CARD_PICKER_MODE) {
    log('📋 Choose your next card from the list');
    showCardPicker();
    return;
  }
  
  // Normal random card draw
  const selectedCard = gameState.availableCards[
    Math.floor(Math.random() * gameState.availableCards.length)
  ];
  
  const newCard = new Card(selectedCard, player === gameState.player1);
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

// Update HP bars specifically
function updateHPBars() {
  const p1HPText = document.getElementById('player1HPText');
  const p2HPText = document.getElementById('player2HPText');
  const p1HPFill = document.getElementById('player1HPFill');
  const p2HPFill = document.getElementById('player2HPFill');
  
  if (p1HPText) {
    p1HPText.textContent = `${gameState.player1.hp}`;
    if (p1HPFill) {
      p1HPFill.style.width = `${(gameState.player1.hp / gameState.player1.maxHp) * 100}%`;
    }
  }
  
  if (p2HPText) {
    p2HPText.textContent = `${gameState.player2.hp}`;
    if (p2HPFill) {
      p2HPFill.style.width = `${(gameState.player2.hp / gameState.player2.maxHp) * 100}%`;
    }
  }
}

// Check if it's the current player's turn (for multiplayer)
function isPlayerTurn() {
  if (!gameState.isMultiplayer) return gameState.currentPlayer === 1;
  
  // In multiplayer, check against room state
  if (gameState.roomState && gameState.roomState.game_state && gameState.roomState.game_state.gameState) {
    const currentTurn = gameState.roomState.game_state.gameState.currentTurn;
    console.log('Turn check - Current turn ID:', currentTurn, 'My player ID:', gameState.player1.id, 'Is my turn:', currentTurn == gameState.player1.id);
    return currentTurn == gameState.player1.id; // Use == for type flexibility
  }
  
  console.log('Turn check - No valid room state for turn detection');
  return false;
}

// Update UI (includes HP bars and other UI elements)
function updateUI() {
  // Update HP bars
  updateHPBars();
  
  // Update turn indicator
  const turnElement = document.getElementById('currentTurn');
  if (turnElement) {
    if (gameState.isMultiplayer) {
      // Multiplayer turn display
      console.log('Updating turn UI - Multiplayer mode');
      console.log('Room state:', gameState.roomState);
      
      if (isPlayerTurn()) {
        console.log('Setting turn UI: Your Turn');
        turnElement.textContent = 'Your Turn';
        turnElement.className = 'your-turn';
      } else {
        // Find whose turn it is
        const currentTurnId = gameState.roomState?.game_state?.gameState?.currentTurn;
        const otherPlayer = gameState.roomState?.game_state?.gameState?.players?.find(p => p.id == currentTurnId);
        const turnText = otherPlayer ? `${otherPlayer.username}'s Turn` : 'Waiting for Turn...';
        console.log('Setting turn UI:', turnText, 'Current turn ID:', currentTurnId);
        turnElement.textContent = turnText;
        turnElement.className = 'other-turn';
      }
    } else {
      // Single player turn display
      turnElement.textContent = gameState.currentPlayer === 1 ? 'Your Turn' : 'AI Turn';
      turnElement.className = gameState.currentPlayer === 1 ? 'your-turn' : 'ai-turn';
    }
  }
  
  // Update skip turn button visibility
  updateSkipTurnButton();
  
  // Show card picker if it's player's turn and card picker mode is enabled
  if (gameState.currentPlayer === 1 && window.CARD_PICKER_MODE && gameState.isGameActive && !gameState.animationInProgress) {
    // Small delay to ensure UI is ready
    setTimeout(() => {
      showCardPicker();
    }, 100);
  } else if (gameState.currentPlayer !== 1) {
    // Hide card picker on AI turn
    hideCardPicker();
  }
}

// Update skip turn button
function updateSkipTurnButton() {
  let skipButton = document.getElementById('skipTurnButton');
  
  if (!skipButton) {
    // Create skip turn button
    skipButton = document.createElement('button');
    skipButton.id = 'skipTurnButton';
    skipButton.innerHTML = '⏭️ Skip Turn';
    skipButton.onclick = skipPlayerTurn;
    skipButton.style.cssText = `
      position: fixed;
      left: 20px;
      top: 60px;
      background: linear-gradient(135deg, #FF6B6B, #FF8E53);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-family: 'Orbitron', sans-serif;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(255, 107, 107, 0.3);
      z-index: 1000;
      transition: all 0.3s ease;
    `;
    
    // Add hover effect
    skipButton.addEventListener('mouseenter', () => {
      skipButton.style.transform = 'scale(1.05)';
      skipButton.style.boxShadow = '0 5px 15px rgba(255, 107, 107, 0.4)';
    });
    
    skipButton.addEventListener('mouseleave', () => {
      skipButton.style.transform = 'scale(1)';
      skipButton.style.boxShadow = '0 3px 10px rgba(255, 107, 107, 0.3)';
    });
    
    document.body.appendChild(skipButton);
  }
  
  // Show/hide based on current player and game state
  if (gameState.currentPlayer === 1 && gameState.isGameActive && !gameState.animationInProgress) {
    skipButton.style.display = 'block';
  } else {
    skipButton.style.display = 'none';
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
  gameState.selectedCards = [];
  gameState.battlefieldCards = [];
  gameState.fieldEffects = [];
  gameState.activeEffects = [];
  gameState.turnPhase = 'selecting';
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
      
      // Only apply hover effects if card is not selected
      if (!card.isSelected) {
        card.mesh.scale.set(1.3, 1.3, 1.3);
        card.mesh.position.z = 2;
      }
      
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        tooltip.innerHTML = `${card.data.name}<br>Attack: ${card.data.atk}${card.isSelected ? '<br>[SELECTED]' : ''}`;
      }
    }
  }
  
  if (!hovered) {
    gameState.player1.hand.forEach(card => {
      if (!card.isZoomed && !card.isSelected) { // Don't reset scale of zoomed or selected cards
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
  if (gameState.animationInProgress) return;
  if (gameState.turnPhase !== 'selecting') return;
  
  // Get proper canvas coordinates
  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(scene.children);
  
  if (intersects.length > 0) {
    const card = intersects[0].object.userData;
    
    if (card instanceof Card && gameState.player1.hand.includes(card)) {
      showCardSelection(card);
    }
  }
}

// Show card selection with zoom and info panel
function showCardSelection(card) {
  if (gameState.animationInProgress) return;
  
  // Check if trying to select a special effect card when one is already active
  if (isSpecialEffectCard(card.data) && gameState.fieldEffects.length > 0) {
    log(`❌ Cannot select ${card.data.name} - special effect already active! Play battle cards instead.`);
    return;
  }
  
  gameState.animationInProgress = true;
  
  // Store original position and scale
  card.originalPosition = card.mesh.position.clone();
  card.originalScale = card.mesh.scale.clone();
  
  // Zoom card to 1.5x size in place
  card.mesh.scale.set(1.5, 1.5, 1.5);
  card.mesh.position.z = 2; // Bring forward
  card.isZoomed = true;
  
  // Show info panel
  showSelectionInfoPanel(card);
  
  // Set current selected card
  gameState.selectedCard = card;
  
  gameState.animationInProgress = false;
  
  log(`Card selected: ${card.data.name}`);
}

// Show info panel on left side for selected card
function showSelectionInfoPanel(card) {
  const panel = document.getElementById('cardZoomPanel');
  const nameEl = document.getElementById('cardZoomName');
  const attackEl = document.getElementById('cardZoomAttack');
  const descriptionEl = document.getElementById('cardZoomDescription');
  
  if (!panel || !nameEl || !attackEl || !descriptionEl) {
    console.error('Selection panel elements not found');
    return;
  }
  
  // Populate panel with card data
  nameEl.textContent = card.data.name;
  attackEl.textContent = card.data.atk;
  
  // Show different description for special effects
  if (isSpecialEffectCard(card.data)) {
    if (gameState.fieldEffects.length > 0) {
      descriptionEl.textContent = `⚠️ Cannot play - special effect already active! ${card.data.description}`;
    } else {
      descriptionEl.textContent = card.data.description;
    }
  } else {
    descriptionEl.textContent = `This card deals ${card.data.atk} damage to your opponent.`;
  }
  
  // Update button text and state
  const playButton = document.querySelector('.zoom-play-btn');
  if (playButton) {
    if (isSpecialEffectCard(card.data) && gameState.fieldEffects.length > 0) {
      playButton.innerHTML = '<span class="btn-icon">🚫</span><span>Special Effect Blocked</span>';
      playButton.disabled = true;
      playButton.style.opacity = '0.5';
      playButton.style.cursor = 'not-allowed';
    } else {
      playButton.innerHTML = '<span class="btn-icon">⚔️</span><span>Play Selected Card</span>';
      playButton.disabled = false;
      playButton.style.opacity = '1';
      playButton.style.cursor = 'pointer';
    }
    
    // Re-setup event listeners after innerHTML change
    console.log('Re-setting up event listeners for play button...');
    playButton.removeAttribute('onclick');
    // Remove any existing listeners
    playButton.replaceWith(playButton.cloneNode(true));
    // Get fresh reference after clone
    const freshPlayButton = document.querySelector('.zoom-play-btn');
    if (freshPlayButton) {
      freshPlayButton.addEventListener('click', function(event) {
        console.log('Play button clicked via fresh event listener!');
        event.preventDefault();
        event.stopPropagation();
        confirmPlayCard(event);
      });
    }
  }
  
  // Also setup cancel button if needed
  const cancelButton = document.querySelector('.zoom-cancel-btn');
  if (cancelButton) {
    cancelButton.removeAttribute('onclick');
    cancelButton.replaceWith(cancelButton.cloneNode(true));
    const freshCancelButton = document.querySelector('.zoom-cancel-btn');
    if (freshCancelButton) {
      freshCancelButton.addEventListener('click', function(event) {
        console.log('Cancel button clicked via fresh event listener!');
        event.preventDefault();
        event.stopPropagation();
        closeCardZoom();
      });
    }
  }
  
  // Show panel
  panel.style.display = 'block';
  panel.style.pointerEvents = 'auto';
  
  // Record when panel was shown
  window.lastPanelShowTime = Date.now();
}

// This function is no longer needed with single-card selection system
// Keeping as placeholder for compatibility
function updateSelectionUI() {
  // Single-card selection system handles UI updates in showSelectionInfoPanel
  console.log('updateSelectionUI called but not needed with single-card selection');
}

// OLD ZOOM SYSTEM DISABLED - Using new single-card selection system
function showCardZoom(card) {
  // This function is disabled - using new single-card selection system
  console.log('showCardZoom called but disabled - using single-card selection');
  return;
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

// OLD ZOOM INFO PANEL DISABLED - Using new single-card selection system
function showZoomInfoPanel(card) {
  // This function is disabled - using new single-card selection system
  console.log('showZoomInfoPanel called but disabled - using single-card selection');
  return;
}

// Close card selection and return card to original state
function closeCardZoom() {
  const panel = document.getElementById('cardZoomPanel');
  
  // Hide info panel
  if (panel) {
    panel.style.display = 'none';
  }
  
  // Reset selected card if any
  if (gameState.selectedCard) {
    const card = gameState.selectedCard;
    
    // Reset card visual state to original position and scale
    card.isZoomed = false;
    
    // Restore original position and scale if available
    if (card.originalPosition) {
      card.mesh.position.copy(card.originalPosition);
    }
    if (card.originalScale) {
      card.mesh.scale.copy(card.originalScale);
    } else {
      card.mesh.scale.set(1, 1, 1);
    }
    
    // Reset z position
    card.mesh.position.z = 0.5;
    
    // Clear stored original values
    delete card.originalPosition;
    delete card.originalScale;
    
    // Clear selected card
    gameState.selectedCard = null;
    
    log('Card selection cancelled');
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

// Confirm and play the selected card
function confirmPlayCard(event) {
  console.log('>>> confirmPlayCard function called! <<<');
  console.log('confirmPlayCard called with event:', event);
  
  // Check if this is an intentional button click vs automatic trigger
  if (!event || !event.isTrusted) {
    console.log('confirmPlayCard: Event not trusted or missing');
    return;
  }
  
  // Check if the event target is actually the button
  if (!event.target || !event.target.closest('.zoom-play-btn')) {
    console.log('confirmPlayCard: Event target is not play button');
    return;
  }
  
  // Check if button is disabled
  const playButton = document.querySelector('.zoom-play-btn');
  if (playButton && playButton.disabled) {
    console.log('confirmPlayCard: Play button is disabled');
    log('❌ Cannot play card - button is disabled');
    return;
  }
  
  // Add a small delay to prevent accidental clicks right after panel appears
  const now = Date.now();
  if (!window.lastPanelShowTime) window.lastPanelShowTime = 0;
  if (now - window.lastPanelShowTime < 500) {
    console.log('confirmPlayCard: Too soon after panel show');
    return;
  }
  
  console.log('confirmPlayCard: All checks passed, attempting to play card');
  
  if (gameState.selectedCard) {
    const panel = document.getElementById('cardZoomPanel');
    
    // Hide info panel immediately
    if (panel) {
      panel.style.display = 'none';
    }
    
    // In multiplayer mode, play card directly instead of moving to battlefield
    if (gameState.isMultiplayer) {
      console.log('Multiplayer: Playing card directly:', gameState.selectedCard.data.name);
      playCard(gameState.selectedCard);
    } else {
      // Single player mode: Move selected card to battlefield
      moveCardToBattlefield(gameState.selectedCard);
    }
  }
}

// Move single card to battlefield center
function moveCardToBattlefield(card) {
  if (!card) return;
  
  gameState.animationInProgress = true;
  gameState.turnPhase = 'battlefield';
  
  // Remove card from hand
  const cardIndex = gameState.player1.hand.indexOf(card);
  if (cardIndex !== -1) {
    gameState.player1.hand.splice(cardIndex, 1);
  }
  
  // Check if this is a special effect card
  if (isSpecialEffectCard(card.data)) {
    // Special effect cards go directly to field effects area
    playSpecialEffectCardFromSelection(card);
    return;
  }
  
  // Add to battlefield
  gameState.battlefieldCards.push(card);
  
  // Reset card visual state
  card.isZoomed = false;
  card.mesh.scale.set(1, 1, 1);
  card.mesh.position.z = 0.5;
  
  // Clear selected card
  gameState.selectedCard = null;
  
  // Animate card to battlefield position
  animateCardToBattlefield(card).then(() => {
    gameState.animationInProgress = false;
    gameState.turnPhase = 'selecting'; // Allow more selections
    showBattleButton();
    updateBoard();
    
    log(`${card.data.name} moved to battlefield`);
  });
}

// Animate single card to battlefield
function animateCardToBattlefield(card) {
  return new Promise((resolve) => {
    const duration = 800;
    const startTime = Date.now();
    const startPosition = card.mesh.position.clone();
    
    // Calculate position in battlefield (side by side)
    const battlefieldIndex = gameState.battlefieldCards.length - 1;
    const centerSpacing = 2.5;
    const totalCards = gameState.battlefieldCards.length;
    const totalWidth = (totalCards - 1) * centerSpacing;
    const startX = -totalWidth / 2;
    const targetX = startX + (battlefieldIndex * centerSpacing);
    const targetPosition = new THREE.Vector3(targetX, 0, 2);
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      card.mesh.position.lerpVectors(startPosition, targetPosition, eased);
      card.mesh.scale.setScalar(1.5); // Slightly larger in battlefield
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    animate();
  });
}

// Animate multiple cards to battlefield center
function animateCardsToBattlefield(cards) {
  return new Promise((resolve) => {
    const duration = 1000;
    const startTime = Date.now();
    
    // Store starting positions
    const startPositions = cards.map(card => card.mesh.position.clone());
    
    // Calculate target positions (side by side in center)
    const centerSpacing = 2.5;
    const totalWidth = (cards.length - 1) * centerSpacing;
    const startX = -totalWidth / 2;
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      cards.forEach((card, index) => {
        const targetX = startX + (index * centerSpacing);
        const targetPosition = new THREE.Vector3(targetX, 0, 2);
        
        card.mesh.position.lerpVectors(startPositions[index], targetPosition, eased);
        card.mesh.scale.setScalar(1.5); // Slightly larger in battlefield
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    animate();
  });
}

// Show battle action panel with battlefield stats
function showBattleButton() {
  const battlePanel = document.getElementById('battleActionPanel');
  if (battlePanel) {
    // Update battle panel stats
    const fieldCount = document.getElementById('battleFieldCount');
    const totalAttack = document.getElementById('battleTotalAttack');
    
    if (fieldCount) {
      fieldCount.textContent = gameState.battlefieldCards.length;
    }
    
    if (totalAttack) {
      const totalATK = gameState.battlefieldCards.reduce((sum, card) => sum + card.data.atk, 0);
      totalAttack.textContent = totalATK;
    }
    
    battlePanel.style.display = 'block';
  }
}

// Hide battle action panel
function hideBattleButton() {
  const battlePanel = document.getElementById('battleActionPanel');
  if (battlePanel) {
    battlePanel.style.display = 'none';
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

// Execute battle with battlefield cards
async function executeBattle(event) {
  if (gameState.battlefieldCards.length === 0) return;
  
  gameState.animationInProgress = true;
  gameState.turnPhase = 'battle';
  
  // Hide battle button
  hideBattleButton();
  
  // Calculate total damage with special effects applied
  let totalDamage = 0;
  gameState.battlefieldCards.forEach((card, index) => {
    let cardDamage = card.data.atk;
    
    // Apply special effects to each card
    gameState.activeEffects.forEach(effect => {
      switch(effect.effect) {
        case 'boost_atk':
          // g2: +50% ATK boost to all cards
          cardDamage = Math.floor(cardDamage * 1.5);
          break;
          
        case 'double_first':
          // g3: Double first card's ATK only
          if (index === 0) {
            cardDamage = cardDamage * 2;
          }
          break;
      }
    });
    
    totalDamage += cardDamage;
    log(`${card.data.name}: ${card.data.atk} → ${cardDamage} damage`);
  });
  
  // Deal combined damage immediately
  gameState.player2.hp = Math.max(0, gameState.player2.hp - totalDamage);
  
  // Update HP display immediately
  updateUI();
  
  // Show total damage animation
  showDamageAnimation(totalDamage);
  
  // Update via API if online
  if (gameState.gameSession) {
    // Use first card's ID for API call, but with total damage
    await playCardAPI(gameState.battlefieldCards[0].data.id, totalDamage);
  }
  
  // Show sword emoji animation above each battlefield card instead of flying them
  const swordAnimations = gameState.battlefieldCards.map(card => showSwordAnimation(card));
  await Promise.all(swordAnimations);
  
  // Move battlefield cards to played cards array BEFORE animating (to prevent repositioning conflicts)
  gameState.battlefieldCards.forEach(card => {
    gameState.player1.playedCards.push(card);
  });
  
  // Clear battlefield immediately to prevent updateBoard from repositioning them
  const cardsToAnimate = [...gameState.battlefieldCards]; // Copy the array
  gameState.battlefieldCards = [];
  
  // After sword animations, animate cards flying to the left (played area)
  const cardFlyAnimations = cardsToAnimate.map(card => animateCardToPlayedArea(card));
  await Promise.all(cardFlyAnimations);
  
  // Draw new cards to replace played ones
  for (let i = 0; i < cardsToAnimate.length; i++) {
    drawCard(gameState.player1);
  }
  
  const cardNames = cardsToAnimate.map(card => card.data.name).join(', ');
  log(`You played ${cardNames} dealing ${totalDamage} total damage! Enemy HP: ${gameState.player2.hp}`);
  
  // Check win condition
  if (gameState.player2.hp <= 0) {
    endGame(true);
    return;
  }
  
  // Switch to AI turn after animation completes
  setTimeout(() => {
    gameState.currentPlayer = 2;
    gameState.turnPhase = 'selecting';
    updateBoard();
    updateUI();
    
    // AI plays after short delay
    setTimeout(async () => {
      await aiPlayCard();
      gameState.animationInProgress = false;
    }, 1500);
  }, 1000); // Reduced delay since cards animate together
}

// Return battlefield cards to hand
function returnCardsToHand(event) {
  if (gameState.battlefieldCards.length === 0) return;
  
  gameState.animationInProgress = true;
  
  // Hide battle button
  hideBattleButton();
  
  // Move cards from battlefield back to hand
  gameState.battlefieldCards.forEach(card => {
    gameState.player1.hand.push(card);
    
    // Make sure cards are properly reset
    card.isSelected = false;
    card.mesh.material.emissive = new THREE.Color(0x000000); // Remove any glow
    card.mesh.scale.set(1, 1, 1); // Reset scale
    card.mesh.position.z = 0.5; // Reset depth
  });
  
  // Clear battlefield
  gameState.battlefieldCards = [];
  
  // Reset turn phase to selecting
  gameState.turnPhase = 'selecting';
  
  // Update board positions
  updateBoard();
  
  log('Cards returned to hand');
  
  // Allow animations to complete
  setTimeout(() => {
    gameState.animationInProgress = false;
  }, 1000);
}

// Make functions globally accessible
window.closeCardZoom = closeCardZoom;
window.confirmPlayCard = confirmPlayCard;
window.executeBattle = executeBattle;
window.returnCardsToHand = returnCardsToHand;

console.log('Global functions exported:', {
  confirmPlayCard: typeof window.confirmPlayCard,
  closeCardZoom: typeof window.closeCardZoom
});

// Debug: Add a direct card play function for testing
window.directPlayCard = function() {
  console.log('Direct play card called!');
  if (gameState.selectedCard) {
    console.log('Playing selected card directly:', gameState.selectedCard.data.name);
    
    if (gameState.isMultiplayer) {
      console.log('Multiplayer mode - calling playCard directly');
      playCard(gameState.selectedCard);
    } else {
      console.log('Single player mode - moving to battlefield');
      moveCardToBattlefield(gameState.selectedCard);
    }
    
    // Hide the panel
    const panel = document.getElementById('cardZoomPanel');
    if (panel) panel.style.display = 'none';
  } else {
    console.log('No card selected');
  }
};

// Debug function to check button state
window.debugButtonState = function() {
  const cardZoomPanel = document.getElementById('cardZoomPanel');
  const cardZoomActions = document.getElementById('cardZoomActions');
  const playButton = document.querySelector('.zoom-play-btn');
  
  console.log('=== BUTTON DEBUG ===');
  console.log('Card zoom panel:', cardZoomPanel);
  console.log('Panel display:', cardZoomPanel ? cardZoomPanel.style.display : 'not found');
  console.log('Card zoom actions:', cardZoomActions);
  console.log('Actions display:', cardZoomActions ? cardZoomActions.style.display : 'not found');
  console.log('Play button:', playButton);
  console.log('Button disabled:', playButton ? playButton.disabled : 'not found');
  
  if (playButton) {
    const rect = playButton.getBoundingClientRect();
    console.log('Button position:', rect);
    console.log('Button visible:', rect.width > 0 && rect.height > 0);
    
    // Check if there are elements on top
    const elementAtPosition = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
    console.log('Element at button center:', elementAtPosition);
    console.log('Is button the top element?', elementAtPosition === playButton);
  }
  console.log('===================');
};

// Fix button event listeners - add proper event listeners
function setupCardZoomEventListeners() {
  console.log('Setting up card zoom event listeners...');
  
  // Remove any existing event listeners first
  const playButton = document.querySelector('.zoom-play-btn');
  const cancelButton = document.querySelector('.zoom-cancel-btn');
  
  if (playButton) {
    // Remove onclick attribute and add proper event listener
    playButton.removeAttribute('onclick');
    playButton.addEventListener('click', function(event) {
      console.log('Play button clicked via event listener!');
      event.preventDefault();
      event.stopPropagation();
      confirmPlayCard(event);
    });
    console.log('Play button event listener added');
  }
  
  if (cancelButton) {
    cancelButton.removeAttribute('onclick');
    cancelButton.addEventListener('click', function(event) {
      console.log('Cancel button clicked via event listener!');
      event.preventDefault();
      event.stopPropagation();
      closeCardZoom();
    });
    console.log('Cancel button event listener added');
  }
}

// Call setup function when needed
window.setupCardZoomEventListeners = setupCardZoomEventListeners;

// Animation loop
export function animate() {
  if (!gameState.isPaused) {
    requestAnimationFrame(animate);
    
    // Update all cards
    [...gameState.player1.hand, ...gameState.player1.playedCards, ...gameState.battlefieldCards, ...gameState.fieldEffects].forEach(card => {
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
  
  // Show sword animation above player card
  await showSwordAnimation(card);
  
  // Deal specified damage (potentially modified by referee)
  gameState.player2.hp = Math.max(0, gameState.player2.hp - damage);
  
  // Show damage animation
  showDamageAnimation(damage, true); // true = player to AI
  
  // Update via API if online
  if (gameState.gameSession) {
    await playCardAPI(card.data.id, damage);
  }
  
  // Move to played cards array first
  gameState.player1.playedCards.push(card);
  
  // Animate card flying to played area
  await animateCardToPlayedArea(card);
  
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
    processActiveEffects(); // Process turn-based effects
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

// Special Effect Functions

// Play a special effect card from selection (card already removed from hand)
async function playSpecialEffectCardFromSelection(card) {
  // Check if player already has a special effect active (can't combine)
  if (gameState.fieldEffects.some(effectCard => effectCard.data.effect === card.data.effect)) {
    log(`Cannot play ${card.data.name} - similar effect already active!`);
    // Return card to hand
    gameState.player1.hand.push(card);
    gameState.animationInProgress = false;
    updateBoard();
    return;
  }
  
  // Reset card visual state
  card.isZoomed = false;
  card.mesh.scale.set(1, 1, 1);
  card.mesh.position.z = 0.5;
  
  // Clear selected card
  gameState.selectedCard = null;
  
  // Animate card moving to field effects area (right side)
  await animateCardToFieldEffects(card);
  
  // Apply instant effects immediately, but keep duration-based effects for battle
  if (card.data.duration === 0) {
    // Instant effects (g1, g4) - apply immediately
    await applySpecialEffect(card);
    gameState.player1.playedCards.push(card);
    
    // Draw new card
    drawCard(gameState.player1);
    
    log(`You played special effect: ${card.data.name} - ${card.data.description}`);
    
    // Switch to AI turn
    setTimeout(() => {
      gameState.currentPlayer = 2;
      processActiveEffects(); // Process turn-based effects
      updateBoard();
      updateUI();
      
      // AI plays after short delay
      setTimeout(async () => {
        await aiPlayCard();
        gameState.animationInProgress = false;
      }, 1500);
    }, 2000);
  } else {
    // Duration-based effects (g2, g3, g5) - add to field and let player continue
    gameState.fieldEffects.push(card);
    gameState.activeEffects.push({
      card: card,
      effect: card.data.effect,
      duration: card.data.duration,
      turnsLeft: card.data.duration
    });
    
    // Draw new card
    drawCard(gameState.player1);
    
    log(`You played special effect: ${card.data.name} - ${card.data.description}`);
    log(`Special effect is active! You can now play battle cards.`);
    
    // Return control to player to continue selecting battle cards
    gameState.animationInProgress = false;
    gameState.turnPhase = 'selecting';
    updateBoard();
    updateUI();
  }
}

// Play a special effect card
async function playSpecialEffectCard(card) {
  const processor = getSpecialEffectProcessor();
  
  // Check if player already has a special effect active (can't combine)
  if (processor.hasActiveEffect(card.data.effect)) {
    log(`Cannot play ${card.data.name} - similar effect already active!`);
    // Return card to hand
    gameState.player1.hand.push(card);
    gameState.animationInProgress = false;
    updateBoard();
    return;
  }
  
  // Animate card moving to field effects area (right side)
  await animateCardToFieldEffects(card);
  
  // Apply the special effect using the new processor
  const success = await processor.applyEffect(card, {
    currentPlayer: gameState.currentPlayer,
    gameState: gameState
  });
  
  if (!success) {
    log(`❌ Failed to apply special effect: ${card.data.name}`);
    gameState.player1.hand.push(card);
    gameState.animationInProgress = false;
    updateBoard();
    return;
  }
  
  // Add to field effects if it has duration
  const effectInfo = SPECIAL_EFFECTS[card.data.effect];
  if (effectInfo && effectInfo.duration > 0) {
    gameState.fieldEffects.push(card);
  } else {
    // Instant effect - move to played cards
    gameState.player1.playedCards.push(card);
  }
  
  // Draw new card
  drawCard(gameState.player1);
  
  log(`You played special effect: ${card.data.name} - ${card.data.description}`);
  
  // Switch to AI turn
  setTimeout(() => {
    gameState.currentPlayer = 2;
    updateBoard();
    updateUI();
    
    // AI plays after short delay
    setTimeout(async () => {
      await aiPlayCard();
      gameState.animationInProgress = false;
    }, 1500);
  }, 2000);
}

// Animate card to field effects area
async function animateCardToFieldEffects(card) {
  return new Promise((resolve) => {
    const duration = 1000;
    const startTime = Date.now();
    const startPosition = card.mesh.position.clone();
    const targetPosition = new THREE.Vector3(7, 0, 0.5);
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      card.mesh.position.lerpVectors(startPosition, targetPosition, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    animate();
  });
}

// Legacy function - now handled by specialEffectProcessor
// Kept for backwards compatibility but deprecated
async function applySpecialEffect(card) {
  console.warn('applySpecialEffect is deprecated - use getSpecialEffectProcessor().applyEffect instead');
  const processor = getSpecialEffectProcessor();
  return await processor.applyEffect(card, {
    currentPlayer: gameState.currentPlayer,
    gameState: gameState
  });
}

// Legacy function - moved to specialEffects.js
// Kept for backwards compatibility
async function shuffleAllHands() {
  console.warn('shuffleAllHands is deprecated - use specialEffectProcessor instead');
  // This will be handled by the special effects module
}

// Legacy function - moved to specialEffects.js
// Kept for backwards compatibility
function discardOpponentCards(count) {
  console.warn('discardOpponentCards is deprecated - use specialEffectProcessor instead');
  // This will be handled by the special effects module
}

// Apply active effects to damage calculation
function applyActiveEffects(damage, card) {
  const processor = getSpecialEffectProcessor();
  const isFirstCard = gameState.battlefieldCards.length === 1;
  const modifiedDamage = processor.applyDamageModifiers(damage, isFirstCard);
  
  if (modifiedDamage !== damage) {
    const activeEffects = processor.getActiveEffectNames();
    log(`Effects applied: ${activeEffects.join(', ')} (${damage} → ${modifiedDamage})`);
  }
  
  return modifiedDamage;
}

// Process turn-based effects (called at start of each turn)
function processActiveEffects() {
  const processor = getSpecialEffectProcessor();
  
  // Use the new special effect processor
  processor.processTurnEffects(gameState.currentPlayer);
  
  // Handle field effect cleanup for expired effects
  // Remove field effects that are no longer active
  const activeEffectIds = gameState.activeEffects.map(effect => effect.effectId);
  for (let i = gameState.fieldEffects.length - 1; i >= 0; i--) {
    const fieldCard = gameState.fieldEffects[i];
    if (!activeEffectIds.includes(fieldCard.data.effect)) {
      // Effect expired - move to played cards
      const expiredCard = gameState.fieldEffects.splice(i, 1)[0];
      gameState.player1.playedCards.push(expiredCard);
      log(`✅ ${expiredCard.data.name} effect expired and moved to played cards`);
    }
  }
  
  updateBoard();
  updateUI();
}

// Add CSS animations for damage effects
function addDamageAnimations() {
  if (document.getElementById('damageAnimationsCSS')) return; // Already added
  
  const style = document.createElement('style');
  style.id = 'damageAnimationsCSS';
  style.textContent = `
    @keyframes damageFloat {
      0% {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-100px);
      }
    }
    
    @keyframes poisonFloat {
      0% {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
      }
      50% {
        opacity: 1;
        transform: translateX(-50%) translateY(-30px) scale(1.2);
      }
      100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-80px) scale(0.8);
      }
    }
  `;
  document.head.appendChild(style);
}

// Skip player turn
function skipPlayerTurn() {
  if (gameState.currentPlayer !== 1 || !gameState.isGameActive || gameState.animationInProgress) {
    return;
  }
  
  log('⏭️ Player skipped turn');
  
  // Switch to AI turn
  gameState.currentPlayer = 2;
  processActiveEffects(); // Process turn-based effects
  updateBoard();
  updateUI();
  
  // AI plays after short delay
  setTimeout(async () => {
    await aiPlayCard();
  }, 1000);
}

// Card Picker Functions
function enableCardPicker() {
  window.CARD_PICKER_MODE = true;
  log('📋 Card Picker enabled - choose cards manually');
  
  // Update button appearance
  const button = document.getElementById('cardPickerToggle');
  if (button) {
    button.classList.add('active');
    button.innerHTML = '📋 Card Picker ON';
  }
  
  // Show card picker if it's player's turn
  if (gameState.currentPlayer === 1 && gameState.isGameActive) {
    showCardPicker();
  }
}

function disableCardPicker() {
  window.CARD_PICKER_MODE = false;
  log('🎲 Card Picker disabled - random cards');
  
  // Update button appearance
  const button = document.getElementById('cardPickerToggle');
  if (button) {
    button.classList.remove('active');
    button.innerHTML = '📋 Card Picker';
  }
  
  // Hide card picker
  hideCardPicker();
}

function toggleCardPicker() {
  if (window.CARD_PICKER_MODE) {
    disableCardPicker();
  } else {
    enableCardPicker();
  }
}

// Show card picker panel
function showCardPicker() {
  if (!gameState.isGameActive || gameState.currentPlayer !== 1) {
    return;
  }
  
  // Don't show if card picker mode is disabled
  if (!window.CARD_PICKER_MODE) {
    return;
  }
  
  // Remove existing picker if present
  hideCardPicker();
  
  const picker = document.createElement('div');
  picker.id = 'card-picker';
  picker.style.cssText = `
    position: fixed;
    left: 20px;
    top: 120px;
    background: rgba(20, 20, 20, 0.95);
    border: 2px solid #00BFFF;
    border-radius: 10px;
    padding: 15px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    z-index: 9999;
    min-width: 250px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
  `;
  
  picker.innerHTML = `
    <div style="color: #00BFFF; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
      <span>📋 Choose Next Card</span>
      <button onclick="hideCardPicker()" style="background: none; border: none; color: #ccc; font-size: 18px; cursor: pointer; padding: 2px 8px; border-radius: 3px;" onmouseover="this.style.background='#444'" onmouseout="this.style.background='none'">×</button>
    </div>
    <div id="card-list"></div>
  `;
  
  const cardList = picker.querySelector('#card-list');
  
  // Separate cards by type
  const regularCards = gameState.availableCards.filter(card => !isSpecialEffectCard(card));
  let specialCards = gameState.availableCards.filter(card => isSpecialEffectCard(card));
  
  // Fallback: If no special effects found in availableCards, use the raw specialEffectCards array
  if (specialCards.length === 0) {
    console.warn('⚠️ No special effects in availableCards, using raw specialEffectCards');
    specialCards = [...specialEffectCards];
  }
  
  // Debug logging
  console.log('📋 Card Picker Debug:');
  console.log(`Total available cards: ${gameState.availableCards.length}`);
  console.log(`Regular cards: ${regularCards.length}`);
  console.log(`Special cards: ${specialCards.length}`);
  console.log('Special cards found:', specialCards.map(c => c.name));
  
  // Add special effects section
  if (specialCards.length > 0) {
    const specialSection = document.createElement('div');
    specialSection.innerHTML = `<div style="color: #FFD700; font-weight: bold; margin: 10px 0 5px 0;">✨ Special Effects (${specialCards.length})</div>`;
    cardList.appendChild(specialSection);
    
    specialCards.forEach(card => {
      const cardButton = document.createElement('button');
      cardButton.textContent = card.name;
      cardButton.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 12px;
        margin: 2px 0;
        background: linear-gradient(135deg, #FF6B6B, #FFD700);
        border: 1px solid #FFD700;
        color: white;
        border-radius: 5px;
        cursor: pointer;
        text-align: left;
        font-size: 14px;
        transition: all 0.2s;
      `;
      cardButton.onclick = () => drawSpecificCard(card);
      cardButton.onmouseover = () => cardButton.style.background = 'linear-gradient(135deg, #FFD700, #FF6B6B)';
      cardButton.onmouseout = () => cardButton.style.background = 'linear-gradient(135deg, #FF6B6B, #FFD700)';
      cardList.appendChild(cardButton);
    });
  }
  
  // Add regular cards section
  if (regularCards.length > 0) {
    const regularSection = document.createElement('div');
    regularSection.innerHTML = `<div style="color: #00BFFF; font-weight: bold; margin: 15px 0 5px 0;">⚔️ Battle Cards (${regularCards.length})</div>`;
    cardList.appendChild(regularSection);
    
    regularCards.forEach(card => {
      const cardButton = document.createElement('button');
      cardButton.textContent = `${card.name} (${card.atk} ATK)`;
      cardButton.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 12px;
        margin: 2px 0;
        background: linear-gradient(135deg, #0080FF, #00BFFF);
        border: 1px solid #00BFFF;
        color: white;
        border-radius: 5px;
        cursor: pointer;
        text-align: left;
        font-size: 14px;
        transition: all 0.2s;
      `;
      cardButton.onclick = () => drawSpecificCard(card);
      cardButton.onmouseover = () => cardButton.style.background = 'linear-gradient(135deg, #00BFFF, #0080FF)';
      cardButton.onmouseout = () => cardButton.style.background = 'linear-gradient(135deg, #0080FF, #00BFFF)';
      cardList.appendChild(cardButton);
    });
  }
  
  document.body.appendChild(picker);
  
  // Additional debug info
  if (specialCards.length === 0) {
    console.warn('⚠️ No special effect cards found!');
    console.log('Available cards:', gameState.availableCards.map(c => ({name: c.name, id: c.id, type: c.type})));
  }
}

// Hide card picker
function hideCardPicker() {
  const picker = document.getElementById('card-picker');
  if (picker) {
    picker.remove();
  }
}

// Draw a specific card chosen by the player
function drawSpecificCard(cardData) {
  if (!gameState.isGameActive || gameState.currentPlayer !== 1) {
    log('❌ Can only draw cards on your turn');
    return;
  }
  
  const newCard = new Card(cardData, true);
  gameState.player1.hand.push(newCard);
  
  // Position the card
  const centerSpacing = 2.5;
  const handIndex = gameState.player1.hand.length - 1;
  const totalCards = gameState.player1.hand.length;
  
  newCard.targetPosition.set(
    (handIndex - (totalCards - 1) / 2) * centerSpacing, 
    -5, 
    0.5
  );
  newCard.mesh.position.copy(newCard.targetPosition);
  newCard.targetRotation.set(0, 0, 0);
  newCard.targetScale.set(1, 1, 1);
  
  updateBoard();
  hideCardPicker();
  
  const cardType = isSpecialEffectCard(cardData) ? '✨ Special Effect' : '⚔️ Battle Card';
  log(`📋 Picked: ${cardData.name} (${cardType})`);
}

// Debug function to check special effects
function debugSpecialEffects() {
  const allCards = gameState.availableCards;
  const specialCards = allCards.filter(card => isSpecialEffectCard(card));
  
  console.log('🔍 Special Effects Debug:');
  console.log(`Total cards: ${allCards.length}`);
  console.log(`Special effect cards: ${specialCards.length}`);
  
  if (specialCards.length > 0) {
    console.log('Special effects found:');
    specialCards.forEach(card => {
      console.log(`- ${card.name} (${card.id}) - ${card.effect}`);
    });
  } else {
    console.log('⚠️ No special effects found!');
    console.log('All cards:', allCards.map(c => c.name));
  }
  
  return specialCards;
}

// Multiplayer game state sync functions
export function syncMultiplayerGameState(roomData) {
  if (!gameState.isMultiplayer) return;
  
  console.log('Syncing multiplayer game state:', roomData);
  gameState.roomState = roomData;
  
  if (roomData.game_state && roomData.game_state.gameState) {
    const serverGameState = roomData.game_state.gameState;
    console.log('Server game state:', serverGameState);
    
    // Update game status
    if (serverGameState.gameActive && !gameState.isGameActive) {
      // Game just started
      console.log('Game just started, initializing multiplayer game');
      startMultiplayerGame(serverGameState);
    } else if (!serverGameState.gameActive && gameState.isGameActive) {
      // Game ended
      console.log('Game ended');
      gameState.isGameActive = false;
    }
    
    // Update player data
    if (serverGameState.players && Array.isArray(serverGameState.players)) {
      console.log('Updating players from server state:', serverGameState.players);
      updatePlayersFromServerState(serverGameState.players);
    }
    
    // Update turn information
    console.log('Updating turn info - current turn:', serverGameState.currentTurn);
    gameState.currentTurnPlayerId = serverGameState.currentTurn;
    
    // Update UI to reflect new state
    updateUI();
  } else {
    console.log('No valid game state in room data');
  }
}

function startMultiplayerGame(serverGameState) {
  console.log('Starting multiplayer game:', serverGameState);
  
  // Set up players from server state
  if (serverGameState.players && Array.isArray(serverGameState.players)) {
    updatePlayersFromServerState(serverGameState.players);
  }
  
  // Initialize game state
  gameState.currentTurnPlayerId = serverGameState.currentTurn;
  gameState.turnPhase = 'selecting';
  gameState.selectedCards = [];
  gameState.battlefieldCards = [];
  gameState.isGameActive = true;
  
  // Deal cards if not already dealt
  if (gameState.player1.hand.length === 0) {
    dealInitialCards();
  }
  
  updateBoard();
  updateUI();
  
  log('Multiplayer game started! ' + (isPlayerTurn() ? 'Your turn!' : 'Waiting for your turn...'));
}

function updatePlayersFromServerState(serverPlayers) {
  serverPlayers.forEach((serverPlayer, index) => {
    const gamePlayer = index === 0 ? gameState.player1 : gameState.player2;
    
    // Update player info if this matches our player
    if (serverPlayer.id === gameState.player1.id) {
      gameState.player1.hp = serverPlayer.hp || gameState.player1.hp;
      gameState.player1.username = serverPlayer.username || gameState.player1.username;
    } else {
      // This is the other player
      gameState.player2.id = serverPlayer.id;
      gameState.player2.username = serverPlayer.username;
      gameState.player2.hp = serverPlayer.hp || 500;
    }
  });
  
  // Update player names in UI
  updatePlayerNamesInUI();
}

function updatePlayerNamesInUI() {
  const player1NameElement = document.getElementById('player1Name');
  const player2NameElement = document.getElementById('player2Name');
  
  if (player1NameElement) {
    player1NameElement.textContent = gameState.player1.username || 'Player 1';
  }
  
  if (player2NameElement) {
    player2NameElement.textContent = gameState.player2.username || 'Player 2';
  }
}

// Function to update multiplayer game state after a card is played
async function updateMultiplayerGameState(card, damage) {
  if (!gameState.isMultiplayer || !gameState.roomState) {
    console.error('Cannot update multiplayer state - not in multiplayer or no room state');
    return;
  }

  try {
    console.log('Updating multiplayer game state after card play:', {
      card: card.data.name,
      damage: damage,
      newHP: gameState.player2.hp
    });

    // Get current game state from room
    const currentGameState = gameState.roomState.game_state.gameState;
    
    // Find other players to switch turn to
    const allPlayers = currentGameState.players;
    const currentPlayerIndex = allPlayers.findIndex(p => p.id == gameState.player1.id);
    const nextPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
    const nextPlayerId = allPlayers[nextPlayerIndex].id;
    
    // Update player HP in the game state
    const updatedPlayers = allPlayers.map(player => {
      if (player.id != gameState.player1.id) {
        // This is the opponent, update their HP
        return {
          ...player,
          hp: gameState.player2.hp
        };
      }
      return player;
    });
    
    // Create updated game state
    const updatedGameState = {
      ...currentGameState,
      players: updatedPlayers,
      currentTurn: nextPlayerId,
      lastMove: {
        playerId: gameState.player1.id,
        playerName: gameState.player1.username,
        cardName: card.data.name,
        damage: damage,
        timestamp: Date.now()
      }
    };

    console.log('Sending updated game state:', updatedGameState);

    // Update room state via API
    const response = await fetch('./api/room_handler.php?action=update_room_state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: gameState.roomState.room.id,
        game_state: {
          gameState: updatedGameState,
          lastUpdate: Date.now()
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Successfully updated room game state');
      log(`Turn passed to next player`);
    } else {
      console.error('Failed to update room state:', result.error);
      log('Failed to update game state');
    }
    
  } catch (error) {
    console.error('Error updating multiplayer game state:', error);
    log('Error updating game state');
  }
}

// Function to handle when a card is played in multiplayer
export async function playCardMultiplayer(card) {
  if (!gameState.isMultiplayer || !isPlayerTurn()) {
    log("It's not your turn!");
    return;
  }
  
  // Play the card locally first
  await playCard(card);
}

// Export for global access - all functions and variables
if (typeof window !== 'undefined') {
  // Core game functions
  window.initializeGame = initializeGame;
  window.loginPlayer = loginPlayer;
  window.toggleRefereeMode = toggleRefereeMode;
  window.skipPlayerTurn = skipPlayerTurn;
  
  // Multiplayer functions
  window.syncMultiplayerGameState = syncMultiplayerGameState;
  window.playCardMultiplayer = playCardMultiplayer;
  window.isPlayerTurn = isPlayerTurn;
  window.updateMultiplayerGameState = updateMultiplayerGameState;
  
  // Card picker functions
  window.enableCardPicker = enableCardPicker;
  window.disableCardPicker = disableCardPicker;
  window.toggleCardPicker = toggleCardPicker;
  window.showCardPicker = showCardPicker;
  window.hideCardPicker = hideCardPicker;
  window.drawSpecificCard = drawSpecificCard;
  window.debugSpecialEffects = debugSpecialEffects;
  
  // Functions for special effects module
  window.log = log;
  window.updateBoard = updateBoard;
  window.updateHPBars = updateHPBars;
  window.updateUI = updateUI;
  window.scene = scene;
  window.gameState = gameState;
  window.showPoisonDamageAnimation = showPoisonDamageAnimation;
  window.Card = Card;
  
  // Initialize special effects processor after all functions are available
  initializeSpecialEffectProcessor();
}