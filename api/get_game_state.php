<?php
// Get game state API endpoint for Card Battle Arena
require_once '../db_conn.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_response(false, null, 'Only GET method allowed');
}

// Get session_id from query parameters
if (!isset($_GET['session_id']) || !is_numeric($_GET['session_id'])) {
    send_response(false, null, 'Valid session_id is required');
}

$session_id = (int)$_GET['session_id'];

try {
    // Get game session data with player info
    $query = "SELECT 
                gs.id, gs.player1_id, gs.player2_id, gs.player1_hp, gs.player2_hp, 
                gs.current_turn, gs.status, gs.winner_id, gs.created_at, gs.updated_at,
                p1.username as player1_username, p1.total_wins as p1_wins, p1.total_losses as p1_losses,
                p2.username as player2_username, p2.total_wins as p2_wins, p2.total_losses as p2_losses
              FROM game_sessions gs
              LEFT JOIN players p1 ON gs.player1_id = p1.id
              LEFT JOIN players p2 ON gs.player2_id = p2.id
              WHERE gs.id = $session_id";
    
    $result = execute_query($query);
    
    if (mysqli_num_rows($result) === 0) {
        send_response(false, null, 'Game session not found');
    }
    
    $game = mysqli_fetch_assoc($result);
    
    // Convert numeric fields
    $game['id'] = (int)$game['id'];
    $game['player1_id'] = (int)$game['player1_id'];
    $game['player2_id'] = $game['player2_id'] ? (int)$game['player2_id'] : null;
    $game['player1_hp'] = (int)$game['player1_hp'];
    $game['player2_hp'] = (int)$game['player2_hp'];
    $game['winner_id'] = $game['winner_id'] ? (int)$game['winner_id'] : null;
    $game['p1_wins'] = (int)$game['p1_wins'];
    $game['p1_losses'] = (int)$game['p1_losses'];
    $game['p2_wins'] = $game['p2_wins'] ? (int)$game['p2_wins'] : 0;
    $game['p2_losses'] = $game['p2_losses'] ? (int)$game['p2_losses'] : 0;
    
    // Get recent moves for this game
    $moves_query = "SELECT 
                      gm.id, gm.player_id, gm.card_id, gm.damage_dealt, gm.move_number, gm.created_at,
                      c.name as card_name, c.attack_damage,
                      p.username as player_username
                    FROM game_moves gm
                    LEFT JOIN cards c ON gm.card_id = c.id
                    LEFT JOIN players p ON gm.player_id = p.id
                    WHERE gm.game_session_id = $session_id
                    ORDER BY gm.move_number DESC
                    LIMIT 10";
    
    $moves_result = execute_query($moves_query);
    $moves = [];
    
    while ($move = mysqli_fetch_assoc($moves_result)) {
        $moves[] = [
            'id' => (int)$move['id'],
            'player_id' => (int)$move['player_id'],
            'card_id' => (int)$move['card_id'],
            'card_name' => $move['card_name'],
            'attack_damage' => (int)$move['attack_damage'],
            'damage_dealt' => (int)$move['damage_dealt'],
            'move_number' => (int)$move['move_number'],
            'player_username' => $move['player_username'],
            'created_at' => $move['created_at']
        ];
    }
    
    // Return game state with moves
    send_response(true, [
        'game_session' => $game,
        'recent_moves' => $moves,
        'total_moves' => count($moves)
    ]);
    
} catch (Exception $e) {
    send_response(false, null, 'Failed to get game state: ' . $e->getMessage());
}

close_connection();
?>