// specialEffects.js - Modular Special Effects System
// Handles all special effect logic, processing, and registry

import { shuffle } from './utils.js';
import { Card } from './cards.js';

// Special Effects Registry
// Each effect has: id, name, type (instant/duration), handler function, and metadata
export const SPECIAL_EFFECTS = {
  // INSTANT EFFECTS (applied immediately)
  shuffle: {
    id: 'shuffle',
    name: 'Chaos Shuffle',
    type: 'instant',
    description: 'Shuffle all cards in both players\' hands; redraw 5 cards.',
    duration: 0,
    handler: shuffleAllHands
  },
  
  discard_opponent: {
    id: 'discard_opponent', 
    name: 'Mind Fracture',
    type: 'instant',
    description: 'Forces opponent to discard 2 random cards.',
    duration: 0,
    handler: (data) => discardOpponentCards(2, data)
  },

  // DURATION EFFECTS (active for multiple turns)
  boost_atk: {
    id: 'boost_atk',
    name: 'Power Boost', 
    type: 'duration',
    description: '+50% ATK boost to all cards for 1 turn.',
    duration: 1,
    handler: applyAttackBoost,
    modifier: (damage) => Math.floor(damage * 1.5)
  },

  double_first: {
    id: 'double_first',
    name: 'Champion\'s Might',
    type: 'duration', 
    description: 'First card played gets 2x ATK for 1 turn.',
    duration: 1,
    handler: applyFirstCardDouble,
    modifier: (damage, isFirstCard) => isFirstCard ? damage * 2 : damage
  },

  poison: {
    id: 'poison',
    name: 'Poison Cloud',
    type: 'duration',
    description: 'Deals 2 HP damage per turn for 3 turns.',
    duration: 3,
    handler: applyPoison,
    tickDamage: 2
  },

  // PLACEHOLDER FOR FUTURE EFFECTS
  // Add new effects here following the same pattern
  heal: {
    id: 'heal',
    name: 'Healing Light',
    type: 'instant',
    description: 'Restore 50 HP immediately.',
    duration: 0,
    handler: (data) => healPlayer(data.currentPlayer, 50)
  },

  shield: {
    id: 'shield', 
    name: 'Magic Shield',
    type: 'duration',
    description: 'Reduce all incoming damage by 50% for 2 turns.',
    duration: 2,
    handler: applyShield,
    modifier: (damage) => Math.floor(damage * 0.5)
  },

  draw_cards: {
    id: 'draw_cards',
    name: 'Card Draw',
    type: 'instant', 
    description: 'Draw 3 additional cards.',
    duration: 0,
    handler: (data) => drawCards(data.currentPlayer, 3)
  },

  burn: {
    id: 'burn',
    name: 'Flame Burst',
    type: 'duration',
    description: 'Deals 5 HP damage per turn for 2 turns.',
    duration: 2,
    handler: applyBurn,
    tickDamage: 5
  },

  freeze: {
    id: 'freeze',
    name: 'Ice Prison', 
    type: 'duration',
    description: 'Opponent skips their next turn.',
    duration: 1,
    handler: applyFreeze
  }
};

// Special Effect Processing Engine
export class SpecialEffectProcessor {
  constructor() {
    this.activeEffects = gameState.activeEffects || [];
    this.fieldEffects = gameState.fieldEffects || [];
  }

  // Apply a special effect card
  async applyEffect(card, gameData) {
    const effect = SPECIAL_EFFECTS[card.data.effect];
    
    if (!effect) {
      console.error(`Unknown special effect: ${card.data.effect}`);
      return false;
    }

    log(`✨ Applying special effect: ${effect.name}`);

    try {
      // Add scene reference for 3D operations
      if (window.scene) {
        gameData.scene = window.scene;
      }
      
      // Execute the effect handler
      await effect.handler(gameData);

      // Handle duration-based effects
      if (effect.type === 'duration' && effect.duration > 0) {
        this.addActiveEffect({
          effectId: effect.id,
          name: effect.name,
          description: effect.description,
          duration: effect.duration,
          remainingTurns: effect.duration,
          modifier: effect.modifier,
          tickDamage: effect.tickDamage,
          appliedBy: gameData.currentPlayer
        });
      }

      return true;
    } catch (error) {
      console.error(`Error applying special effect ${effect.name}:`, error);
      return false;
    }
  }

