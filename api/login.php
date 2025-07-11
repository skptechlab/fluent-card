<?php
// Login/Register API endpoint for Fluency Card Game
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
if (!isset($input['username']) || empty(trim($input['username']))) {
    send_response(false, null, 'Username is required');
}

$username = trim($input['username']);
$email = isset($input['email']) ? trim($input['email']) : null;

// Validate username length
if (strlen($username) < 3 || strlen($username) > 50) {
    send_response(false, null, 'Username must be between 3 and 50 characters');
}

// Validate email if provided
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response(false, null, 'Invalid email format');
}

try {
    // Get or create player
    $player = get_or_create_player($username, $email);
    
    // Return player data
    send_response(true, [
        'player' => $player,
        'message' => 'Login successful'
    ]);
    
} catch (Exception $e) {
    send_response(false, null, 'Login failed: ' . $e->getMessage());
}

close_connection();
?>