<?php
// Room management API for Fluency Card Game
require_once '../db_conn.php';
require_once 'room_utilities.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Get action parameter
$action = $_GET['action'] ?? '';

try {
    // Clean up expired rooms first
    cleanupExpiredRooms();
    
    switch ($action) {
        case 'create_room':
            handleCreateRoom();
            break;
            
        case 'join_room':
            handleJoinRoom();
            break;
            
        case 'leave_room':
            handleLeaveRoom();
            break;
            
        case 'get_room_state':
            handleGetRoomState();
            break;
            
        case 'update_room_state':
            handleUpdateRoomState();
            break;
            
        case 'get_available_rooms':
            handleGetAvailableRooms();
            break;
            
        case 'get_room_numbers':
            handleGetRoomNumbers();
            break;
            
        default:
            send_response(false, null, 'Invalid action');
    }
    
} catch (Exception $e) {
    send_response(false, null, $e->getMessage());
}

function handleCreateRoom() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    if (!isset($input['teacher_id']) || !is_numeric($input['teacher_id'])) {
        throw new Exception('Valid teacher_id is required');
    }
    
    if (!isset($input['room_number']) || !preg_match('/^(0[1-9]|1[0-9]|20)$/', $input['room_number'])) {
        throw new Exception('Valid room_number (01-20) is required');
    }
    
    $teacherId = (int)$input['teacher_id'];
    $roomNumber = $input['room_number'];
    $roomName = $input['room_name'] ?? null;
    $visibility = $input['visibility'] ?? 'public';
    $maxPlayers = $input['max_players'] ?? 2;
    
    $result = createRoom($teacherId, $roomNumber, $roomName, $visibility, $maxPlayers);
    
    send_response(true, $result, 'Room created successfully');
}

function handleJoinRoom() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    if (!isset($input['player_id']) || !is_numeric($input['player_id'])) {
        throw new Exception('Valid player_id is required');
    }
    
    if (!isset($input['room_number'])) {
        throw new Exception('room_number is required');
    }
    
    $playerId = (int)$input['player_id'];
    $roomNumber = $input['room_number'];
    $preferredRole = $input['preferred_role'] ?? 'player';
    
    $result = joinRoom($roomNumber, $playerId, $preferredRole);
    
    send_response(true, $result);
}

function handleLeaveRoom() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    if (!isset($input['room_id']) || !is_numeric($input['room_id'])) {
        throw new Exception('Valid room_id is required');
    }
    
    if (!isset($input['player_id']) || !is_numeric($input['player_id'])) {
        throw new Exception('Valid player_id is required');
    }
    
    $roomId = (int)$input['room_id'];
    $playerId = (int)$input['player_id'];
    
    $result = leaveRoom($roomId, $playerId);
    
    send_response(true, $result);
}

function handleGetRoomState() {
    $roomNumber = $_GET['room_number'] ?? '';
    $playerId = $_GET['player_id'] ?? null; // Optional parameter for activity tracking
    
    if (!$roomNumber) {
        throw new Exception('room_number parameter is required');
    }
    
    $result = getRoomState($roomNumber);
    
    // Update activity if player_id is provided (for students syncing)
    if ($playerId && is_numeric($playerId)) {
        updateSessionActivity($result['room']['id'], (int)$playerId);
    }
    
    send_response(true, $result);
}

function handleUpdateRoomState() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    if (!isset($input['room_id']) || !is_numeric($input['room_id'])) {
        throw new Exception('Valid room_id is required');
    }
    
    if (!isset($input['game_state'])) {
        throw new Exception('game_state is required');
    }
    
    $roomId = (int)$input['room_id'];
    $gameState = $input['game_state'];
    
    // Optional player validation
    if (isset($input['player_id'])) {
        $playerId = (int)$input['player_id'];
        updateSessionActivity($roomId, $playerId);
    }
    
    $timestamp = updateRoomGameState($roomId, $gameState);
    
    send_response(true, [
        'timestamp' => $timestamp,
        'message' => 'Room state updated'
    ]);
}

function handleGetAvailableRooms() {
    $rooms = getAvailableRooms();
    
    send_response(true, [
        'rooms' => $rooms,
        'count' => count($rooms)
    ]);
}

function handleGetRoomNumbers() {
    // Return available room numbers (01-20)
    $availableNumbers = [];
    
    // Get all occupied room numbers
    $query = "SELECT room_number FROM game_rooms WHERE expires_at > NOW()";
    $result = execute_query($query);
    $occupied = [];
    
    while ($row = mysqli_fetch_assoc($result)) {
        $occupied[] = $row['room_number'];
    }
    
    // Generate list of available numbers
    for ($i = 1; $i <= 20; $i++) {
        $roomNumber = sprintf('%02d', $i);
        if (!in_array($roomNumber, $occupied)) {
            $availableNumbers[] = $roomNumber;
        }
    }
    
    send_response(true, [
        'available_numbers' => $availableNumbers,
        'occupied_numbers' => $occupied
    ]);
}

close_connection();
?>