# Fluency Card Game - Testing Instructions

## Setup Requirements

### Database Setup
1. Import the database schema:
   ```sql
   source setup.sql
   ```
   or manually run the SQL commands in `setup.sql`

2. Verify database connection in `db_conn.php`:
   - Host: localhost
   - Username: u347410273_admin
   - Password: HECcdr01@
   - Database: u347410273_academic

### Local Server
Start a local PHP server:
```bash
php -S localhost:8080
```

Then open: http://localhost:8080

## Game Features

### 🎮 Simple PvP Battle
- Each player starts with 100 HP
- 5 cards in hand 
- Cards have attack values only (10-50 damage)
- Click cards to attack opponent
- Beautiful 3D card flying animations
- Turn-based: Player vs AI

### 🔧 Backend Features
- **PHP/MySQL** backend
- **Optional login** (saves stats) or **guest mode**
- **Database tracking** of games and player stats
- **API endpoints** for all game actions

### 🎨 Visual Features
- **3D Three.js** card rendering
- **Smooth animations** - cards fly across battlefield
- **Hover effects** - cards scale and show tooltips
- **HP bars** with real-time updates
- **Battle log** showing all actions

## File Structure
```
/
├── index.html          # Main game interface
├── game.js             # Core game logic with PHP API calls
├── cards.js            # Simplified card data + 3D Card class
├── styles.css          # Game styling
├── threeSetup.js       # Three.js scene setup
├── utils.js            # Helper functions
├── db_conn.php         # Database connection
├── setup.sql           # Database schema
├── api/                # PHP API endpoints
│   ├── login.php       # Player login/register
│   ├── get_cards.php   # Get available cards
│   ├── create_game.php # Start new game session
│   ├── play_card.php   # Submit card play
│   └── get_game_state.php # Get current game state
└── assets/             # Images, audio, etc.
```

## How to Play
1. Click "Start Battle" or "Quick Play"
2. Cards appear in 3D at bottom of screen
3. Click any card to attack
4. Watch beautiful animation as card flies across
5. AI responds automatically
6. First to 0 HP loses!

## API Testing
You can test API endpoints directly:

### Login
```bash
curl -X POST http://localhost:8080/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"TestPlayer","email":"test@example.com"}'
```

### Get Cards
```bash
curl http://localhost:8080/api/get_cards.php
```

## Troubleshooting
- If database connection fails, game runs in offline mode
- Check PHP error logs for API issues
- Ensure all card images exist in `./cards/` directory
- For CORS issues, make sure PHP headers are set correctly