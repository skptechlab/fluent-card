<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
    <title>Fluency Card Game - Teacher Portal</title>
    <meta name="description" content="Teacher portal for managing card game arenas and student sessions" />
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
        .teacher-portal {
            min-height: 100vh;
            background: linear-gradient(135deg, #0B0B0B 0%, #1a1a2e 50%, #16213e 100%);
            padding: 2rem;
            font-family: 'Roboto', sans-serif;
        }
        
        .teacher-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .teacher-title {
            font-family: 'Orbitron', monospace;
            font-size: 2.5rem;
            color: #fff;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
            margin-bottom: 0.5rem;
        }
        
        .teacher-subtitle {
            color: #aaa;
            font-size: 1.1rem;
        }
        
        .auth-section {
            max-width: 400px;
            margin: 0 auto 3rem;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .rooms-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .room-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 1.5rem;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .room-card:hover {
            border-color: #4CAF50;
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3);
        }
        
        .room-card.available {
            border-color: rgba(76, 175, 80, 0.5);
        }
        
        .room-card.occupied {
            border-color: rgba(255, 152, 0, 0.5);
            background: rgba(255, 152, 0, 0.1);
        }
        
        .room-number {
            font-size: 2rem;
            font-weight: bold;
            color: #fff;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .room-status {
            text-align: center;
            color: #aaa;
            margin-bottom: 1rem;
        }
        
        .room-info {
            font-size: 0.9rem;
            color: #ccc;
        }
        
        .create-room-form {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            padding: 2rem;
            box-sizing: border-box;
        }
        
        .form-modal {
            max-width: 500px;
            margin: 5% auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 2rem;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            color: #fff;
            margin-bottom: 0.5rem;
            font-weight: bold;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 1rem;
        }
        
        .form-group input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .btn-danger {
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white;
        }
        
        .current-room {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: none;
        }
        
        .room-participants {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .participants-section h4 {
            color: #fff;
            margin-bottom: 1rem;
        }
        
        .participant {
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            margin-bottom: 0.5rem;
            color: #fff;
        }
        
        .loading {
            text-align: center;
            color: #fff;
            padding: 2rem;
        }
        
        .error {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid #f44336;
            color: #fff;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        
        .success {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
            color: #fff;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="teacher-portal">
        <!-- Header -->
        <div class="teacher-header">
            <img src="./assets/logo.gif" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 1rem;">
            <h1 class="teacher-title">Teacher Portal</h1>
            <p class="teacher-subtitle">Manage Card Game Arenas & Student Sessions</p>
        </div>

        <!-- Authentication Section (Hidden for Testing) -->
        <div class="auth-section" id="authSection" style="display: none;">
            <h3 style="color: #fff; text-align: center; margin-bottom: 1.5rem;">Teacher Login</h3>
            <div class="form-group">
                <label for="teacherName">Your Name:</label>
                <input type="text" id="teacherName" placeholder="Enter your name" maxlength="50" />
            </div>
            <div class="form-group">
                <label for="teacherEmail">Email (optional):</label>
                <input type="email" id="teacherEmail" placeholder="your.email@school.edu" />
            </div>
            <div style="text-align: center;">
                <button class="btn btn-primary" onclick="teacherLogin()">Start Teaching Session</button>
            </div>
        </div>
        
        <!-- Testing Info -->
        <div id="testingInfo" style="text-align: center; margin-bottom: 2rem; padding: 1rem; background: rgba(76, 175, 80, 0.1); border-radius: 10px; border: 1px solid rgba(76, 175, 80, 0.3);">
            <p style="color: #4CAF50; margin: 0; font-weight: bold;">🧪 Testing Mode Active</p>
            <p id="teacherInfo" style="color: #aaa; margin: 0.5rem 0 1rem 0; font-size: 0.9rem;">Auto-logging in...</p>
            <div style="margin: 1rem 0;">
                <label style="color: #fff; font-size: 0.8rem;">Use Existing Player ID (optional):</label><br>
                <input type="number" id="existingPlayerId" placeholder="Enter player ID" style="padding: 0.3rem; margin: 0.5rem; width: 120px; border-radius: 4px; border: 1px solid #ccc;">
                <button class="btn btn-primary" onclick="useExistingPlayer()" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;">Use This ID</button>
            </div>
            <button class="btn btn-secondary" onclick="toggleTestingMode()" style="font-size: 0.8rem; padding: 0.4rem 1rem;">Switch to Login Mode</button>
        </div>

        <!-- Room Management Section -->
        <div id="roomManagement">
            <div style="text-align: center; margin-bottom: 2rem;">
                <button class="btn btn-primary" onclick="refreshRooms()">🔄 Refresh Rooms</button>
                <button class="btn btn-secondary" onclick="showCreateRoomForm()">➕ Create New Arena</button>
                <button class="btn btn-danger" onclick="teacherLogout()">🚪 Logout</button>
            </div>

            <!-- Rooms Grid -->
            <div class="rooms-grid" id="roomsGrid">
                <div class="loading">Loading available rooms...</div>
            </div>

            <!-- Current Room Management -->
            <div class="current-room" id="currentRoom" style="display: none;">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <button class="btn btn-secondary" onclick="backToRoomSelection()">← Back to Room Selection</button>
                </div>
                
                <h3 style="color: #fff; text-align: center;">Arena Management</h3>
                <div id="roomDetails"></div>
                <div class="room-participants" id="roomParticipants"></div>
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="btn btn-primary" onclick="startGame()">🎮 Start Game</button>
                    <button class="btn btn-secondary" onclick="openGameView()">👁️ View Game</button>
                    <button class="btn btn-danger" onclick="closeRoom()">🔒 Close Arena</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Create Room Modal -->
    <div class="create-room-form" id="createRoomModal">
        <div class="form-modal">
            <h3 style="color: #fff; text-align: center; margin-bottom: 2rem;">Create New Arena</h3>
            
            <div class="form-group">
                <label for="roomNumber">Room Number:</label>
                <select id="roomNumber">
                    <option value="">Select available room...</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="roomName">Arena Name (optional):</label>
                <input type="text" id="roomName" placeholder="e.g. Advanced Battle Arena" maxlength="100" />
            </div>
            
            <div class="form-group">
                <label for="roomVisibility">Visibility:</label>
                <select id="roomVisibility">
                    <option value="public">Public (visible to all students)</option>
                    <option value="private">Private (invite only)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="maxPlayers">Max Players:</label>
                <select id="maxPlayers">
                    <option value="2">2 Players</option>
                    <option value="1">1 Player (vs AI)</option>
                </select>
            </div>
            
            <div style="text-align: center;">
                <button class="btn btn-primary" onclick="createRoom()">Create Arena</button>
                <button class="btn btn-secondary" onclick="hideCreateRoomForm()">Cancel</button>
            </div>
        </div>
    </div>

    <script type="module">
        let currentTeacher = null;
        let currentRoomData = null;
        let pollInterval = null;

        // Testing: Auto-login with default teacher ID
        const DEFAULT_TEACHER = {
            id: 49550370003760,
            username: 'Test Teacher',
            email: 'teacher@test.edu'
        };

        // Teacher authentication (modified for testing)
        window.teacherLogin = async function() {
            const name = document.getElementById('teacherName').value.trim();
            const email = document.getElementById('teacherEmail').value.trim() || null;

            if (!name) {
                alert('Please enter your name');
                return;
            }

            try {
                // Login/register teacher
                const response = await fetch('./api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: name, email })
                });

                const result = await response.json();
                
                if (result.success) {
                    currentTeacher = result.data.player;
                    document.getElementById('authSection').style.display = 'none';
                    document.getElementById('roomManagement').style.display = 'block';
                    loadAvailableRooms();
                } else {
                    alert('Login failed: ' + result.error);
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        };

        // Auto-login function for testing
        async function autoLoginForTesting() {
            try {
                console.log('Auto-logging in for testing...');
                
                // Option 1: Try to find existing teacher, or create one with predictable username
                const teacherUsername = 'TestTeacher'; // Simple, predictable username
                
                const response = await fetch('./api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: teacherUsername, 
                        email: 'teacher@test.edu' 
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    // Use the actual player data from the database
                    currentTeacher = result.data.player;
                    console.log('Teacher record created/found:', currentTeacher);
                    
                    // Update the testing info display
                    document.getElementById('teacherInfo').textContent = 
                        `Auto-logged in as ${currentTeacher.username} (ID: ${currentTeacher.id})`;
                } else {
                    throw new Error('Failed to create/find teacher: ' + result.error);
                }
                
                // Load rooms immediately
                loadAvailableRooms();
                
                console.log('Auto-login successful with teacher ID:', currentTeacher.id);
            } catch (error) {
                console.error('Auto-login failed:', error);
                
                // Show error and prompt for manual login
                document.getElementById('teacherInfo').innerHTML = 
                    `<span style="color: #f44336;">Auto-login failed: ${error.message}</span><br>
                    <button class="btn btn-primary" onclick="toggleTestingMode()" style="font-size: 0.8rem; padding: 0.4rem 1rem; margin-top: 0.5rem;">Switch to Manual Login</button>`;
                
                console.log('Please use manual login');
            }
        }

        // Use existing player ID for testing
        window.useExistingPlayer = function() {
            const playerId = document.getElementById('existingPlayerId').value.trim();
            
            if (!playerId || isNaN(playerId)) {
                alert('Please enter a valid player ID number');
                return;
            }
            
            // Set the teacher with the specified ID
            currentTeacher = {
                id: parseInt(playerId),
                username: `Teacher_${playerId}`,
                email: 'teacher@test.edu'
            };
            
            // Update display
            document.getElementById('teacherInfo').textContent = 
                `Using existing player ID: ${currentTeacher.id}`;
            
            // Load rooms
            loadAvailableRooms();
            
            console.log('Using existing teacher ID:', currentTeacher.id);
        };

        window.teacherLogout = function() {
            if (currentRoomData) {
                closeRoom();
            }
            
            currentTeacher = null;
            currentRoomData = null;
            
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('roomManagement').style.display = 'none';
            document.getElementById('currentRoom').style.display = 'none';
            
            // Clear form
            document.getElementById('teacherName').value = '';
            document.getElementById('teacherEmail').value = '';
        };

        // Toggle between testing mode and login mode
        window.toggleTestingMode = function() {
            const authSection = document.getElementById('authSection');
            const roomManagement = document.getElementById('roomManagement');
            const testingInfo = document.getElementById('testingInfo');
            
            if (authSection.style.display === 'none') {
                // Switch to login mode
                authSection.style.display = 'block';
                roomManagement.style.display = 'none';
                testingInfo.style.display = 'none';
                currentTeacher = null;
                currentRoomData = null;
                
                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }
            } else {
                // Switch back to testing mode
                authSection.style.display = 'none';
                roomManagement.style.display = 'block';
                testingInfo.style.display = 'block';
                autoLoginForTesting();
            }
        };

        // Room management
        window.refreshRooms = function() {
            loadAvailableRooms();
        };

        async function loadAvailableRooms() {
            try {
                const response = await fetch('./api/room_handler.php?action=get_room_numbers');
                const result = await response.json();

                if (result.success) {
                    displayRoomsGrid(result.data.available_numbers, result.data.occupied_numbers);
                    updateRoomNumberOptions(result.data.available_numbers);
                } else {
                    document.getElementById('roomsGrid').innerHTML = 
                        `<div class="error">Failed to load rooms: ${result.error}</div>`;
                }
            } catch (error) {
                document.getElementById('roomsGrid').innerHTML = 
                    `<div class="error">Error loading rooms: ${error.message}</div>`;
            }
        }

        function displayRoomsGrid(available, occupied) {
            const grid = document.getElementById('roomsGrid');
            grid.innerHTML = '';

            // Show all 20 rooms
            for (let i = 1; i <= 20; i++) {
                const roomNumber = String(i).padStart(2, '0');
                const isAvailable = available.includes(roomNumber);
                const isOccupied = occupied.includes(roomNumber);

                const roomCard = document.createElement('div');
                roomCard.className = `room-card ${isAvailable ? 'available' : 'occupied'}`;
                roomCard.onclick = () => {
                    if (isAvailable) {
                        selectRoomNumber(roomNumber);
                        showCreateRoomForm();
                    }
                };

                roomCard.innerHTML = `
                    <div class="room-number">Room ${roomNumber}</div>
                    <div class="room-status">
                        ${isAvailable ? '✅ Available' : '🔒 Occupied'}
                    </div>
                    <div class="room-info">
                        ${isAvailable ? 'Click to create arena' : 'Currently in use'}
                    </div>
                `;

                grid.appendChild(roomCard);
            }
        }

        function updateRoomNumberOptions(available) {
            const select = document.getElementById('roomNumber');
            select.innerHTML = '<option value="">Select available room...</option>';

            available.forEach(roomNumber => {
                const option = document.createElement('option');
                option.value = roomNumber;
                option.textContent = `Room ${roomNumber}`;
                select.appendChild(option);
            });
        }

        function selectRoomNumber(roomNumber) {
            document.getElementById('roomNumber').value = roomNumber;
        }

        // Room creation
        window.showCreateRoomForm = function() {
            document.getElementById('createRoomModal').style.display = 'block';
        };

        window.hideCreateRoomForm = function() {
            document.getElementById('createRoomModal').style.display = 'none';
        };

        window.createRoom = async function() {
            const roomNumber = document.getElementById('roomNumber').value;
            const roomName = document.getElementById('roomName').value.trim() || null;
            const visibility = document.getElementById('roomVisibility').value;
            const maxPlayers = parseInt(document.getElementById('maxPlayers').value);

            if (!roomNumber) {
                alert('Please select a room number');
                return;
            }

            try {
                const response = await fetch('./api/room_handler.php?action=create_room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacher_id: currentTeacher.id,
                        room_number: roomNumber,
                        room_name: roomName,
                        visibility,
                        max_players: maxPlayers
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log('Room created successfully:', result.data);
                    hideCreateRoomForm();
                    currentRoomData = result.data;
                    
                    // Clear the form
                    document.getElementById('roomNumber').value = '';
                    document.getElementById('roomName').value = '';
                    document.getElementById('roomVisibility').value = 'public';
                    document.getElementById('maxPlayers').value = '2';
                    
                    // Show the room management view
                    showCurrentRoom(roomNumber);
                    startRoomPolling(roomNumber);
                    
                    console.log('Switched to room management view');
                } else {
                    console.error('Room creation failed:', result.error);
                    alert('Failed to create room: ' + result.error);
                }
            } catch (error) {
                alert('Error creating room: ' + error.message);
            }
        };

        // Room management
        function showCurrentRoom(roomNumber) {
            console.log('Showing current room:', roomNumber);
            
            // Hide the rooms grid and show the current room management
            document.getElementById('roomsGrid').style.display = 'none';
            document.getElementById('currentRoom').style.display = 'block';
            
            // Load room state
            loadRoomState(roomNumber);
            
            console.log('Current room panel should now be visible');
        }

        async function loadRoomState(roomNumber) {
            try {
                const response = await fetch(`./api/room_handler.php?action=get_room_state&room_number=${roomNumber}`);
                const result = await response.json();

                if (result.success) {
                    displayRoomDetails(result.data);
                }
            } catch (error) {
                console.error('Error loading room state:', error);
            }
        }

        function displayRoomDetails(data) {
            const room = data.room;
            const participants = data.participants;

            document.getElementById('roomDetails').innerHTML = `
                <div style="text-align: center; color: #fff;">
                    <h4>Room ${room.room_number} ${room.room_name ? '- ' + room.room_name : ''}</h4>
                    <p>Status: ${room.status} | Visibility: ${room.visibility} | Max Players: ${room.max_players}</p>
                </div>
            `;

            const players = participants.filter(p => p.role === 'player');
            const spectators = participants.filter(p => p.role === 'spectator');

            document.getElementById('roomParticipants').innerHTML = `
                <div class="participants-section">
                    <h4>Players (${players.length}/${room.max_players})</h4>
                    ${players.map(p => `<div class="participant">🎮 ${p.username}</div>`).join('') || '<div style="color: #aaa;">No players yet</div>'}
                </div>
                <div class="participants-section">
                    <h4>Spectators (${spectators.length})</h4>
                    ${spectators.map(p => `<div class="participant">👁️ ${p.username}</div>`).join('') || '<div style="color: #aaa;">No spectators</div>'}
                </div>
            `;
        }

        function startRoomPolling(roomNumber) {
            if (pollInterval) clearInterval(pollInterval);
            
            pollInterval = setInterval(() => {
                loadRoomState(roomNumber);
            }, 2000);
        }

        window.startGame = function() {
            if (currentRoomData) {
                const url = `./teacher-game.php?room=${currentRoomData.room_number}`;
                window.open(url, '_blank');
            }
        };

        window.openGameView = function() {
            if (currentRoomData) {
                const url = `./index.html?room=${currentRoomData.room_number}&mode=teacher`;
                window.open(url, '_blank');
            }
        };

        // Back to room selection
        window.backToRoomSelection = function() {
            // Show rooms grid and hide current room
            document.getElementById('roomsGrid').style.display = 'grid';
            document.getElementById('currentRoom').style.display = 'none';
            
            // Stop polling if active
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
            
            // Refresh the rooms list
            loadAvailableRooms();
            
            console.log('Returned to room selection');
        };

        window.closeRoom = async function() {
            if (!currentRoomData) return;

            if (!confirm('Are you sure you want to close this arena? All students will be disconnected.')) {
                return;
            }

            try {
                const response = await fetch('./api/room_handler.php?action=leave_room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_id: currentRoomData.room_id,
                        player_id: currentTeacher.id
                    })
                });

                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }

                currentRoomData = null;
                backToRoomSelection();
            } catch (error) {
                alert('Error closing room: ' + error.message);
            }
        };

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Teacher Portal loaded');
            
            // Auto-login for testing
            autoLoginForTesting();
        });
    </script>
</body>
</html>