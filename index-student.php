<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
    <title>Fluency Card Game - Student Portal</title>
    <meta name="description" content="Join card game arenas as player or spectator" />
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
        .student-portal {
            min-height: 100vh;
            background: linear-gradient(135deg, #0B0B0B 0%, #1a1a2e 50%, #16213e 100%);
            padding: 2rem;
            font-family: 'Roboto', sans-serif;
        }
        
        .student-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .student-title {
            font-family: 'Orbitron', monospace;
            font-size: 2.5rem;
            color: #fff;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
            margin-bottom: 0.5rem;
        }
        
        .student-subtitle {
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
        
        .join-options {
            max-width: 600px;
            margin: 0 auto 3rem;
            display: none;
        }
        
        .join-method {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .method-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            backdrop-filter: blur(10px);
        }
        
        .method-card:hover {
            border-color: #4CAF50;
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(76, 175, 80, 0.3);
        }
        
        .method-card.selected {
            border-color: #4CAF50;
            background: rgba(76, 175, 80, 0.1);
        }
        
        .method-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .method-title {
            color: #fff;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .method-description {
            color: #aaa;
            font-size: 0.9rem;
        }
        
        .room-input-section {
            text-align: center;
            margin-top: 2rem;
        }
        
        .room-number-input {
            width: 100px;
            padding: 1rem;
            font-size: 1.5rem;
            text-align: center;
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            margin: 0 1rem;
        }
        
        .available-rooms {
            max-width: 1000px;
            margin: 0 auto;
            display: none;
        }
        
        .rooms-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
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
        
        .room-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .room-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #fff;
        }
        
        .room-status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .status-active {
            background: rgba(76, 175, 80, 0.3);
            color: #4CAF50;
        }
        
        .status-waiting {
            background: rgba(255, 152, 0, 0.3);
            color: #FF9800;
        }
        
        .room-info {
            color: #ccc;
            margin-bottom: 1rem;
        }
        
        .room-participants {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: #aaa;
        }
        
        .role-selection {
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
        
        .role-modal {
            max-width: 500px;
            margin: 10% auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 2rem;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .role-options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .role-option {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .role-option:hover {
            border-color: #4CAF50;
        }
        
        .role-option.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .role-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        .role-title {
            color: #fff;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .role-description {
            color: #aaa;
            font-size: 0.9rem;
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
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            color: #fff;
            margin-bottom: 0.5rem;
            font-weight: bold;
        }
        
        .form-group input {
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

        @media (max-width: 768px) {
            .join-method {
                grid-template-columns: 1fr;
            }
            
            .role-options {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="student-portal">
        <!-- Header -->
        <div class="student-header">
            <img src="./assets/logo.gif" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 1rem;">
            <h1 class="student-title">Student Portal</h1>
            <p class="student-subtitle">Join Card Game Arenas as Player or Spectator</p>
        </div>

        <!-- Authentication Section (Hidden for Testing) -->
        <div class="auth-section" id="authSection" style="display: none;">
            <h3 style="color: #fff; text-align: center; margin-bottom: 1.5rem;">Student Login</h3>
            <div class="form-group">
                <label for="studentName">Your Name:</label>
                <input type="text" id="studentName" placeholder="Enter your name" maxlength="50" />
            </div>
            <div class="form-group">
                <label for="studentEmail">Email (optional):</label>
                <input type="email" id="studentEmail" placeholder="your.email@school.edu" />
            </div>
            <div style="text-align: center;">
                <button class="btn btn-primary" onclick="studentLogin()">Join Session</button>
            </div>
        </div>
        
        <!-- Testing Mode - Quick Student Selection -->
        <div id="testingModeSection" style="text-align: center; margin-bottom: 2rem; padding: 1.5rem; background: rgba(33, 150, 243, 0.1); border-radius: 10px; border: 1px solid rgba(33, 150, 243, 0.3);">
            <p style="color: #2196F3; margin: 0 0 1rem 0; font-weight: bold;">🧪 Testing Mode - Quick Login</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 400px; margin: 0 auto 1rem;">
                <button class="btn btn-primary" onclick="quickLoginStudent1()" style="font-size: 0.9rem;">
                    🎮 Login as Student 1
                </button>
                <button class="btn btn-primary" onclick="quickLoginStudent2()" style="font-size: 0.9rem;">
                    🎮 Login as Student 2
                </button>
            </div>
            <button class="btn btn-secondary" onclick="toggleStudentTestingMode()" style="font-size: 0.8rem; padding: 0.4rem 1rem;">Switch to Manual Login</button>
        </div>

        <!-- Join Options -->
        <div class="join-options" id="joinOptions">
            <h3 style="color: #fff; text-align: center; margin-bottom: 2rem;">How would you like to join?</h3>
            
            <div class="join-method">
                <div class="method-card" onclick="selectMethod('direct')">
                    <div class="method-icon">🎯</div>
                    <div class="method-title">Direct Room Entry</div>
                    <div class="method-description">Enter a specific room number if you know it</div>
                </div>
                
                <div class="method-card" onclick="selectMethod('browse')">
                    <div class="method-icon">🔍</div>
                    <div class="method-title">Browse Available Rooms</div>
                    <div class="method-description">See all public rooms and choose one to join</div>
                </div>
            </div>
            
            <!-- Direct Room Entry -->
            <div class="room-input-section" id="directEntry" style="display: none;">
                <p style="color: #fff; margin-bottom: 1rem;">Enter the room number (01-20):</p>
                <input type="text" class="room-number-input" id="roomNumberInput" placeholder="01" maxlength="2" />
                <button class="btn btn-primary" onclick="joinDirectRoom()">Join Room</button>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn btn-secondary" onclick="refreshData()">🔄 Refresh</button>
                <button class="btn btn-secondary" onclick="studentLogout()">🚪 Logout</button>
            </div>
        </div>

        <!-- Available Rooms -->
        <div class="available-rooms" id="availableRooms">
            <h3 style="color: #fff; text-align: center; margin-bottom: 2rem;">Available Rooms</h3>
            <div class="rooms-list" id="roomsList">
                <div class="loading">Loading available rooms...</div>
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn btn-secondary" onclick="backToJoinOptions()">← Back to Options</button>
                <button class="btn btn-secondary" onclick="refreshRooms()">🔄 Refresh Rooms</button>
            </div>
        </div>
    </div>

    <!-- Role Selection Modal -->
    <div class="role-selection" id="roleModal">
        <div class="role-modal">
            <h3 style="color: #fff; text-align: center; margin-bottom: 1rem;">Choose Your Role</h3>
            <p style="color: #aaa; text-align: center; margin-bottom: 2rem;" id="roleModalDescription">
                Select how you want to participate in this arena.
            </p>
            
            <div class="role-options" id="roleOptions">
                <div class="role-option" onclick="selectRole('player')" id="playerOption">
                    <div class="role-icon">🎮</div>
                    <div class="role-title">Player</div>
                    <div class="role-description">Actively play the card game</div>
                </div>
                
                <div class="role-option" onclick="selectRole('spectator')" id="spectatorOption">
                    <div class="role-icon">👁️</div>
                    <div class="role-title">Spectator</div>
                    <div class="role-description">Watch the game in real-time</div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button class="btn btn-secondary" onclick="cancelRoleSelection()">Cancel</button>
            </div>
        </div>
    </div>

    <script type="module">
        let currentStudent = null;
        let selectedRoom = null;
        let pollInterval = null;

        // Student authentication
        window.studentLogin = async function() {
            const name = document.getElementById('studentName').value.trim();
            const email = document.getElementById('studentEmail').value.trim() || null;

            if (!name) {
                alert('Please enter your name');
                return;
            }

            try {
                // Login/register student
                const response = await fetch('./api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: name, email })
                });

                const result = await response.json();
                
                if (result.success) {
                    currentStudent = result.data.player;
                    document.getElementById('authSection').style.display = 'none';
                    document.getElementById('joinOptions').style.display = 'block';
                } else {
                    alert('Login failed: ' + result.error);
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        };

        // Quick login functions for testing
        window.quickLoginStudent1 = async function() {
            await quickLogin('Student1', 'student1@test.edu');
        };

        window.quickLoginStudent2 = async function() {
            await quickLogin('Student2', 'student2@test.edu');
        };

        async function quickLogin(username, email) {
            try {
                console.log('Quick login as:', username);
                
                const response = await fetch('./api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email })
                });

                const result = await response.json();
                
                if (result.success) {
                    currentStudent = result.data.player;
                    console.log('Quick login successful:', currentStudent);
                    
                    // Update the testing section to show current student
                    const testingSection = document.getElementById('testingModeSection');
                    testingSection.innerHTML = `
                        <p style="color: #4CAF50; margin: 0 0 1rem 0; font-weight: bold;">✅ Logged in as ${currentStudent.username} (ID: ${currentStudent.id})</p>
                        <button class="btn btn-secondary" onclick="studentLogout()" style="font-size: 0.8rem; padding: 0.4rem 1rem;">Logout & Switch Student</button>
                    `;
                    
                    // Join options should already be visible
                } else {
                    console.error('Quick login failed:', result.error);
                    alert('Quick login failed: ' + result.error);
                }
            } catch (error) {
                console.error('Quick login error:', error);
                alert('Quick login error: ' + error.message);
            }
        }

        // Toggle between testing mode and manual login
        window.toggleStudentTestingMode = function() {
            const authSection = document.getElementById('authSection');
            const testingSection = document.getElementById('testingModeSection');
            const joinOptions = document.getElementById('joinOptions');
            
            if (authSection.style.display === 'none') {
                // Switch to manual login mode
                authSection.style.display = 'block';
                testingSection.style.display = 'none';
                joinOptions.style.display = 'none';
                currentStudent = null;
            } else {
                // Switch back to testing mode
                authSection.style.display = 'none';
                testingSection.style.display = 'block';
                joinOptions.style.display = 'block';
                
                // Reset testing section
                testingSection.innerHTML = `
                    <p style="color: #2196F3; margin: 0 0 1rem 0; font-weight: bold;">🧪 Testing Mode - Quick Login</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 400px; margin: 0 auto 1rem;">
                        <button class="btn btn-primary" onclick="quickLoginStudent1()" style="font-size: 0.9rem;">
                            🎮 Login as Student 1
                        </button>
                        <button class="btn btn-primary" onclick="quickLoginStudent2()" style="font-size: 0.9rem;">
                            🎮 Login as Student 2
                        </button>
                    </div>
                    <button class="btn btn-secondary" onclick="toggleStudentTestingMode()" style="font-size: 0.8rem; padding: 0.4rem 1rem;">Switch to Manual Login</button>
                `;
            }
        };

        window.studentLogout = function() {
            currentStudent = null;
            selectedRoom = null;
            
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
            
            // Reset to testing mode
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('testingModeSection').style.display = 'block';
            document.getElementById('joinOptions').style.display = 'block';
            document.getElementById('availableRooms').style.display = 'none';
            
            // Reset testing section
            const testingSection = document.getElementById('testingModeSection');
            testingSection.innerHTML = `
                <p style="color: #2196F3; margin: 0 0 1rem 0; font-weight: bold;">🧪 Testing Mode - Quick Login</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 400px; margin: 0 auto 1rem;">
                    <button class="btn btn-primary" onclick="quickLoginStudent1()" style="font-size: 0.9rem;">
                        🎮 Login as Student 1
                    </button>
                    <button class="btn btn-primary" onclick="quickLoginStudent2()" style="font-size: 0.9rem;">
                        🎮 Login as Student 2
                    </button>
                </div>
                <button class="btn btn-secondary" onclick="toggleStudentTestingMode()" style="font-size: 0.8rem; padding: 0.4rem 1rem;">Switch to Manual Login</button>
            `;
            
            // Clear form
            document.getElementById('studentName').value = '';
            document.getElementById('studentEmail').value = '';
        };

        // Join method selection
        window.selectMethod = function(method) {
            // Remove previous selections
            document.querySelectorAll('.method-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Hide all method-specific sections
            document.getElementById('directEntry').style.display = 'none';
            document.getElementById('availableRooms').style.display = 'none';
            
            if (method === 'direct') {
                event.target.closest('.method-card').classList.add('selected');
                document.getElementById('directEntry').style.display = 'block';
            } else if (method === 'browse') {
                event.target.closest('.method-card').classList.add('selected');
                document.getElementById('joinOptions').style.display = 'none';
                document.getElementById('availableRooms').style.display = 'block';
                loadAvailableRooms();
            }
        };

        window.backToJoinOptions = function() {
            document.getElementById('availableRooms').style.display = 'none';
            document.getElementById('joinOptions').style.display = 'block';
        };

        // Direct room entry
        window.joinDirectRoom = function() {
            const roomNumber = document.getElementById('roomNumberInput').value.trim().padStart(2, '0');
            
            if (!roomNumber || !roomNumber.match(/^(0[1-9]|1[0-9]|20)$/)) {
                alert('Please enter a valid room number (01-20)');
                return;
            }
            
            checkRoomAndShowRoleModal(roomNumber);
        };

        // Available rooms
        window.refreshRooms = function() {
            loadAvailableRooms();
        };

        window.refreshData = function() {
            if (document.getElementById('availableRooms').style.display !== 'none') {
                loadAvailableRooms();
            }
        };

        async function loadAvailableRooms() {
            try {
                const response = await fetch('./api/room_handler.php?action=get_available_rooms');
                const result = await response.json();

                if (result.success) {
                    displayRoomsList(result.data.rooms);
                } else {
                    document.getElementById('roomsList').innerHTML = 
                        `<div class="error">Failed to load rooms: ${result.error}</div>`;
                }
            } catch (error) {
                document.getElementById('roomsList').innerHTML = 
                    `<div class="error">Error loading rooms: ${error.message}</div>`;
            }
        }

        function displayRoomsList(rooms) {
            const list = document.getElementById('roomsList');
            
            if (rooms.length === 0) {
                list.innerHTML = '<div style="text-align: center; color: #aaa; padding: 2rem;">No public rooms available. Ask your teacher to create one!</div>';
                return;
            }

            list.innerHTML = rooms.map(room => `
                <div class="room-card" onclick="selectRoom('${room.room_number}')">
                    <div class="room-header">
                        <div class="room-number">Room ${room.room_number}</div>
                        <div class="room-status status-${room.status}">${room.status.toUpperCase()}</div>
                    </div>
                    <div class="room-info">
                        <div><strong>Teacher:</strong> ${room.teacher_name}</div>
                        ${room.room_name ? `<div><strong>Name:</strong> ${room.room_name}</div>` : ''}
                        <div><strong>Max Players:</strong> ${room.max_players}</div>
                    </div>
                    <div class="room-participants">
                        <span>🎮 Players: ${room.active_players}/${room.max_players}</span>
                        <span>👁️ Spectators: ${room.spectators}</span>
                    </div>
                </div>
            `).join('');
        }

        window.selectRoom = function(roomNumber) {
            checkRoomAndShowRoleModal(roomNumber);
        };

        // Role selection
        async function checkRoomAndShowRoleModal(roomNumber) {
            try {
                console.log('Checking room:', roomNumber);
                
                const response = await fetch(`./api/room_handler.php?action=get_room_state&room_number=${roomNumber}`);
                const result = await response.json();

                console.log('Room check result:', result);

                if (result.success) {
                    selectedRoom = result.data.room;
                    const players = result.data.participants.filter(p => p.role === 'player');
                    const canBePlayer = players.length < selectedRoom.max_players;
                    
                    console.log('Selected room:', selectedRoom);
                    console.log('Players in room:', players.length, '/', selectedRoom.max_players);
                    console.log('Can be player:', canBePlayer);
                    
                    showRoleModal(canBePlayer);
                } else {
                    console.error('Room check failed:', result.error);
                    alert('Room not found or unavailable: ' + result.error);
                }
            } catch (error) {
                console.error('Error checking room:', error);
                alert('Error checking room: ' + error.message);
            }
        }

        function showRoleModal(canBePlayer) {
            const modal = document.getElementById('roleModal');
            const playerOption = document.getElementById('playerOption');
            const description = document.getElementById('roleModalDescription');
            
            description.textContent = `Room ${selectedRoom.room_number} ${selectedRoom.room_name ? '- ' + selectedRoom.room_name : ''}`;
            
            if (canBePlayer) {
                playerOption.classList.remove('disabled');
            } else {
                playerOption.classList.add('disabled');
                description.textContent += ' (Player slots full - spectator only)';
            }
            
            modal.style.display = 'block';
        }

        window.hideRoleModal = function() {
            document.getElementById('roleModal').style.display = 'none';
            // Don't reset selectedRoom here - let selectRole() handle it
        };

        window.cancelRoleSelection = function() {
            document.getElementById('roleModal').style.display = 'none';
            selectedRoom = null; // Reset when cancelled
            console.log('Role selection cancelled');
        };

        window.selectRole = async function(role) {
            if (!selectedRoom || !currentStudent) {
                console.error('Missing selectedRoom or currentStudent:', { selectedRoom, currentStudent });
                alert('Error: Room or student information missing. Please try again.');
                return;
            }
            
            const playerOption = document.getElementById('playerOption');
            if (role === 'player' && playerOption.classList.contains('disabled')) {
                alert('Player slots are full. You can only join as a spectator.');
                return;
            }

            try {
                console.log('Joining room:', selectedRoom.room_number, 'as', role);
                
                const response = await fetch('./api/room_handler.php?action=join_room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_number: selectedRoom.room_number,
                        player_id: currentStudent.id,
                        preferred_role: role
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log('Successfully joined room:', result.data);
                    
                    // Store room info for redirect
                    const roomNumber = selectedRoom.room_number;
                    const assignedRole = result.data.role;
                    
                    // Save current student info for the game view
                    if (currentStudent) {
                        sessionStorage.setItem('currentStudent', JSON.stringify(currentStudent));
                        console.log('Saved student info for game view:', currentStudent);
                    }
                    
                    // Hide modal and clear selection
                    hideRoleModal();
                    selectedRoom = null;
                    
                    // Redirect to appropriate game interface
                    const gameUrl = `./student.php?room=${roomNumber}&role=${assignedRole}`;
                    console.log('Redirecting to:', gameUrl);
                    window.location.href = gameUrl;
                } else {
                    console.error('Failed to join room:', result.error);
                    alert('Failed to join room: ' + result.error);
                }
            } catch (error) {
                console.error('Error joining room:', error);
                alert('Error joining room: ' + error.message);
            }
        };

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Student Portal loaded');
            
            // Handle room number input
            const roomInput = document.getElementById('roomNumberInput');
            roomInput.addEventListener('input', function() {
                // Auto-format to 2 digits
                let value = this.value.replace(/\D/g, '');
                if (value.length > 2) value = value.slice(0, 2);
                if (value.length === 1 && value !== '0') value = '0' + value;
                this.value = value;
            });
            
            roomInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    joinDirectRoom();
                }
            });
        });
    </script>
</body>
</html>