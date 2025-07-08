<?php
// Simple test file to check if PHP and database are working
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo "Testing PHP backend...\n";

// Test database connection
try {
    require_once 'db_conn.php';
    echo "✅ Database connection successful\n";
    
    // Test if tables exist
    $tables = ['players', 'game_sessions', 'cards', 'game_moves'];
    foreach ($tables as $table) {
        $query = "SHOW TABLES LIKE '$table'";
        $result = mysqli_query($conn, $query);
        if (mysqli_num_rows($result) > 0) {
            echo "✅ Table '$table' exists\n";
        } else {
            echo "❌ Table '$table' missing\n";
        }
    }
    
    // Test card data
    $query = "SELECT COUNT(*) as count FROM cards";
    $result = mysqli_query($conn, $query);
    if ($result) {
        $row = mysqli_fetch_assoc($result);
        echo "✅ Cards table has {$row['count']} cards\n";
    }
    
    close_connection();
    
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}

echo "\nAPI Tests:\n";

// Test API endpoints
$endpoints = [
    'get_cards.php' => 'GET',
    'login.php' => 'POST'
];

foreach ($endpoints as $endpoint => $method) {
    if (file_exists("api/$endpoint")) {
        echo "✅ API endpoint '$endpoint' exists\n";
    } else {
        echo "❌ API endpoint '$endpoint' missing\n";
    }
}

echo "\n✅ Backend test complete!\n";
echo "If you see this message, PHP is working correctly.\n";
?>