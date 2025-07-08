<?php
// Create game session API endpoint for Card Battle Arena
require_once '../db_conn.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_response(false, null, 'Only POST method allowed');
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_response(false, null, 'Invalid JSON input');
}

// Validate required fields
if (!isset($input['player1_id']) || !is_numeric($input['player1_id'])) {
    send_response(false, null, 'Valid player1_id is required');
}

$player1_id = (int)$input['player1_id'];
$player2_id = isset($input['player2_id']) && is_numeric($input['player2_id']) ? (int)$input['player2_id'] : null;

try {
    // Create new game session
    $session_id = create_game_session($player1_id, $player2_id);
    
    // Get initial game state
    $query = "SELECT id, player1_id, player2_id, player1_hp, player2_hp, current_turn, status 
              FROM game_sessions WHERE id = $session_id";
    $result = execute_query($query);
    $game_session = mysqli_fetch_assoc($result);
    
    // Convert numeric fields
    $game_session['id'] = (int)$game_session['id'];
    $game_session['player1_id'] = (int)$game_session['player1_id'];
    $game_session['player2_id'] = $game_session['player2_id'] ? (int)$game_session['player2_id'] : null;
    $game_session['player1_hp'] = (int)$game_session['player1_hp'];
    $game_session['player2_hp'] = (int)$game_session['player2_hp'];
    
    // Return game session data
    send_response(true, [
        'game_session' => $game_session,
        'message' => 'Game created successfully'
    ]);
    
} catch (Exception $e) {
    send_response(false, null, 'Failed to create game: ' . $e->getMessage());
}

close_connection();
?>