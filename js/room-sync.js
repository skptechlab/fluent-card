// Room-based synchronization system for Fluency Card Game
// Adapted from pictotalk's sync architecture but simplified for card game mechanics

export class RoomSyncManager {
    constructor(roomNumber, playerRole, playerId) {
        this.roomNumber = roomNumber;
        this.playerRole = playerRole; // 'teacher', 'player', 'spectator'
        this.playerId = playerId;
        this.lastSyncTimestamp = 0;
        this.syncInterval = null;
        this.isConnected = false;
        this.pollingRate = playerRole === 'teacher' ? 1000 : 2000; // Teachers get faster updates
        
        // Event callbacks
        this.onStateUpdate = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onGameStateChange = null;
        this.onConnectionChange = null;
        
        this.init();
    }
    
    init() {
        console.log(`Initializing room sync for Room ${this.roomNumber} as ${this.playerRole}`);
        this.startSyncLoop();
    }
    
    startSyncLoop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncRoomState();
            } catch (error) {
                console.error('Sync error:', error);
                this.handleConnectionError(error);
            }
        }, this.pollingRate);
        
        // Initial sync
        this.syncRoomState();
    }
    
    async syncRoomState() {
        try {
            const response = await fetch(`./api/room_handler.php?action=get_room_state&room_number=${this.roomNumber}`);
            const result = await response.json();
            
            if (result.success) {
                this.handleRoomStateUpdate(result.data);
                this.setConnectionStatus(true);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.setConnectionStatus(false);
            throw error;
        }
    }
    
    handleRoomStateUpdate(roomData) {
        const { room, participants, game_state } = roomData;
        
        // Check for participant changes
        this.handleParticipantChanges(participants);
        
        // Handle game state updates
        if (game_state && game_state.last_command_timestamp > this.lastSyncTimestamp) {
            this.lastSyncTimestamp = game_state.last_command_timestamp;
            this.handleGameStateUpdate(game_state.game_state);
        }
        
        // Trigger general state update callback
        if (this.onStateUpdate) {
            this.onStateUpdate(roomData);
        }
    }
    
    handleParticipantChanges(participants) {
        // Store current participants to detect changes
        if (!this.lastParticipants) {
            this.lastParticipants = [];
        }
        
        // Check for new participants
        participants.forEach(participant => {
            const existingParticipant = this.lastParticipants.find(p => p.player_id === participant.player_id);
            if (!existingParticipant && this.onPlayerJoined) {
                this.onPlayerJoined(participant);
            }
        });
        
        // Check for left participants
        this.lastParticipants.forEach(participant => {
            const stillPresent = participants.find(p => p.player_id === participant.player_id);
            if (!stillPresent && this.onPlayerLeft) {
                this.onPlayerLeft(participant);
            }
        });
        
        this.lastParticipants = [...participants];
    }
    
    handleGameStateUpdate(gameState) {
        if (!gameState) return;
        
        console.log('Game state update received:', gameState);
        
        if (this.onGameStateChange) {
            this.onGameStateChange(gameState);
        }
    }
    
    async updateRoomGameState(gameState) {
        if (this.playerRole !== 'teacher') {
            console.warn('Only teachers can update room game state');
            return false;
        }
        
        try {
            const response = await fetch('./api/room_handler.php?action=update_room_state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: this.currentRoomId,
                    player_id: this.playerId,
                    game_state: {
                        gameState: gameState,
                        lastUpdate: Date.now()
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.lastSyncTimestamp = result.data.timestamp;
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to update room game state:', error);
            return false;
        }
    }
    
    async sendCardPlay(cardData, targetPlayer = null) {
        if (this.playerRole === 'spectator') {
            console.warn('Spectators cannot play cards');
            return false;
        }
        
        const gameState = {
            action: 'card_play',
            playerId: this.playerId,
            cardData: cardData,
            targetPlayer: targetPlayer,
            timestamp: Date.now()
        };
        
        return await this.updateRoomGameState(gameState);
    }
    
    async sendTurnEnd(playerState) {
        if (this.playerRole === 'spectator') {
            console.warn('Spectators cannot end turns');
            return false;
        }
        
        const gameState = {
            action: 'turn_end',
            playerId: this.playerId,
            playerState: playerState,
            timestamp: Date.now()
        };
        
        return await this.updateRoomGameState(gameState);
    }
    
    async sendGameCommand(command, data = {}) {
        if (this.playerRole !== 'teacher') {
            console.warn('Only teachers can send game commands');
            return false;
        }
        
        const gameState = {
            action: 'game_command',
            command: command,
            data: data,
            timestamp: Date.now()
        };
        
        return await this.updateRoomGameState(gameState);
    }
    
    setConnectionStatus(connected) {
        if (this.isConnected !== connected) {
            this.isConnected = connected;
            if (this.onConnectionChange) {
                this.onConnectionChange(connected);
            }
        }
    }
    
    handleConnectionError(error) {
        console.error('Connection error:', error);
        this.setConnectionStatus(false);
        
        // Implement exponential backoff for reconnection
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            
            setTimeout(() => {
                this.pollingRate = Math.min(this.pollingRate * 1.5, 10000); // Max 10 second intervals
                this.startSyncLoop();
            }, this.pollingRate);
        }
    }
    
    // Update session activity (heartbeat)
    async updateActivity() {
        try {
            const response = await fetch('./api/room_handler.php?action=update_activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_number: this.roomNumber,
                    player_id: this.playerId
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Failed to update activity:', error);
            return false;
        }
    }
    
    // Clean up
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        console.log('Room sync manager destroyed');
    }
    
    // Helper methods for game integration
    setRoomId(roomId) {
        this.currentRoomId = roomId;
    }
    
    setCallbacks(callbacks) {
        this.onStateUpdate = callbacks.onStateUpdate || null;
        this.onPlayerJoined = callbacks.onPlayerJoined || null;
        this.onPlayerLeft = callbacks.onPlayerLeft || null;
        this.onGameStateChange = callbacks.onGameStateChange || null;
        this.onConnectionChange = callbacks.onConnectionChange || null;
    }
    
    // Getters
    getConnectionStatus() {
        return this.isConnected;
    }
    
    getLastSyncTimestamp() {
        return this.lastSyncTimestamp;
    }
    
    getRoomNumber() {
        return this.roomNumber;
    }
    
    getPlayerRole() {
        return this.playerRole;
    }
}

// Utility functions for room sync
export class RoomSyncUtils {
    static createGameStateCommand(action, data) {
        return {
            action: action,
            data: data,
            timestamp: Date.now(),
            id: this.generateCommandId()
        };
    }
    
    static generateCommandId() {
        return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    static isValidGameState(gameState) {
        return gameState && 
               typeof gameState.timestamp === 'number' && 
               gameState.action && 
               gameState.timestamp > 0;
    }
    
    static mergeGameStates(currentState, newState) {
        if (!currentState) return newState;
        if (!newState) return currentState;
        
        // Newer timestamp wins
        if (newState.timestamp > currentState.timestamp) {
            return { ...currentState, ...newState };
        }
        
        return currentState;
    }
}

// Events that can be synchronized
export const SYNC_EVENTS = {
    CARD_PLAY: 'card_play',
    TURN_END: 'turn_end',
    GAME_START: 'game_start',
    GAME_PAUSE: 'game_pause',
    GAME_RESET: 'game_reset',
    GAME_END: 'game_end',
    PLAYER_HP_UPDATE: 'player_hp_update',
    BATTLEFIELD_UPDATE: 'battlefield_update',
    HAND_UPDATE: 'hand_update'
};

// Export for global use
window.RoomSyncManager = RoomSyncManager;
window.RoomSyncUtils = RoomSyncUtils;
window.SYNC_EVENTS = SYNC_EVENTS;