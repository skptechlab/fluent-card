<?php
// Room management utilities for Fluency Card Game
require_once '../db_conn.php';

// Create a new room
function createRoom($teacherId, $roomNumber, $roomName = null, $visibility = 'public', $maxPlayers = 2) {
    try {
        // Check if room number is already taken
        $checkQuery = "SELECT id FROM game_rooms WHERE room_number = '$roomNumber' AND expires_at > NOW()";
        $result = execute_query($checkQuery);
        
        if (mysqli_num_rows($result) > 0) {
            throw new Exception("Room $roomNumber is already in use");
        }
        
        // Create the room
        $query = "INSERT INTO game_rooms (room_number, teacher_id, room_name, visibility, max_players) 
                  VALUES ('$roomNumber', $teacherId, " . 
                  ($roomName ? "'$roomName'" : "NULL") . ", '$visibility', $maxPlayers)";
        
        execute_query($query);
        $roomId = mysqli_insert_id($GLOBALS['conn']);
        
        // Create teacher session
        $sessionToken = generateSessionToken();
        $sessionQuery = "INSERT INTO room_sessions (room_id, player_id, role, session_token) 
                        VALUES ($roomId, $teacherId, 'teacher', '$sessionToken')";
        execute_query($sessionQuery);
        
        // Initialize room game state
        $initialState = json_encode([
            'gameState' => [
                'currentTurn' => null,
                'gameActive' => false,
                'players' => [],
                'spectators' => []
            ],
            'lastUpdate' => time() * 1000
        ]);
        
        $stateQuery = "INSERT INTO room_game_state (room_id, game_state, last_command_timestamp) 
                      VALUES ($roomId, '$initialState', " . (time() * 1000) . ")";
        execute_query($stateQuery);
        
        return [
            'room_id' => $roomId,
            'room_number' => $roomNumber,
            'session_token' => $sessionToken
        ];
        
    } catch (Exception $e) {
        throw new Exception("Failed to create room: " . $e->getMessage());
    }
}

// Join a room as student
function joinRoom($roomNumber, $playerId, $preferredRole = 'player') {
    try {
        // Get room info
        $roomQuery = "SELECT r.*, COUNT(CASE WHEN rs.role = 'player' THEN 1 END) as active_players
                     FROM game_rooms r 
                     LEFT JOIN room_sessions rs ON r.id = rs.room_id AND rs.last_activity > (NOW() - INTERVAL 10 MINUTE)
                     WHERE r.room_number = '$roomNumber' AND r.expires_at > NOW()
                     GROUP BY r.id";
        
        $result = execute_query($roomQuery);
        
        if (mysqli_num_rows($result) == 0) {
            throw new Exception("Room $roomNumber not found or expired");
        }
        
        $room = mysqli_fetch_assoc($result);
        
        // Check if player is already in room
        $existingQuery = "SELECT role FROM room_sessions WHERE room_id = {$room['id']} AND player_id = $playerId";
        $existingResult = execute_query($existingQuery);
        
        if (mysqli_num_rows($existingResult) > 0) {
            $existing = mysqli_fetch_assoc($existingResult);
            
            // Update last activity
            $updateQuery = "UPDATE room_sessions SET last_activity = NOW() WHERE room_id = {$room['id']} AND player_id = $playerId";
            execute_query($updateQuery);
            
            return [
                'room_id' => $room['id'],
                'role' => $existing['role'],
                'message' => 'Already in room'
            ];
        }
        
        // Determine role based on availability and preference
        $role = 'spectator'; // Default to spectator
        
        if ($preferredRole === 'player' && $room['active_players'] < $room['max_players']) {
            $role = 'player';
        }
        
        // Create session
        $sessionToken = generateSessionToken();
        $joinQuery = "INSERT INTO room_sessions (room_id, player_id, role, session_token) 
                     VALUES ({$room['id']}, $playerId, '$role', '$sessionToken')";
        execute_query($joinQuery);
        
        // Update room game state with new participant
        updateRoomParticipants($room['id']);
        
        return [
            'room_id' => $room['id'],
            'role' => $role,
            'session_token' => $sessionToken,
            'message' => "Joined room as $role"
        ];
        
    } catch (Exception $e) {
        throw new Exception("Failed to join room: " . $e->getMessage());
    }
}

// Leave a room
function leaveRoom($roomId, $playerId) {
    try {
        // Get current role
        $roleQuery = "SELECT role FROM room_sessions WHERE room_id = $roomId AND player_id = $playerId";
        $result = execute_query($roleQuery);
        
        if (mysqli_num_rows($result) == 0) {
            return ['message' => 'Not in room'];
        }
        
        $currentRole = mysqli_fetch_assoc($result)['role'];
        
        // Remove from room
        $leaveQuery = "DELETE FROM room_sessions WHERE room_id = $roomId AND player_id = $playerId";
        execute_query($leaveQuery);
        
        // If a player left, promote a spectator
        if ($currentRole === 'player') {
            promoteSpectatorToPlayer($roomId);
        }
        
        // Update room participants
        updateRoomParticipants($roomId);
        
        return ['message' => 'Left room successfully'];
        
    } catch (Exception $e) {
        throw new Exception("Failed to leave room: " . $e->getMessage());
    }
}

// Promote spectator to player when slot opens
function promoteSpectatorToPlayer($roomId) {
    try {
        // Find oldest spectator
        $spectatorQuery = "SELECT player_id FROM room_sessions 
                          WHERE room_id = $roomId AND role = 'spectator' 
                          ORDER BY joined_at ASC LIMIT 1";
        $result = execute_query($spectatorQuery);
        
        if (mysqli_num_rows($result) > 0) {
            $spectator = mysqli_fetch_assoc($result);
            
            // Promote to player
            $promoteQuery = "UPDATE room_sessions SET role = 'player' 
                            WHERE room_id = $roomId AND player_id = {$spectator['player_id']}";
            execute_query($promoteQuery);
            
            return $spectator['player_id'];
        }
        
        return null;
        
    } catch (Exception $e) {
        throw new Exception("Failed to promote spectator: " . $e->getMessage());
    }
}

// Get room status and participants
function getRoomState($roomNumber) {
    try {
        $query = "SELECT r.*, 
                         t.username as teacher_name,
                         rgs.game_state,
                         rgs.last_command_timestamp
                  FROM game_rooms r
                  LEFT JOIN players t ON r.teacher_id = t.id  
                  LEFT JOIN room_game_state rgs ON r.id = rgs.room_id
                  WHERE r.room_number = '$roomNumber' AND r.expires_at > NOW()";
                  
        $result = execute_query($query);
        
        if (mysqli_num_rows($result) == 0) {
            throw new Exception("Room not found");
        }
        
        $room = mysqli_fetch_assoc($result);
        
        // Get participants
        $participantsQuery = "SELECT rs.*, p.username 
                             FROM room_sessions rs
                             JOIN players p ON rs.player_id = p.id
                             WHERE rs.room_id = {$room['id']} AND rs.last_activity > (NOW() - INTERVAL 10 MINUTE)
                             ORDER BY rs.role, rs.joined_at";
        
        $participantsResult = execute_query($participantsQuery);
        $participants = [];
        
        while ($participant = mysqli_fetch_assoc($participantsResult)) {
            $participants[] = $participant;
        }
        
        return [
            'room' => $room,
            'participants' => $participants,
            'game_state' => json_decode($room['game_state'], true)
        ];
        
    } catch (Exception $e) {
        throw new Exception("Failed to get room state: " . $e->getMessage());
    }
}

// Update room game state
function updateRoomGameState($roomId, $gameState) {
    try {
        $stateJson = json_encode($gameState);
        $timestamp = time() * 1000;
        
        $query = "UPDATE room_game_state 
                 SET game_state = '$stateJson', last_command_timestamp = $timestamp
                 WHERE room_id = $roomId";
        
        execute_query($query);
        
        return $timestamp;
        
    } catch (Exception $e) {
        throw new Exception("Failed to update room state: " . $e->getMessage());
    }
}

// Update room participants in game state
function updateRoomParticipants($roomId) {
    try {
        // Get current participants
        $query = "SELECT rs.role, rs.player_id, p.username 
                 FROM room_sessions rs
                 JOIN players p ON rs.player_id = p.id
                 WHERE rs.room_id = $roomId AND rs.last_activity > (NOW() - INTERVAL 10 MINUTE)";
        
        $result = execute_query($query);
        $players = [];
        $spectators = [];
        
        while ($participant = mysqli_fetch_assoc($result)) {
            if ($participant['role'] === 'player') {
                $players[] = [
                    'id' => $participant['player_id'],
                    'username' => $participant['username']
                ];
            } elseif ($participant['role'] === 'spectator') {
                $spectators[] = [
                    'id' => $participant['player_id'], 
                    'username' => $participant['username']
                ];
            }
        }
        
        // Get current game state
        $stateQuery = "SELECT game_state FROM room_game_state WHERE room_id = $roomId";
        $stateResult = execute_query($stateQuery);
        $currentState = [];
        
        if (mysqli_num_rows($stateResult) > 0) {
            $currentState = json_decode(mysqli_fetch_assoc($stateResult)['game_state'], true);
        }
        
        // Update participants
        $currentState['gameState']['players'] = $players;
        $currentState['gameState']['spectators'] = $spectators;
        $currentState['lastUpdate'] = time() * 1000;
        
        // Save updated state
        updateRoomGameState($roomId, $currentState);
        
    } catch (Exception $e) {
        throw new Exception("Failed to update participants: " . $e->getMessage());
    }
}

// Get all available rooms (for student interface)
function getAvailableRooms() {
    try {
        $query = "SELECT * FROM room_status 
                 WHERE status != 'finished' AND expires_at > NOW() AND visibility = 'public'
                 ORDER BY room_number";
        
        $result = execute_query($query);
        $rooms = [];
        
        while ($room = mysqli_fetch_assoc($result)) {
            $rooms[] = $room;
        }
        
        return $rooms;
        
    } catch (Exception $e) {
        throw new Exception("Failed to get available rooms: " . $e->getMessage());
    }
}

// Clean up expired rooms and sessions
function cleanupExpiredRooms() {
    try {
        // Delete expired rooms
        $deleteRoomsQuery = "DELETE FROM game_rooms WHERE expires_at < NOW()";
        execute_query($deleteRoomsQuery);
        
        // Delete inactive sessions (older than 2 minutes)
        $deleteSessionsQuery = "DELETE FROM room_sessions WHERE last_activity < (NOW() - INTERVAL 15 MINUTE)";
        execute_query($deleteSessionsQuery);
        
    } catch (Exception $e) {
        throw new Exception("Failed to cleanup: " . $e->getMessage());
    }
}

// Generate session token
function generateSessionToken() {
    return bin2hex(random_bytes(32));
}

// Validate session token
function validateSessionToken($roomId, $playerId, $sessionToken) {
    try {
        $query = "SELECT id FROM room_sessions 
                 WHERE room_id = $roomId AND player_id = $playerId AND session_token = '$sessionToken'
                 AND last_activity > (NOW() - INTERVAL 10 MINUTE)";
        
        $result = execute_query($query);
        return mysqli_num_rows($result) > 0;
        
    } catch (Exception $e) {
        return false;
    }
}

// Update session activity
function updateSessionActivity($roomId, $playerId) {
    try {
        $query = "UPDATE room_sessions SET last_activity = NOW() 
                 WHERE room_id = $roomId AND player_id = $playerId";
        execute_query($query);
        
    } catch (Exception $e) {
        // Silently fail
    }
}
?>