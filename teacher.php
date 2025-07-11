<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
    <title>Fluency Card Game - Teacher Game Control</title>
    <meta name="description" content="Teacher interface for managing card game sessions" />
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
        .teacher-controls {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem;
            z-index: 1000;
            min-width: 250px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .teacher-title {
            color: #fff;
            font-weight: bold;
            margin-bottom: 1rem;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 0.5rem;
        }
        
        .room-info {
            color: #aaa;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .participants-list {
            margin-bottom: 1rem;
        }
        
        .participant {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            color: #fff;
            font-size: 0.9rem;
        }
        
        .participant.player {
            border-left: 3px solid #4CAF50;
        }
        
        .participant.spectator {
            border-left: 3px solid #2196F3;
        }
        
        .teacher-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .teacher-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }
        
        .teacher-btn.primary {
            background: #4CAF50;
            color: white;
        }
        
        .teacher-btn.secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
        }
        
        .teacher-btn.danger {
            background: #f44336;
            color: white;
        }
        
        .teacher-btn:hover {
            transform: translateY(-1px);
            opacity: 0.9;
        }
        
        .game-status {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 0.5rem;
            margin-bottom: 1rem;
            color: #fff;
            text-align: center;
            font-size: 0.9rem;
        }
        
        .status-waiting {
            border-left: 3px solid #FF9800;
        }
        
        .status-active {
            border-left: 3px solid #4CAF50;
        }
        
        .status-finished {
            border-left: 3px solid #9E9E9E;
        }
        
        .sync-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .sync-dot {
            width: 12px;
            height: 12px;
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
        
        /* Hide default game UI elements that teacher doesn't need */
        .control-buttons {
            display: none;
        }
        
        .homepage {
            display: none;
        }
    </style>
</head>
<body>
    <!-- Teacher Control Panel -->
    <div class="teacher-controls" id="teacherControls">
        <div class="teacher-title">🎓 Teacher Control</div>
        
        <div class="room-info" id="roomInfo">
            <div>Room: <span id="currentRoom">--</span></div>
            <div>Arena: <span id="arenaName">Loading...</span></div>
        </div>
        
        <div class="game-status status-waiting" id="gameStatus">
            Waiting for players...
        </div>
        
        <div class="participants-list" id="participantsList">
            <div style="color: #fff; font-weight: bold; margin-bottom: 0.5rem;">Participants:</div>
            <div id="participantsContent">Loading...</div>
        </div>
        
        <div class="teacher-buttons">
            <button class="teacher-btn primary" id="startGameBtn" onclick="startGameSession()" disabled>
                🎮 Start Game
            </button>
            <button class="teacher-btn secondary" onclick="pauseGame()">
                ⏸️ Pause Game
            </button>
            <button class="teacher-btn secondary" onclick="resetGame()">
                🔄 Reset Game
            </button>
            <button class="teacher-btn secondary" onclick="openStudentView()">
                👁️ Student View
            </button>
            <button class="teacher-btn danger" onclick="endSession()">
                🔚 End Session
            </button>
        </div>
    </div>
    
    <!-- Sync Status Indicator -->
    <div class="sync-indicator">
        <div class="sync-dot" id="syncDot"></div>
    </div>

    <!-- Game Canvas (same as regular game) -->
    <canvas id="gameCanvas" style="display: none;"></canvas>

    <!-- Game UI Overlay (simplified for teacher) -->
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
        <div class="turn-indicator" id="currentTurn">Game Starting...</div>

        <!-- Game Log -->
        <div class="game-log" id="gameLog">
            <div class="log-header">Battle Log</div>
        </div>
    </div>

    <!-- Three.js for 3D graphics - must load before modules -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>

    <script type="module">
        import { initializeGame, gameState } from './game.js';
        import { fullscreenManager, injectFullscreenStyles } from './fullscreen.js';

        // Teacher-specific state
        let currentRoom = null;
        let teacherSyncInterval = null;
        let roomParticipants = [];
        let isGameActive = false;

        // Get room from URL
        const urlParams = new URLSearchParams(window.location.search);
        const roomNumber = urlParams.get('room');

        if (!roomNumber) {
            alert('No room specified. Redirecting to teacher portal.');
            window.location.href = './index-teacher.php';
        }

        // Initialize teacher interface
        document.addEventListener('DOMContentLoaded', async function() {
            injectFullscreenStyles();
            await initializeTeacherSession();
            startSyncLoop();
        });

        async function initializeTeacherSession() {
            try {
                // Load room state
                await loadRoomState();
                
                // Update UI
                document.getElementById('currentRoom').textContent = roomNumber;
                
                // Show game canvas but keep it in teacher mode
                document.getElementById('gameCanvas').style.display = 'block';
                document.getElementById('gameUI').style.display = 'block';
                
                // Initialize game in observer mode
                await initializeGame('Teacher', 'observer');
                
                console.log('Teacher session initialized for room', roomNumber);
                
            } catch (error) {
                console.error('Failed to initialize teacher session:', error);
                alert('Failed to initialize teacher session: ' + error.message);
            }
        }

        async function loadRoomState() {
            try {
                const response = await fetch(`./api/room_handler.php?action=get_room_state&room_number=${roomNumber}`);
                const result = await response.json();

                if (result.success) {
                    currentRoom = result.data.room;
                    roomParticipants = result.data.participants;
                    
                    updateRoomUI();
                    updateSyncStatus(true);
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                updateSyncStatus(false);
                throw error;
            }
        }

        function updateRoomUI() {
            // Update arena name
            const arenaName = currentRoom.room_name || `Room ${currentRoom.room_number}`;
            document.getElementById('arenaName').textContent = arenaName;
            
            // Update game status
            const statusElement = document.getElementById('gameStatus');
            const status = isGameActive ? 'active' : currentRoom.status;
            
            statusElement.className = `game-status status-${status}`;
            statusElement.textContent = getStatusText(status);
            
            // Update participants
            updateParticipantsList();
            
            // Update start game button
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

        function updateParticipantsList() {
            const content = document.getElementById('participantsContent');
            
            if (roomParticipants.length === 0) {
                content.innerHTML = '<div style="color: #aaa; font-style: italic;">No participants yet</div>';
                return;
            }

            const players = roomParticipants.filter(p => p.role === 'player');
            const spectators = roomParticipants.filter(p => p.role === 'spectator');

            let html = '';
            
            players.forEach(participant => {
                html += `<div class="participant player">🎮 ${participant.username}</div>`;
            });
            
            spectators.forEach(participant => {
                html += `<div class="participant spectator">👁️ ${participant.username}</div>`;
            });

            content.innerHTML = html;
        }

        function getStatusText(status) {
            switch (status) {
                case 'waiting': return 'Waiting for players...';
                case 'active': return 'Game in progress';
                case 'finished': return 'Game finished';
                default: return 'Unknown status';
            }
        }

        function updateSyncStatus(isOnline) {
            const dot = document.getElementById('syncDot');
            dot.className = isOnline ? 'sync-dot' : 'sync-dot offline';
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
                const gameState = {
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

                console.log('Sending game state:', gameState);
                await updateRoomGameState(gameState);
                
                isGameActive = true;
                updateRoomUI();
                
                // Notify students to start
                console.log('Game session started for room', roomNumber);
                
            } catch (error) {
                console.error('Failed to start game:', error);
                alert('Failed to start game: ' + error.message);
            }
        };

        window.pauseGame = async function() {
            try {
                const gameState = {
                    gamePaused: true,
                    pauseTime: Date.now()
                };

                await updateRoomGameState(gameState);
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
                const gameState = {
                    gameActive: false,
                    gameReset: true,
                    resetTime: Date.now()
                };

                await updateRoomGameState(gameState);
                
                isGameActive = false;
                updateRoomUI();
                
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

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (teacherSyncInterval) {
                clearInterval(teacherSyncInterval);
            }
        });
    </script>
</body>
</html>