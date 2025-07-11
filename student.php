<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
    <title>Fluency Card Game - Student Game</title>
    <meta name="description" content="Student interface for playing card games in classroom arenas" />
    <link rel="icon" type="image/png" href="./assets/logo.gif" />
    <meta name="theme-color" content="#0B0B0B" />
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Roboto:wght@400;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet" />
    
    <!-- CSS Files - Using existing fluent-card styling -->
    <link rel="stylesheet" href="css/base.css"/>
    <link rel="stylesheet" href="css/animations.css"/>
    <link rel="stylesheet" href="css/components.css"/>
    <link rel="stylesheet" href="css/homepage-minimal.css"/>
    <link rel="stylesheet" href="css/battle.css"/>
    <link rel="stylesheet" href="css/menu.css"/>
    <link rel="stylesheet" href="css/layout.css"/>
    <link rel="stylesheet" href="css/game-interface.css"/>
    <link rel="stylesheet" href="css/responsive.css"/>
    <link rel="stylesheet" href="css/utilities.css"/>
    
    <style>
        .student-info {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem;
            z-index: 999;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 200px;
        }
        
        .student-role {
            color: #fff;
            font-weight: bold;
            margin-bottom: 0.5rem;
            text-align: center;
        }
        
        .role-player {
            color: #4CAF50;
        }
        
        .role-spectator {
            color: #2196F3;
        }
        
        .room-info {
            color: #aaa;
            font-size: 0.8rem;
            margin-bottom: 0.5rem;
        }
        
        .student-controls {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .student-btn {
            padding: 0.4rem 0.8rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.3s ease;
        }
        
        .student-btn.primary {
            background: #4CAF50;
            color: white;
        }
        
        .student-btn.secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
        }
        
        .student-btn.danger {
            background: #f44336;
            color: white;
        }
        
        .student-btn:hover {
            transform: translateY(-1px);
            opacity: 0.9;
        }
        
        .spectator-mode {
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem 2rem;
            color: #fff;
            text-align: center;
            z-index: 999;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .spectator-title {
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .spectator-description {
            font-size: 0.9rem;
            color: #aaa;
        }
        
        .waiting-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0B0B0B 0%, #1a1a2e 50%, #16213e 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: #fff;
            text-align: center;
        }
        
        .waiting-title {
            font-family: 'Orbitron', monospace;
            font-size: 2rem;
            margin-bottom: 1rem;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
        
        .waiting-message {
            font-size: 1.1rem;
            color: #aaa;
            margin-bottom: 2rem;
        }
        
        .waiting-animation {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 2rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .sync-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
        }
        
        .sync-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        .sync-dot.offline {
            background: #f44336;
            animation: none;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .homepage {
            display: none;
        }
        
        /* Modify control buttons for students */
        .control-buttons {
            position: fixed;
            bottom: 10px;
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .control-btn {
            padding: 0.5rem 1rem;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            color: #fff;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.3s ease;
        }
        
        .control-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        /* Turn indicator styles */
        .your-turn {
            background: linear-gradient(45deg, #4CAF50, #8BC34A) !important;
            color: white !important;
            box-shadow: 0 0 15px rgba(76, 175, 80, 0.5) !important;
            animation: turnGlow 2s ease-in-out infinite alternate !important;
        }
        
        .other-turn {
            background: linear-gradient(45deg, #FF9800, #FFC107) !important;
            color: white !important;
            box-shadow: 0 0 15px rgba(255, 152, 0, 0.5) !important;
        }
        
        .ai-turn {
            background: linear-gradient(45deg, #f44336, #FF5722) !important;
            color: white !important;
            box-shadow: 0 0 15px rgba(244, 67, 54, 0.5) !important;
        }
        
        @keyframes turnGlow {
            from {
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
            }
            to {
                box-shadow: 0 0 25px rgba(76, 175, 80, 0.8);
            }
        }
    </style>
</head>
<body>
    <!-- Waiting Screen -->
    <div class="waiting-screen" id="waitingScreen">
        <img src="./assets/logo.gif" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 2rem;">
        <div class="waiting-title">Joining Arena</div>
        <div class="waiting-message" id="waitingMessage">Connecting to room...</div>
        <div class="waiting-animation"></div>
        <button class="btn btn-secondary" onclick="leaveRoom()">Leave Room</button>
    </div>

    <!-- Student Info Panel -->
    <div class="student-info" id="studentInfo" style="display: none;">
        <div class="student-role" id="studentRole">
            🎮 Player
        </div>
        <div class="room-info" id="roomInfo">
            Room: <span id="currentRoom">--</span>
        </div>
        <div class="student-controls">
            <button class="student-btn secondary" onclick="toggleFullscreen()" id="fullscreenBtn">
                📱 Fullscreen
            </button>
            <button class="student-btn danger" onclick="leaveRoom()">
                🚪 Leave
            </button>
        </div>
    </div>
    
    <!-- Sync Status Indicator -->
    <div class="sync-indicator">
        <div class="sync-dot" id="syncDot"></div>
    </div>

    <!-- Spectator Mode Indicator -->
    <div class="spectator-mode" id="spectatorMode" style="display: none;">
        <div class="spectator-title">👁️ Spectator Mode</div>
        <div class="spectator-description">Watching the game - you cannot play cards</div>
    </div>

    <!-- Game Canvas -->
    <canvas id="gameCanvas" style="display: none;"></canvas>

    <!-- Game UI Overlay -->
    <div class="ui-overlay" id="gameUI" style="display: none;">
        <!-- HP Bars -->
        <div class="compact-hp-container">
            <div class="compact-hp-bar player-hp" id="playerHPBar">
                <div class="hp-label" id="player1Name">Player 1</div>
                <div class="hp-bar-wrapper">
                    <div class="hp-bar-bg">
                        <div class="hp-bar-fill" id="player1HPFill" style="width: 100%;"></div>
                    </div>
                    <div class="hp-text" id="player1HPText">500</div>
                </div>
            </div>
            
            <div class="compact-hp-bar opponent-hp" id="opponentHPBar">
                <div class="hp-label" id="player2Name">Player 2</div>
                <div class="hp-bar-wrapper">
                    <div class="hp-bar-bg">
                        <div class="hp-bar-fill" id="player2HPFill" style="width: 100%;"></div>
                    </div>
                    <div class="hp-text" id="player2HPText">500</div>
                </div>
            </div>
        </div>

        <!-- Turn Indicator -->
        <div class="turn-indicator" id="currentTurn">Waiting for game...</div>

        <!-- Game Log -->
        <div class="game-log" id="gameLog">
            <div class="log-header">Battle Log</div>
        </div>

        <!-- Card Tooltip -->
        <div class="card-tooltip" id="cardTooltip"></div>

        <!-- Card Zoom Panel -->
        <div class="card-zoom-panel" id="cardZoomPanel" style="display: none;">
            <div class="zoom-card-info">
                <h3 id="cardZoomName">Card Name</h3>
                <div class="zoom-card-stats">
                    <div class="stat-item">
                        <span class="stat-icon">⚔️</span>
                        <span class="stat-label">Attack:</span>
                        <span class="stat-value" id="cardZoomAttack">0</span>
                    </div>
                </div>
                <div class="zoom-card-description" id="cardZoomDescription">
                    Click this card to deal damage to your opponent!
                </div>
                <div class="zoom-card-actions" id="cardZoomActions">
                    <button class="zoom-play-btn" onclick="confirmPlayCard(event)">
                        <span class="btn-icon">⚔️</span>
                        <span>Play Card</span>
                    </button>
                    <button class="zoom-cancel-btn" onclick="closeCardZoom()">
                        <span class="btn-icon">✕</span>
                        <span>Cancel</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Battle Action Panel -->
        <div class="battle-action-panel" id="battleActionPanel" style="display: none;">
            <div class="battle-panel-info">
                <h3 id="battlePanelTitle">Ready to Battle</h3>
                <div class="battle-panel-stats">
                    <div class="stat-item">
                        <span class="stat-icon">🎯</span>
                        <span class="stat-label">Cards on Field:</span>
                        <span class="stat-value" id="battleFieldCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">⚔️</span>
                        <span class="stat-label">Total Attack:</span>
                        <span class="stat-value" id="battleTotalAttack">0</span>
                    </div>
                </div>
                <div class="battle-panel-description">
                    Execute your combined attack or return cards to hand.
                </div>
                <div class="battle-panel-actions">
                    <button class="battle-action-btn" id="battleBtn" onclick="executeBattle(event)">
                        <span class="btn-icon">⚔️</span>
                        <span>BATTLE!</span>
                    </button>
                    <button class="battle-cancel-btn" id="returnHandBtn" onclick="returnCardsToHand(event)">
                        <span class="btn-icon">↩️</span>
                        <span>Return to Hand</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modified Control Buttons for Students -->
    <div class="control-buttons" id="gameControls" style="display: none;">
        <button class="control-btn" onclick="toggleMute()">🔇 Mute</button>
    </div>

    <!-- Audio -->
    <audio id="bg-audio" autoplay muted loop>
        <source src="./assets/bg_score.mp3" type="audio/mpeg">
    </audio>

    <!-- Three.js for 3D graphics - must load before modules -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>

    <script type="module">
        import { initializeGame, gameState, loginPlayer, syncMultiplayerGameState } from './game.js';
        import { fullscreenManager, injectFullscreenStyles } from './fullscreen.js';

        // Student-specific state
        let currentStudent = null;
        let currentRoom = null;
        let studentRole = null;
        let roomSyncInterval = null;
        let lastSyncTimestamp = 0;

        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const roomNumber = urlParams.get('room');
        const role = urlParams.get('role');
        const isPreview = urlParams.get('preview') === 'true';

        if (!roomNumber || !role) {
            alert('Invalid room parameters. Redirecting to student portal.');
            window.location.href = './index-student.php';
        }

        // Initialize student session
        document.addEventListener('DOMContentLoaded', async function() {
            injectFullscreenStyles();
            await initializeStudentSession();
        });

        async function initializeStudentSession() {
            try {
                updateWaitingMessage('Connecting to room...');
                
                // Load room state
                await loadRoomState();
                
                if (!isPreview) {
                    // Get the student ID from the room participants (they should already be joined)
                    updateWaitingMessage('Identifying student...');
                    
                    // Try to find current student in room participants
                    const roomData = await loadRoomState();
                    const participants = roomData.participants || [];
                    
                    // For testing, we'll try to identify by the bypass login method
                    // In a real implementation, this would use proper session management
                    let studentInfo = null;
                    
                    // Check if we can get student info from session storage or URL params
                    const savedStudent = sessionStorage.getItem('currentStudent');
                    if (savedStudent) {
                        try {
                            studentInfo = JSON.parse(savedStudent);
                            console.log('Found saved student info:', studentInfo);
                        } catch (e) {
                            console.error('Failed to parse saved student info');
                        }
                    }
                    
                    // If no saved info, create guest login but try to match with participants
                    if (!studentInfo) {
                        const username = `Student_${roomNumber}_${role}`;
                        studentInfo = await loginPlayer(username);
                        console.log('Created guest student:', studentInfo);
                    }
                    
                    currentStudent = studentInfo;
                }
                
                // Update UI
                studentRole = role;
                updateStudentUI();
                
                if (studentRole === 'spectator') {
                    showSpectatorMode();
                } else {
                    hideSpectatorMode();
                }
                
                // Start sync loop
                console.log('About to start room sync...');
                startRoomSync();
                
                // Check if game is ready
                console.log('About to check game status...');
                await checkGameStatus();
                
                console.log(`Student session initialized - Room: ${roomNumber}, Role: ${studentRole}`);
                
            } catch (error) {
                console.error('Failed to initialize student session:', error);
                updateWaitingMessage('Connection failed: ' + error.message);
                setTimeout(() => {
                    window.location.href = './index-student.php';
                }, 3000);
            }
        }

        async function loadRoomState() {
            try {
                // Include player_id for activity tracking
                const playerIdParam = currentStudent ? `&player_id=${currentStudent.id}` : '';
                const response = await fetch(`./api/room_handler.php?action=get_room_state&room_number=${roomNumber}${playerIdParam}`);
                const result = await response.json();

                if (result.success) {
                    currentRoom = result.data.room;
                    updateSyncStatus(true);
                    return result.data;
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                updateSyncStatus(false);
                throw error;
            }
        }

        function updateStudentUI() {
            document.getElementById('currentRoom').textContent = roomNumber;
            
            const roleElement = document.getElementById('studentRole');
            if (studentRole === 'player') {
                roleElement.innerHTML = '🎮 Player';
                roleElement.className = 'student-role role-player';
            } else {
                roleElement.innerHTML = '👁️ Spectator';
                roleElement.className = 'student-role role-spectator';
            }
        }

        function updateWaitingMessage(message) {
            document.getElementById('waitingMessage').textContent = message;
        }

        function showSpectatorMode() {
            document.getElementById('spectatorMode').style.display = 'block';
            
            // Hide card interaction elements for spectators
            const cardActions = document.getElementById('cardZoomActions');
            if (cardActions) cardActions.style.display = 'none';
            
            const battlePanel = document.getElementById('battleActionPanel');
            if (battlePanel) battlePanel.style.display = 'none';
        }

        function hideSpectatorMode() {
            document.getElementById('spectatorMode').style.display = 'none';
            
            // Restore card interaction elements for players
            const cardActions = document.getElementById('cardZoomActions');
            if (cardActions) cardActions.style.display = 'flex';
            
            // Don't automatically show battle panel - it should only show when cards are in battlefield
            // The battlePanel visibility is controlled by the game logic, not the spectator mode
        }

        async function checkGameStatus() {
            try {
                const roomData = await loadRoomState();
                const gameStateData = roomData.game_state;
                
                console.log('Room data received:', roomData);
                console.log('Game state data:', gameStateData);
                
                if (gameStateData && gameStateData.gameState) {
                    console.log('Inner game state:', gameStateData.gameState);
                    console.log('Game active?', gameStateData.gameState.gameActive);
                    
                    if (gameStateData.gameState.gameActive) {
                        // Game is active, start playing
                        console.log('Game is active! Starting...');
                        await startGame();
                        return;
                    }
                }
                
                // Still waiting
                updateWaitingMessage('Waiting for teacher to start the game...');
                console.log('Still waiting for game to start...');
            } catch (error) {
                console.error('Error checking game status:', error);
            }
        }

        async function startGame() {
            try {
                updateWaitingMessage('Starting game...');
                
                // Hide waiting screen
                document.getElementById('waitingScreen').style.display = 'none';
                
                // Show game
                document.getElementById('gameCanvas').style.display = 'block';
                document.getElementById('gameUI').style.display = 'block';
                document.getElementById('studentInfo').style.display = 'block';
                document.getElementById('gameControls').style.display = 'block';
                
                // Initialize game
                const username = currentStudent ? currentStudent.username : `Student_${studentRole}`;
                const gameMode = studentRole === 'player' ? 'multiplayer' : 'spectator';
                
                console.log('Initializing game with student:', currentStudent);
                console.log('Game mode:', gameMode, 'Username:', username);
                
                await initializeGame(username, gameMode);
                
                // Ensure the game state has the correct player ID
                if (window.gameState && currentStudent) {
                    window.gameState.player1.id = currentStudent.id;
                    window.gameState.player1.username = currentStudent.username;
                    console.log('Set game player ID to:', currentStudent.id);
                }
                
                // Enter fullscreen for players
                if (studentRole === 'player') {
                    try {
                        await fullscreenManager.enterFullscreen();
                    } catch (error) {
                        console.log('Could not enter fullscreen:', error);
                    }
                }
                
                console.log('Game started for student');
                
            } catch (error) {
                console.error('Failed to start game:', error);
                updateWaitingMessage('Failed to start game: ' + error.message);
            }
        }

        function startRoomSync() {
            console.log('Starting room sync loop...');
            
            roomSyncInterval = setInterval(async () => {
                try {
                    console.log('Room sync tick - checking for updates...');
                    const roomData = await loadRoomState();
                    
                    // Always sync the multiplayer game state if game is active
                    if (typeof syncMultiplayerGameState === 'function' && roomData) {
                        syncMultiplayerGameState(roomData);
                    }
                    
                    // Check for game state updates
                    const gameStateData = roomData.game_state;
                    console.log('Current game state:', gameStateData);
                    
                    if (gameStateData && gameStateData.lastUpdate > lastSyncTimestamp) {
                        console.log('New game state update detected!', gameStateData.lastUpdate, 'vs', lastSyncTimestamp);
                        lastSyncTimestamp = gameStateData.lastUpdate;
                        await handleGameStateUpdate(gameStateData.gameState);
                    } else {
                        console.log('No new updates. Last timestamp:', lastSyncTimestamp);
                    }
                    
                } catch (error) {
                    console.error('Room sync error:', error);
                }
            }, 1000); // Fast polling for real-time game updates
            
            console.log('Room sync interval started with ID:', roomSyncInterval);
        }

        async function handleGameStateUpdate(gameStateUpdate) {
            if (!gameStateUpdate) return;
            
            console.log('Handling game state update:', gameStateUpdate);
            
            // Handle different game state updates
            if (gameStateUpdate.gameActive && document.getElementById('waitingScreen').style.display !== 'none') {
                console.log('Game activated! Starting game...');
                await startGame();
            }
            
            if (gameStateUpdate.gameReset) {
                // Reset game
                console.log('Game reset by teacher');
                window.location.reload();
            }
            
            if (gameStateUpdate.gamePaused) {
                // Handle pause
                console.log('Game paused by teacher');
            }
            
            // Sync with multiplayer game state if game is active and functions are available
            if (typeof window.syncMultiplayerGameState === 'function' && currentRoom) {
                const roomData = {
                    room: currentRoom,
                    game_state: {
                        gameState: gameStateUpdate,
                        lastUpdate: Date.now()
                    }
                };
                window.syncMultiplayerGameState(roomData);
            }
        }

        function updateSyncStatus(isOnline) {
            const dot = document.getElementById('syncDot');
            dot.className = isOnline ? 'sync-dot' : 'sync-dot offline';
        }

        // Student control functions
        window.toggleFullscreen = async function() {
            try {
                if (fullscreenManager.isFullscreen) {
                    await fullscreenManager.exitFullscreen();
                    document.getElementById('fullscreenBtn').textContent = '📱 Fullscreen';
                } else {
                    await fullscreenManager.enterFullscreen();
                    document.getElementById('fullscreenBtn').textContent = '📱 Exit Fullscreen';
                }
            } catch (error) {
                console.log('Fullscreen toggle failed:', error);
            }
        };

        window.toggleMute = function() {
            const audio = document.getElementById('bg-audio');
            audio.muted = !audio.muted;
            document.querySelector('.control-btn').textContent = audio.muted ? '🔇 Mute' : '🔊 Unmute';
        };

        window.leaveRoom = async function() {
            if (!confirm('Are you sure you want to leave this room?')) {
                return;
            }

            try {
                if (roomSyncInterval) {
                    clearInterval(roomSyncInterval);
                }

                if (currentStudent && currentRoom) {
                    await fetch('./api/room_handler.php?action=leave_room', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            room_id: currentRoom.id,
                            player_id: currentStudent.id
                        })
                    });
                }

                window.location.href = './index-student.php';
                
            } catch (error) {
                console.error('Error leaving room:', error);
                window.location.href = './index-student.php';
            }
        };

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (roomSyncInterval) {
                clearInterval(roomSyncInterval);
            }
        });

        // Audio control
        const audio = document.getElementById('bg-audio');
        audio.muted = true;
        
        // Try to play audio
        audio.play().catch(err => {
            console.log("Audio autoplay blocked:", err);
        });
    </script>
</body>
</html>