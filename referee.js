// referee.js - Referee Dashboard for Card Battle Arena

// Referee state management
const refereeState = {
  currentEvaluation: null,
  gameState: null,
  connectionStatus: 'offline',
  evaluationQueue: [],
  actionLog: []
};

// Initialize referee dashboard
document.addEventListener('DOMContentLoaded', () => {
  initializeReferee();
  startPolling();
});

// Initialize the referee interface
function initializeReferee() {
  logAction('Referee dashboard initialized');
  updateConnectionStatus('offline');
  
  // Check for existing game state in localStorage
  const savedGameState = localStorage.getItem('battleArenaGameState');
  if (savedGameState) {
    try {
      refereeState.gameState = JSON.parse(savedGameState);
      updateGameStatus();
      updateConnectionStatus('online');
      logAction('Connected to existing game session');
    } catch (error) {
      logAction('Failed to load game state: ' + error.message);
    }
  }
}

// Start polling for game updates
function startPolling() {
  setInterval(() => {
    checkForGameUpdates();
    checkForPendingEvaluations();
  }, 1000); // Poll every second
}

// Check for game state updates
function checkForGameUpdates() {
  const savedGameState = localStorage.getItem('battleArenaGameState');
  if (savedGameState) {
    try {
      const newGameState = JSON.parse(savedGameState);
      if (JSON.stringify(newGameState) !== JSON.stringify(refereeState.gameState)) {
        refereeState.gameState = newGameState;
        updateGameStatus();
        
        if (refereeState.connectionStatus === 'offline') {
          updateConnectionStatus('online');
          logAction('Connected to game session');
        }
      }
    } catch (error) {
      console.error('Error parsing game state:', error);
    }
  } else if (refereeState.connectionStatus === 'online') {
    updateConnectionStatus('offline');
    logAction('Lost connection to game session');
  }
}

// Check for pending card evaluations
function checkForPendingEvaluations() {
  const pendingEvaluations = localStorage.getItem('pendingCardEvaluations');
  if (pendingEvaluations) {
    try {
      const evaluations = JSON.parse(pendingEvaluations);
      console.log('Checking evaluations:', evaluations);
      if (evaluations.length > 0 && !refereeState.currentEvaluation) {
        console.log('Showing evaluation for:', evaluations[0]);
        showCardEvaluation(evaluations[0]);
      }
    } catch (error) {
      console.error('Error parsing pending evaluations:', error);
    }
  } else {
    console.log('No pending evaluations found');
  }
}

// Update connection status indicator
function updateConnectionStatus(status) {
  refereeState.connectionStatus = status;
  const statusIndicator = document.getElementById('connectionStatus');
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('span:last-child');
  
  statusDot.className = `status-dot ${status}`;
  statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

// Update game status display
function updateGameStatus() {
  if (!refereeState.gameState) return;
  
  const { player1, player2, currentPlayer, isGameActive } = refereeState.gameState;
  
  // Update player names
  document.getElementById('player1Name').textContent = player1.username || 'Player 1';
  document.getElementById('player2Name').textContent = player2.username || 'AI Opponent';
  
  // Update HP values
  document.getElementById('player1HP').textContent = `${player1.hp}/${player1.maxHp} HP`;
  document.getElementById('player2HP').textContent = `${player2.hp}/${player2.maxHp} HP`;
  
  // Update HP bars
  const p1Percentage = (player1.hp / player1.maxHp) * 100;
  const p2Percentage = (player2.hp / player2.maxHp) * 100;
  document.getElementById('player1HPBar').style.width = `${p1Percentage}%`;
  document.getElementById('player2HPBar').style.width = `${p2Percentage}%`;
  
  // Update turn info
  const turnInfo = document.getElementById('currentTurnInfo');
  if (!isGameActive) {
    turnInfo.textContent = 'Game not active';
  } else if (currentPlayer === 1) {
    turnInfo.textContent = `${player1.username || 'Player 1'}'s turn`;
  } else {
    turnInfo.textContent = `${player2.username || 'AI Opponent'}'s turn`;
  }
}

// Show card evaluation interface
function showCardEvaluation(cardData) {
  refereeState.currentEvaluation = cardData;
  
  const panel = document.getElementById('evaluationPanel');
  const waitingState = document.getElementById('waitingState');
  const cardImage = document.getElementById('evalCardImage');
  const cardName = document.getElementById('evalCardName');
  const cardAttack = document.getElementById('evalCardAttack');
  const cardPlayer = document.getElementById('evalCardPlayer');
  const cardTarget = document.getElementById('evalCardTarget');
  const damageInput = document.getElementById('damageInput');
  
  // Populate card information
  cardImage.src = cardData.imagePath;
  cardName.textContent = cardData.name;
  cardAttack.textContent = cardData.atk;
  cardPlayer.textContent = cardData.playerName || 'Player 1';
  cardTarget.textContent = cardData.targetPlayer || 'Opponent';
  damageInput.value = cardData.atk; // Default to original attack value
  
  // Update panel styling based on player type
  if (cardData.isAI) {
    panel.style.borderColor = '#FF4500';
    panel.style.background = 'linear-gradient(145deg, rgba(60, 20, 0, 0.95), rgba(80, 30, 0, 0.9))';
    panel.style.boxShadow = '0 0 30px rgba(255, 69, 0, 0.3)';
    cardPlayer.style.background = 'linear-gradient(135deg, #FF4500, #FF6500)';
  } else {
    panel.style.borderColor = '#FFD700';
    panel.style.background = 'linear-gradient(145deg, rgba(40, 30, 0, 0.95), rgba(60, 45, 0, 0.9))';
    panel.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.3)';
    cardPlayer.style.background = 'linear-gradient(135deg, #FF0000, #FF4500)';
  }
  
  // Show evaluation panel and hide waiting state
  panel.style.display = 'flex';
  waitingState.style.display = 'none';
  
  const playerType = cardData.isAI ? 'AI' : 'Player';
  logAction(`${playerType} card evaluation required: ${cardData.name} (${cardData.atk} ATK)`);
}

