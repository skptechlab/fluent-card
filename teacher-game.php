<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
    <title>Fluency Card Game - Teacher Game Overview</title>
    <meta name="description" content="Teacher overview interface for monitoring card game sessions" />
    <link rel="icon" type="image/png" href="./assets/logo.gif" />
    <meta name="theme-color" content="#0B0B0B" />
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Roboto:wght@400;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet" />
    
    <!-- CSS Files - Using existing fluent-card styling -->
    <link rel="stylesheet" href="css/base.css"/>
    <link rel="stylesheet" href="css/animations.css"/>
    <link rel="stylesheet" href="css/components.css"/>
    <link rel="stylesheet" href="css/layout.css"/>
    <link rel="stylesheet" href="css/utilities.css"/>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #0B0B0B 0%, #1a1a2e 50%, #16213e 100%);
            font-family: 'Roboto', sans-serif;
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }
        
        .teacher-game-container {
            display: grid;
            grid-template-areas: 
                "header header header"
                "left-panel center-panel right-panel"
                "bottom-controls bottom-controls bottom-controls";
            grid-template-rows: 80px 1fr 100px;
            grid-template-columns: 300px 1fr 300px;
            height: 100vh;
            gap: 10px;
            padding: 10px;
            box-sizing: border-box;
        }
        
        .header-panel {
            grid-area: header;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .room-title {
            font-family: 'Orbitron', monospace;
            font-size: 1.5rem;
            color: #fff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        
        .game-status-header {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .status-indicator {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
        }
        
        .status-waiting {
            background: rgba(255, 152, 0, 0.3);
            color: #FF9800;
        }
        
        .status-active {
            background: rgba(76, 175, 80, 0.3);
            color: #4CAF50;
        }
        
        .left-panel {
            grid-area: left-panel;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow-y: auto;
        }
        
        .center-panel {
            grid-area: center-panel;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 15px;
            position: relative;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
        }
        
        .right-panel {
            grid-area: right-panel;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow-y: auto;
        }
        
        .bottom-controls {
            grid-area: bottom-controls;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .panel-title {
            font-weight: bold;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
        }
        
        .player-overview {
            margin-bottom: 2rem;
        }
        
        .player-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid #4CAF50;
        }
        
        .player-card.spectator {
            border-left-color: #2196F3;
        }
        
        .player-name {
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .player-stats {
            font-size: 0.9rem;
            color: #aaa;
        }
        
        .hp-bar {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            height: 20px;
            margin: 0.5rem 0;
            overflow: hidden;
        }
        
        .hp-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.3s ease;
            border-radius: 10px;
        }
        
        .hp-text {
            text-align: center;
            margin-top: -20px;
            line-height: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            color: #fff;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        .game-arena {
            width: 100%;
            height: 100%;
            position: relative;
            background: radial-gradient(circle at center, rgba(76, 175, 80, 0.1) 0%, transparent 70%);
        }
        
        .arena-placeholder {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #aaa;
        }
        
        .arena-placeholder-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.3;
        }
        
        .battle-log {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .log-entry {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            border-left: 3px solid #4CAF50;
        }
        
        .log-entry.damage {
            border-left-color: #f44336;
        }
        
        .log-entry.turn {
            border-left-color: #2196F3;
        }
        
        .teacher-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            font-size: 0.9rem;
        }
        
        .teacher-btn.primary {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
        }
        
        .teacher-btn.secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .teacher-btn.danger {
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white;
        }
        
        .teacher-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
        }
        
        .teacher-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .sync-indicator {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        .sync-indicator.offline {
            background: #f44336;
            animation: none;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .spectator-list {
            margin-top: 1rem;
        }
        
        .spectator-item {
            background: rgba(33, 150, 243, 0.1);
            border-radius: 5px;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            border-left: 3px solid #2196F3;
        }
        
        .turn-indicator {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
            border-radius: 10px;
            padding: 1rem;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .turn-player {
            font-size: 1.2rem;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .waiting-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            z-index: 1000;
        }
        
        .waiting-animation {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 2rem 0;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="teacher-game-container">
        <!-- Header Panel -->
        <div class="header-panel">
            <div class="room-title" id="roomTitle">🎓 Teacher Game Overview</div>
            <div class="game-status-header">
                <div class="status-indicator status-waiting" id="gameStatusIndicator">Waiting</div>
                <div class="sync-indicator" id="syncIndicator"></div>
            </div>
        </div>
        
        <!-- Left Panel - Player Management -->
        <div class="left-panel">
            <div class="panel-title">👥 Players & Spectators</div>
            
            <div class="player-overview" id="playersOverview">
                <div class="loading">Loading participants...</div>
            </div>
            
            <div class="turn-indicator" id="turnIndicator" style="display: none;">
                <div>Current Turn:</div>
                <div class="turn-player" id="currentTurnPlayer">--</div>
            </div>
        </div>
        
        <!-- Center Panel - Game Arena -->
        <div class="center-panel">
            <div class="game-arena" id="gameArena">
                <div class="arena-placeholder">
                    <div class="arena-placeholder-icon">🃏</div>
                    <div>Game Arena</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
                        Visual representation of the card battle
                    </div>
                </div>
            </div>
            
            <!-- Waiting Screen -->
            <div class="waiting-screen" id="waitingScreen">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                <div style="font-size: 1.2rem; margin-bottom: 1rem;">Waiting for Players</div>
                <div class="waiting-animation"></div>
                <div style="color: #aaa;">Need at least 1 player to start the game</div>
            </div>
        </div>
        
        <!-- Right Panel - Game Activity -->
        <div class="right-panel">
            <div class="panel-title">📜 Game Activity</div>
            
            <div class="battle-log" id="battleLog">
                <div class="log-entry">
                    <strong>Game Session Started</strong><br>
                    <small>Waiting for players to join...</small>
                </div>
            </div>
        </div>
        
        <!-- Bottom Controls -->
        <div class="bottom-controls">
            <button class="teacher-btn primary" id="startGameBtn" onclick="startGameSession()" disabled>
                🎮 Start Game
            </button>
            <button class="teacher-btn secondary" onclick="pauseGame()">
                ⏸️ Pause
            </button>
            <button class="teacher-btn secondary" onclick="resetGame()">
                🔄 Reset
            </button>
            <button class="teacher-btn secondary" onclick="openStudentView()">
                👁️ Student View
            </button>
            <button class="teacher-btn danger" onclick="endSession()">
                🔚 End Session
            </button>
        </div>
    </div>

    <script type="module">
        // Teacher game overview state
        let currentRoom = null;
        let teacherSyncInterval = null;
        let roomParticipants = [];
        let isGameActive = false;
        let gameState = null;

        // Get room from URL
        const urlParams = new URLSearchParams(window.location.search);
        const roomNumber = urlParams.get('room');

        if (!roomNumber) {
            alert('No room specified. Redirecting to teacher portal.');
            window.location.href = './index-teacher.php';
        }

        // Initialize teacher game interface
        document.addEventListener('DOMContentLoaded', async function() {
            await initializeTeacherGameSession();
            startSyncLoop();
        });

        async function initializeTeacherGameSession() {
            try {
                // Load room state
                await loadRoomState();
                
                // Update UI
                document.getElementById('roomTitle').textContent = `🎓 Room ${roomNumber} - Teacher Overview`;
                
                console.log('Teacher game session initialized for room', roomNumber);
                
            } catch (error) {
                console.error('Failed to initialize teacher game session:', error);
                alert('Failed to initialize session: ' + error.message);
            }
        }

        async function loadRoomState() {
            try {
                console.log('Loading room state for room:', roomNumber);
                const response = await fetch(`./api/room_handler.php?action=get_room_state&room_number=${roomNumber}`);
                const result = await response.json();
                
                console.log('Room state response:', result);

                if (result.success) {
                    currentRoom = result.data.room;
                    roomParticipants = result.data.participants || [];
                    gameState = result.data.game_state;
                    
                    console.log('Loaded room data:', {
                        room: currentRoom,
                        participants: roomParticipants,
                        gameState: gameState
                    });
                    
                    updateUI();
                    updateSyncStatus(true);
                } else {
                    console.error('Failed to load room state:', result.error);
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error loading room state:', error);
                updateSyncStatus(false);
                throw error;
            }
        }

        function updateUI() {
            updateGameStatus();
            updatePlayersOverview();
            updateGameArena();
            updateBattleLog();
        }

        function updateGameStatus() {
            const statusElement = document.getElementById('gameStatusIndicator');
            
            if (isGameActive || (gameState && gameState.gameState && gameState.gameState.gameActive)) {
                statusElement.textContent = 'Active';
                statusElement.className = 'status-indicator status-active';
                isGameActive = true;
                
                // Hide waiting screen
                document.getElementById('waitingScreen').style.display = 'none';
            } else {
                statusElement.textContent = 'Waiting';
                statusElement.className = 'status-indicator status-waiting';
                
                // Show waiting screen if no players
                const players = roomParticipants.filter(p => p.role === 'player');
                if (players.length === 0) {
                    document.getElementById('waitingScreen').style.display = 'flex';
                } else {
                    document.getElementById('waitingScreen').style.display = 'none';
                }
            }
            
            // Update start game button
            updateStartGameButton();
        }

        function updatePlayersOverview() {
            const container = document.getElementById('playersOverview');
            const players = roomParticipants.filter(p => p.role === 'player');
            const spectators = roomParticipants.filter(p => p.role === 'spectator');
            
            console.log('Updating players overview:', {
                totalParticipants: roomParticipants.length,
                players: players,
                spectators: spectators
            });
            
            let html = '';
            
            // Players
            if (players.length > 0) {
                players.forEach((player, index) => {
                    const hp = gameState && gameState.gameState && gameState.gameState.players 
                        ? (gameState.gameState.players[index]?.hp || 500) 
                        : 500;
                    const maxHp = 500;
                    const hpPercentage = (hp / maxHp) * 100;
                    
                    html += `
                        <div class=\"player-card\">
                            <div class=\"player-name\">🎮 ${player.username}</div>
                            <div class=\"player-stats\">Player ${index + 1}</div>
                            <div class=\"hp-bar\">
                                <div class=\"hp-fill\" style=\"width: ${hpPercentage}%\"></div>
                            </div>
                            <div class=\"hp-text\">${hp}/${maxHp} HP</div>
                        </div>
                    `;
                });
            } else {
                html += '<div style=\"color: #aaa; font-style: italic; text-align: center; padding: 2rem;\">No players in the arena<br><small>Participants: ' + roomParticipants.length + '</small></div>';
            }
            
            // Spectators
            if (spectators.length > 0) {
                html += '<div class=\"spectator-list\">';
                spectators.forEach(spectator => {
                    html += `
                        <div class=\"spectator-item\">
                            👁️ ${spectator.username} (Spectator)
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            console.log('Setting players overview HTML:', html);
            container.innerHTML = html;
            
            // Update turn indicator
            if (isGameActive && gameState && gameState.gameState && gameState.gameState.currentTurn) {
                const currentPlayer = players.find(p => p.player_id == gameState.gameState.currentTurn);
                if (currentPlayer) {
                    document.getElementById('turnIndicator').style.display = 'block';
                    document.getElementById('currentTurnPlayer').textContent = currentPlayer.username;
                } else {
                    document.getElementById('turnIndicator').style.display = 'none';
                }
            } else {
                document.getElementById('turnIndicator').style.display = 'none';
            }
        }

        function updateGameArena() {
            const arena = document.getElementById('gameArena');
            const placeholder = arena.querySelector('.arena-placeholder');
            
            if (isGameActive) {
                placeholder.style.display = 'none';
                // Here you could add visual representations of the game state
                // For now, just hide the placeholder
            } else {
                placeholder.style.display = 'block';
            }
        }

        function updateBattleLog() {
            // This would be populated with actual game events
            // For now, just show basic status
        }

        function updateStartGameButton() {
            const players = roomParticipants.filter(p => p.role === 'player');
            const startBtn = document.getElementById('startGameBtn');
            
            if (players.length >= 1 && !isGameActive) {
                startBtn.disabled = false;
                startBtn.textContent = players.length === 1 ? '🎮 Start vs AI' : '🎮 Start PvP';
            } else if (isGameActive) {
                startBtn.disabled = true;
                startBtn.textContent = '🎮 Game Active';
            } else {
                startBtn.disabled = true;
                startBtn.textContent = '🎮 Need Players';
            }
        }

        function updateSyncStatus(isOnline) {
            const indicator = document.getElementById('syncIndicator');
            indicator.className = isOnline ? 'sync-indicator' : 'sync-indicator offline';
        }

        function startSyncLoop() {
            teacherSyncInterval = setInterval(async () => {
                try {
                    await loadRoomState();
                } catch (error) {
                    console.error('Sync error:', error);
                }
            }, 2000);
        }

        // Teacher control functions
        window.startGameSession = async function() {
            try {
                const players = roomParticipants.filter(p => p.role === 'player');
                
                if (players.length === 0) {
                    alert('No players in the room');
                    return;
                }

                console.log('Starting game session with players:', players);

                // Update game state to active
                console.log('Creating game state with players:', players);
                const newGameState = {
                    gameActive: true,
                    gameStarted: true,
                    players: players.map(p => ({
                        id: p.player_id,
                        username: p.username,
                        hp: 500,
                        maxHp: 500
                    })),
                    currentTurn: players[0].player_id,
                    startTime: Date.now()
                };
                
                console.log('Game state created:', newGameState);
                console.log('Current turn set to player ID:', players[0].player_id);

                console.log('Sending game state:', newGameState);
                await updateRoomGameState(newGameState);
                
                isGameActive = true;
                updateUI();
                
                // Add to battle log
                addToBattleLog('Game Started', `Battle begins with ${players.length} players!`);
                
                console.log('Game session started for room', roomNumber);
                
            } catch (error) {
                console.error('Failed to start game:', error);
                alert('Failed to start game: ' + error.message);
            }
        };

        window.pauseGame = async function() {
            try {
                const gameStateUpdate = {
                    gamePaused: true,
                    pauseTime: Date.now()
                };

                await updateRoomGameState(gameStateUpdate);
                addToBattleLog('Game Paused', 'Teacher paused the game');
                console.log('Game paused');
                
            } catch (error) {
                alert('Failed to pause game: ' + error.message);
            }
        };

        window.resetGame = async function() {
            if (!confirm('Are you sure you want to reset the game? All progress will be lost.')) {
                return;
            }

            try {
                const gameStateUpdate = {
                    gameActive: false,
                    gameReset: true,
                    resetTime: Date.now()
                };

                await updateRoomGameState(gameStateUpdate);
                
                isGameActive = false;
                updateUI();
                
                addToBattleLog('Game Reset', 'Teacher reset the game');
                console.log('Game reset');
                
            } catch (error) {
                alert('Failed to reset game: ' + error.message);
            }
        };

        window.openStudentView = function() {
            const url = `./student.php?room=${roomNumber}&role=spectator&preview=true`;
            window.open(url, '_blank');
        };

        window.endSession = async function() {
            if (!confirm('Are you sure you want to end this session? All students will be disconnected.')) {
                return;
            }

            try {
                // Clear sync interval
                if (teacherSyncInterval) {
                    clearInterval(teacherSyncInterval);
                }

                // Redirect back to teacher portal
                window.location.href = './index-teacher.php';
                
            } catch (error) {
                alert('Failed to end session: ' + error.message);
            }
        };

        // Helper function to update room game state
        async function updateRoomGameState(state) {
            const response = await fetch('./api/room_handler.php?action=update_room_state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: currentRoom.id,
                    game_state: {
                        gameState: state,
                        lastUpdate: Date.now()
                    }
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return result;
        }

        // Helper function to add entries to battle log
        function addToBattleLog(title, description, type = 'info') {
            const log = document.getElementById('battleLog');
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            entry.innerHTML = `
                <strong>${title}</strong><br>
                <small>${description}</small>
            `;
            
            log.insertBefore(entry, log.firstChild);
            
            // Keep only last 20 entries
            while (log.children.length > 20) {
                log.removeChild(log.lastChild);
            }
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (teacherSyncInterval) {
                clearInterval(teacherSyncInterval);
            }
        });
    </script>
</body>
</html>