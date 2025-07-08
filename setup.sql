-- Database setup for Card Battle Arena
-- Simple PvP card battle game with PHP/MySQL backend

-- Create players table for user management
CREATE TABLE IF NOT EXISTS players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) DEFAULT NULL,
    total_wins INT DEFAULT 0,
    total_losses INT DEFAULT 0,
    win_streak INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create game sessions table to track ongoing and completed games
CREATE TABLE IF NOT EXISTS game_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player1_id INT,
    player2_id INT DEFAULT NULL, -- NULL for vs AI games
    winner_id INT DEFAULT NULL,
    player1_hp INT DEFAULT 100,
    player2_hp INT DEFAULT 100,
    current_turn ENUM('player1', 'player2') DEFAULT 'player1',
    status ENUM('waiting', 'active', 'finished') DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL
);

-- Create cards table for card definitions
CREATE TABLE IF NOT EXISTS cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    attack_damage INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_moves table to track card plays in games
CREATE TABLE IF NOT EXISTS game_moves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_session_id INT NOT NULL,
    player_id INT NOT NULL,
    card_id INT NOT NULL,
    damage_dealt INT NOT NULL,
    move_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Insert default cards with attack values only
INSERT INTO cards (name, attack_damage, image_path) VALUES
('Fire Dragon', 45, './cards/a1.webp'),
('Lightning Bolt', 35, './cards/a2.webp'),
('Ice Shard', 25, './cards/a3.webp'),
('Earth Golem', 40, './cards/a4.webp'),
('Wind Strike', 30, './cards/a5.webp'),
('Dark Shadow', 50, './cards/a6.webp'),
('Light Beam', 20, './cards/a7.webp'),
('Flame Burst', 35, './cards/a8.webp'),
('Frost Bite', 15, './cards/a9.webp'),
('Thunder Storm', 45, './cards/a10.webp'),
('Rock Slide', 40, './cards/a11.webp'),
('Gale Force', 25, './cards/a12.webp'),
('Void Strike', 50, './cards/a13.webp'),
('Solar Flare', 30, './cards/a14.webp'),
('Blizzard', 35, './cards/a15.webp'),
('Earthquake', 45, './cards/a16.webp'),
('Hurricane', 40, './cards/a17.webp'),
('Shadow Blade', 30, './cards/a18.webp'),
('Divine Light', 25, './cards/a19.webp'),
('Meteor', 50, './cards/a20.webp');

-- Create indexes for better performance
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_players ON game_sessions(player1_id, player2_id);
CREATE INDEX idx_game_moves_session ON game_moves(game_session_id);

-- Create a view for game statistics
CREATE VIEW player_stats AS
SELECT 
    p.id,
    p.username,
    p.total_wins,
    p.total_losses,
    p.win_streak,
    CASE 
        WHEN (p.total_wins + p.total_losses) > 0 
        THEN ROUND((p.total_wins / (p.total_wins + p.total_losses)) * 100, 2)
        ELSE 0 
    END as win_percentage
FROM players p;