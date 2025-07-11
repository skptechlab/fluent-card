<?php
// Database connection for Fluency Card Game
// Simple PvP card battle game

// Database configuration
$host = "localhost";
$username = "u347410273_admin";
$password = "HECcdr01@";
$database = "u347410273_academic";

// Create connection
$conn = mysqli_connect($host, $username, $password, $database);

// Check connection
if (!$conn) {
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . mysqli_connect_error()
    ]));
}

// Set charset to UTF-8
mysqli_set_charset($conn, "utf8");

// Function to sanitize input data
function sanitize_input($data) {
    global $conn;
    return mysqli_real_escape_string($conn, trim($data));
}

// Function to send JSON response
function send_response($success, $data = null, $error = null) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    $response = ['success' => $success];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($error !== null) {
        $response['error'] = $error;
    }
    
    echo json_encode($response);
    exit;
}

// Function to execute query and return results
function execute_query($query, $return_result = true) {
    global $conn;
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        send_response(false, null, 'Query failed: ' . mysqli_error($conn));
    }
    
    if ($return_result) {
        return $result;
    }
    
    return true;
}

// Function to get all cards
function get_all_cards() {
    $query = "SELECT id, name, attack_damage, image_path FROM cards WHERE is_active = 1 ORDER BY name";
    $result = execute_query($query);
    
    $cards = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $cards[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'atk' => (int)$row['attack_damage'],
            'imagePath' => $row['image_path']
        ];
    }
    
    return $cards;
}

// Function to create or get player
function get_or_create_player($username, $email = null) {
    global $conn;
    
    $username = sanitize_input($username);
    $email = $email ? sanitize_input($email) : null;
    
    // Check if player exists
    $query = "SELECT id, username, total_wins, total_losses, win_streak FROM players WHERE username = '$username'";
    $result = execute_query($query);
    
    if (mysqli_num_rows($result) > 0) {
        return mysqli_fetch_assoc($result);
    }
    
    // Create new player
    if ($email) {
        $query = "INSERT INTO players (username, email) VALUES ('$username', '$email')";
    } else {
        $query = "INSERT INTO players (username) VALUES ('$username')";
    }
    execute_query($query, false);
    
    $player_id = mysqli_insert_id($conn);
    
    return [
        'id' => $player_id,
        'username' => $username,
        'total_wins' => 0,
        'total_losses' => 0,
        'win_streak' => 0
    ];
}

// Function to update player stats
function update_player_stats($player_id, $won) {
    global $conn;
    
    $player_id = (int)$player_id;
    
    if ($won) {
        $query = "UPDATE players SET 
                    total_wins = total_wins + 1, 
                    win_streak = win_streak + 1,
                    updated_at = CURRENT_TIMESTAMP
                  WHERE id = $player_id";
    } else {
        $query = "UPDATE players SET 
                    total_losses = total_losses + 1, 
                    win_streak = 0,
                    updated_at = CURRENT_TIMESTAMP
                  WHERE id = $player_id";
    }
    
    execute_query($query, false);
}

// Function to create new game session
function create_game_session($player1_id, $player2_id = null) {
    global $conn;
    
    $player1_id = (int)$player1_id;
    $player2_part = $player2_id ? (int)$player2_id : 'NULL';
    
    $query = "INSERT INTO game_sessions (player1_id, player2_id, status) 
              VALUES ($player1_id, $player2_part, 'active')";
    execute_query($query, false);
    
    return mysqli_insert_id($conn);
}

// Function to update game session
function update_game_session($session_id, $player1_hp, $player2_hp, $current_turn, $winner_id = null) {
    global $conn;
    
    $session_id = (int)$session_id;
    $player1_hp = (int)$player1_hp;
    $player2_hp = (int)$player2_hp;
    $current_turn = sanitize_input($current_turn);
    
    $status = ($player1_hp <= 0 || $player2_hp <= 0) ? 'finished' : 'active';
    $winner_part = $winner_id ? (int)$winner_id : 'NULL';
    
    $query = "UPDATE game_sessions SET 
                player1_hp = $player1_hp,
                player2_hp = $player2_hp,
                current_turn = '$current_turn',
                status = '$status',
                winner_id = $winner_part,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $session_id";
    
    execute_query($query, false);
}

// Function to record game move
function record_game_move($session_id, $player_id, $card_id, $damage_dealt, $move_number) {
    global $conn;
    
    $session_id = (int)$session_id;
    $player_id = (int)$player_id;
    $card_id = (int)$card_id;
    $damage_dealt = (int)$damage_dealt;
    $move_number = (int)$move_number;
    
    $query = "INSERT INTO game_moves (game_session_id, player_id, card_id, damage_dealt, move_number) 
              VALUES ($session_id, $player_id, $card_id, $damage_dealt, $move_number)";
    
    execute_query($query, false);
}

// Close connection function
function close_connection() {
    global $conn;
    if ($conn) {
        mysqli_close($conn);
    }
}
?>