// Hide card evaluation interface
function hideCardEvaluation() {
  const panel = document.getElementById('evaluationPanel');
  const waitingState = document.getElementById('waitingState');
  
  panel.style.display = 'none';
  waitingState.style.display = 'flex';
  refereeState.currentEvaluation = null;
}

// Adjust damage value
window.adjustDamage = function(amount) {
  const damageInput = document.getElementById('damageInput');
  const currentValue = parseInt(damageInput.value) || 0;
  const newValue = Math.max(0, Math.min(100, currentValue + amount));
  damageInput.value = newValue;
};

// Approve card with original values
window.approveCard = function() {
  if (!refereeState.currentEvaluation) return;
  
  const approval = {
    cardId: refereeState.currentEvaluation.id,
    approved: true,
    modifiedDamage: refereeState.currentEvaluation.atk,
    timestamp: new Date().toISOString()
  };
  
  sendEvaluationResult(approval);
  logAction(`✅ Approved: ${refereeState.currentEvaluation.name} (${refereeState.currentEvaluation.atk} damage)`);
  hideCardEvaluation();
};

// Modify and approve card
window.modifyCard = function() {
  if (!refereeState.currentEvaluation) return;
  
  const damageInput = document.getElementById('damageInput');
  const modifiedDamage = parseInt(damageInput.value) || 0;
  
  const approval = {
    cardId: refereeState.currentEvaluation.id,
    approved: true,
    modifiedDamage: modifiedDamage,
    timestamp: new Date().toISOString()
  };
  
  sendEvaluationResult(approval);
  logAction(`🔧 Modified & Approved: ${refereeState.currentEvaluation.name} (${refereeState.currentEvaluation.atk} → ${modifiedDamage} damage)`);
  hideCardEvaluation();
};

// Reject card
window.rejectCard = function() {
  if (!refereeState.currentEvaluation) return;
  
  const rejection = {
    cardId: refereeState.currentEvaluation.id,
    approved: false,
    reason: 'Rejected by referee',
    timestamp: new Date().toISOString()
  };
  
  sendEvaluationResult(rejection);
  logAction(`❌ Rejected: ${refereeState.currentEvaluation.name}`);
  hideCardEvaluation();
};

// Send evaluation result back to game
function sendEvaluationResult(result) {
  // Store the evaluation result for the game to pick up
  localStorage.setItem('cardEvaluationResult', JSON.stringify(result));
  
  // Remove the evaluated card from pending queue
  const pendingEvaluations = JSON.parse(localStorage.getItem('pendingCardEvaluations') || '[]');
  const filteredEvaluations = pendingEvaluations.filter(card => card.id !== result.cardId);
  localStorage.setItem('pendingCardEvaluations', JSON.stringify(filteredEvaluations));
  
  // Check for next evaluation
  if (filteredEvaluations.length > 0) {
    setTimeout(() => showCardEvaluation(filteredEvaluations[0]), 500);
  }
}

// Quick action functions
window.pauseGame = function() {
  localStorage.setItem('gameAction', JSON.stringify({ action: 'pause', timestamp: Date.now() }));
  logAction('⏸️ Game paused by referee');
};

window.resumeGame = function() {
  localStorage.setItem('gameAction', JSON.stringify({ action: 'resume', timestamp: Date.now() }));
  logAction('▶️ Game resumed by referee');
};

window.restartGame = function() {
  if (confirm('Are you sure you want to restart the game? This will reset all progress.')) {
    localStorage.setItem('gameAction', JSON.stringify({ action: 'restart', timestamp: Date.now() }));
    logAction('🔄 Game restarted by referee');
  }
};

window.viewMainGame = function() {
  window.open('./index.html', '_blank');
  logAction('👁️ Opened main game view');
};

// Add entry to action log
function logAction(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = {
    timestamp,
    message,
    time: Date.now()
  };
  
  refereeState.actionLog.unshift(logEntry);
  
  // Keep only last 50 entries
  if (refereeState.actionLog.length > 50) {
    refereeState.actionLog = refereeState.actionLog.slice(0, 50);
  }
  
  updateActionLog();
}

// Update action log display
function updateActionLog() {
  const actionLog = document.getElementById('actionLog');
  actionLog.innerHTML = '';
  
  refereeState.actionLog.forEach(entry => {
    const logElement = document.createElement('div');
    logElement.className = 'log-entry';
    logElement.innerHTML = `
      <span class="timestamp">[${entry.timestamp}]</span>
      <span class="log-message">${entry.message}</span>
    `;
    actionLog.appendChild(logElement);
  });
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (!refereeState.currentEvaluation) return;
  
  switch(event.key) {
    case '1':
      event.preventDefault();
      approveCard();
      break;
    case '2':
      event.preventDefault();
      modifyCard();
      break;
    case '3':
      event.preventDefault();
      rejectCard();
      break;
    case 'Escape':
      event.preventDefault();
      rejectCard();
      break;
  }
});

console.log('Referee Dashboard initialized. Use keyboard shortcuts: 1=Approve, 2=Modify, 3=Reject, Esc=Reject');