  // Add an active effect to the game state
  addActiveEffect(effectData) {
    this.activeEffects.push(effectData);
    gameState.activeEffects = this.activeEffects;
    log(`🔮 Effect "${effectData.name}" is now active for ${effectData.remainingTurns} turns`);
  }

  // Process all active effects at turn start
  processTurnEffects(currentPlayer) {
    const effectsToRemove = [];

    for (let i = 0; i < this.activeEffects.length; i++) {
      const effect = this.activeEffects[i];
      
      // Apply turn-based damage effects (poison, burn, etc.)
      if (effect.tickDamage && effect.tickDamage > 0) {
        this.applyTickDamage(effect, currentPlayer);
      }

      // Reduce remaining turns
      effect.remainingTurns--;
      
      // Mark expired effects for removal
      if (effect.remainingTurns <= 0) {
        effectsToRemove.push(i);
        log(`⏰ Effect "${effect.name}" has expired`);
      }
    }

    // Remove expired effects (reverse order to maintain indices)
    for (let i = effectsToRemove.length - 1; i >= 0; i--) {
      this.activeEffects.splice(effectsToRemove[i], 1);
    }

    gameState.activeEffects = this.activeEffects;
  }

  // Apply tick damage (poison, burn, etc.)
  applyTickDamage(effect, currentPlayer) {
    const targetPlayer = effect.appliedBy === 1 ? 2 : 1; // Damage the opponent
    const damage = effect.tickDamage;
    
    log(`💀 ${effect.name} deals ${damage} damage to Player ${targetPlayer}`);
    
    // Apply damage to target player
    const targetPlayerData = targetPlayer === 1 ? gameState.player1 : gameState.player2;
    targetPlayerData.hp = Math.max(0, targetPlayerData.hp - damage);
    
    // Show damage animation
    if (effect.effectId === 'poison') {
      showPoisonDamageAnimation(damage);
    } else if (effect.effectId === 'burn') {
      showBurnDamageAnimation(damage);
    }

    // Update HP display
    updateHPBars();
  }

  // Apply damage modifiers from active effects
  applyDamageModifiers(baseDamage, isFirstCard = false) {
    let modifiedDamage = baseDamage;

    for (const effect of this.activeEffects) {
      if (effect.modifier) {
        if (effect.effectId === 'double_first') {
          modifiedDamage = effect.modifier(modifiedDamage, isFirstCard);
        } else {
          modifiedDamage = effect.modifier(modifiedDamage);
        }
      }
    }

    return Math.floor(modifiedDamage);
  }

  // Check if a specific effect is active
  hasActiveEffect(effectId) {
    return this.activeEffects.some(effect => effect.effectId === effectId);
  }

  // Get all active effect names for display
  getActiveEffectNames() {
    return this.activeEffects.map(effect => effect.name);
  }

  // Clear all active effects (for game reset)
  clearAllEffects() {
    this.activeEffects = [];
    this.fieldEffects = [];
    gameState.activeEffects = [];
    gameState.fieldEffects = [];
  }
}

// Individual Effect Handler Functions
// These can be easily extended for new effects

async function shuffleAllHands(gameData) {
  log("🌪️ Chaos Shuffle: All hands shuffled!");
  
  const { gameState, scene } = gameData;
  
  // Collect all cards from both hands
  const allCards = [];
  
  // Remove cards from hands and collect them
  gameState.player1.hand.forEach(card => {
    if (scene && card.mesh) {
      scene.remove(card.mesh);
    }
    allCards.push(card.data);
  });
  gameState.player2.hand.forEach(card => {
    if (scene && card.mesh) {
      scene.remove(card.mesh);
    }
    allCards.push(card.data);
  });
  
  // Clear hands
  gameState.player1.hand = [];
  gameState.player2.hand = [];
  
  // Shuffle the collected cards
  const shuffledCards = shuffle(allCards);
  
  // Deal 5 cards to each player
  for (let i = 0; i < 5; i++) {
    if (shuffledCards[i * 2]) {
      const p1Card = new Card(shuffledCards[i * 2], true);
      gameState.player1.hand.push(p1Card);
    }
    if (shuffledCards[i * 2 + 1]) {
      const p2Card = new Card(shuffledCards[i * 2 + 1], false);
      gameState.player2.hand.push(p2Card);
    }
  }
  
  updateBoard();
  log(`All hands shuffled and redrawn!`);
}

