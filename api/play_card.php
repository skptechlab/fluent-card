<?php
// Play card API endpoint for Card Battle Arena
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
$required_fields = ['session_id', 'player_id', 'card_id', 'damage_dealt'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || !is_numeric($input[$field])) {
        send_response(false, null, "Valid $field is required");
    }
}

$session_id = (int)$input['session_id'];
$player_id = (int)$input['player_id'];
$card_id = (int)$input['card_id'];
$damage_dealt = (int)$input['damage_dealt'];

try {
    // Get current game state
    $query = "SELECT player1_id, player2_id, player1_hp, player2_hp, current_turn, status 
              FROM game_sessions WHERE id = $session_id";
    $result = execute_query($query);
    
    if (mysqli_num_rows($result) === 0) {
        send_response(false, null, 'Game session not found');
    }
    
    $game = mysqli_fetch_assoc($result);
    
    // Check if game is still active
    if ($game['status'] !== 'active') {
        send_response(false, null, 'Game is not active');
    }
    
    // Validate player turn
    $is_player1 = (int)$game['player1_id'] === $player_id;
    $is_player2 = $game['player2_id'] && (int)$game['player2_id'] === $player_id;
    
    if (!$is_player1 && !$is_player2) {
        send_response(false, null, 'Player not in this game');
    }
    
    // Check if it's the player's turn
    $expected_turn = $is_player1 ? 'player1' : 'player2';
    if ($game['current_turn'] !== $expected_turn) {
        send_response(false, null, 'Not your turn');
    }
    
    // Calculate new HP values
    $player1_hp = (int)$game['player1_hp'];
    $player2_hp = (int)$game['player2_hp'];
    
    if ($is_player1) {
        $player2_hp = max(0, $player2_hp - $damage_dealt);
        $next_turn = 'player2';
    } else {
        $player1_hp = max(0, $player1_hp - $damage_dealt);
        $next_turn = 'player1';
    }
    
    // Determine winner
    $winner_id = null;
    if ($player1_hp <= 0) {
        $winner_id = $game['player2_id'];
    } elseif ($player2_hp <= 0) {
        $winner_id = $game['player1_id'];
    }
    
    // Get move number
    $move_query = "SELECT COUNT(*) as move_count FROM game_moves WHERE game_session_id = $session_id";
    $move_result = execute_query($move_query);
    $move_count = mysqli_fetch_assoc($move_result)['move_count'];
    $move_number = (int)$move_count + 1;
    
    // Record the move
    record_game_move($session_id, $player_id, $card_id, $damage_dealt, $move_number);
    
    // Update game session
    update_game_session($session_id, $player1_hp, $player2_hp, $next_turn, $winner_id);
    
    // Update player stats if game finished
    if ($winner_id) {
        $loser_id = $winner_id === (int)$game['player1_id'] ? $game['player2_id'] : $game['player1_id'];
        
        update_player_stats($winner_id, true);  // Winner
        if ($loser_id) {
            update_player_stats($loser_id, false); // Loser
        }
    }
    
    // Get updated game state
    $updated_query = "SELECT id, player1_id, player2_id, player1_hp, player2_hp, current_turn, status, winner_id 
                      FROM game_sessions WHERE id = $session_id";
    $updated_result = execute_query($updated_query);
    $updated_game = mysqli_fetch_assoc($updated_result);
    
    // Convert numeric fields
    $updated_game['id'] = (int)$updated_game['id'];
    $updated_game['player1_id'] = (int)$updated_game['player1_id'];
    $updated_game['player2_id'] = $updated_game['player2_id'] ? (int)$updated_game['player2_id'] : null;
    $updated_game['player1_hp'] = (int)$updated_game['player1_hp'];
    $updated_game['player2_hp'] = (int)$updated_game['player2_hp'];
    $updated_game['winner_id'] = $updated_game['winner_id'] ? (int)$updated_game['winner_id'] : null;
    
    // Return updated game state
    send_response(true, [
        'game_session' => $updated_game,
        'damage_dealt' => $damage_dealt,
        'move_number' => $move_number,
        'game_over' => $updated_game['status'] === 'finished',
        'message' => 'Card played successfully'
    ]);
    
} catch (Exception $e) {
    send_response(false, null, 'Failed to play card: ' . $e->getMessage());
}

close_connection();
?>