<?php
// Get cards API endpoint for Card Battle Arena
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

try {
    // Get all available cards
    $cards = get_all_cards();
    
    // Return cards data
    send_response(true, [
        'cards' => $cards,
        'count' => count($cards)
    ]);
    
} catch (Exception $e) {
    send_response(false, null, 'Failed to fetch cards: ' . $e->getMessage());
}

close_connection();
?>