function discardOpponentCards(count, gameData) {
  const { gameState, scene } = gameData;
  const opponent = gameState.currentPlayer === 1 ? gameState.player2 : gameState.player1;
  const discardCount = Math.min(count, opponent.hand.length);
  
  log(`🧠 Mind Fracture: Opponent discards ${discardCount} cards`);
  
  for (let i = 0; i < discardCount; i++) {
    const randomIndex = Math.floor(Math.random() * opponent.hand.length);
    const discardedCard = opponent.hand.splice(randomIndex, 1)[0];
    if (scene && discardedCard.mesh) {
      scene.remove(discardedCard.mesh);
    }
    log(`  Discarded: ${discardedCard.data.name}`);
  }
  
  updateBoard();
}

function applyAttackBoost(gameData) {
  log("⚡ Power Boost: All cards gain +50% ATK for 1 turn!");
}

function applyFirstCardDouble(gameData) {
  log("👑 Champion's Might: First card played gets 2x ATK for 1 turn!");
}

function applyPoison(gameData) {
  log("☠️ Poison Cloud: Opponent will take 2 damage per turn for 3 turns!");
}

function healPlayer(playerId, amount) {
  const player = playerId === 1 ? gameState.player1 : gameState.player2;
  const healAmount = Math.min(amount, player.maxHp - player.hp);
  player.hp += healAmount;
  log(`💚 Healed Player ${playerId} for ${healAmount} HP`);
  updateHPBars();
}

function applyShield(gameData) {
  log("🛡️ Magic Shield: Incoming damage reduced by 50% for 2 turns!");
}

function drawCards(playerId, count) {
  const player = playerId === 1 ? gameState.player1 : gameState.player2;
  
  for (let i = 0; i < count && gameState.availableCards.length > 0; i++) {
    const card = gameState.availableCards.pop();
    player.hand.push(card);
  }
  
  log(`📇 Drew ${count} cards for Player ${playerId}`);
  updateBoard();
}

function applyBurn(gameData) {
  log("🔥 Flame Burst: Opponent will take 5 damage per turn for 2 turns!");
}

function applyFreeze(gameData) {
  log("🧊 Ice Prison: Opponent's next turn is skipped!");
}

// Animation Functions (to be imported from game.js or created)
function showPoisonDamageAnimation(damage) {
  // Implementation will be imported from game.js
  if (window.showPoisonDamageAnimation) {
    window.showPoisonDamageAnimation(damage);
  }
}

function showBurnDamageAnimation(damage) {
  // Create burn damage animation similar to poison
  const overlay = document.createElement('div');
  overlay.textContent = `🔥 -${damage}`;
  overlay.className = 'damage-animation';
  overlay.style.cssText = `
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translateX(-50%);
    color: #FF4444;
    font-size: 2rem;
    font-weight: bold;
    text-shadow: 0 0 10px #FF4444;
    pointer-events: none;
    z-index: 10000;
  `;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 2000);
}

// Utility functions (to be imported from game.js)
function log(message) {
  if (window.log) {
    window.log(message);
  } else {
    console.log(message);
  }
}

function updateBoard() {
  if (window.updateBoard) {
    window.updateBoard();
  }
}

function updateHPBars() {
  if (window.updateHPBars) {
    window.updateHPBars();
  }
}

// Access gameState from global window object
function getGameState() {
  return window.gameState || {};
}

// Export the processor instance
export const specialEffectProcessor = new SpecialEffectProcessor();

// Export utility functions for external use
export {
  shuffleAllHands,
  discardOpponentCards,
  applyAttackBoost,
  applyFirstCardDouble,
  applyPoison,
  healPlayer,
  applyShield,
  drawCards,
  applyBurn,
  applyFreeze
};