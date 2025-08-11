# Texas Hold'em Poker Game - Backend Integration Contracts

## API Contracts

### Authentication Endpoints
- `POST /api/auth/register` - Register new player
- `POST /api/auth/login` - Player login
- `GET /api/auth/me` - Get current player info

### Game Room Endpoints
- `GET /api/rooms` - List available rooms
- `POST /api/rooms` - Create new room
- `POST /api/rooms/{room_id}/join` - Join a room
- `GET /api/rooms/{room_id}` - Get room details
- `DELETE /api/rooms/{room_id}/leave` - Leave room

### Game State Endpoints
- `GET /api/games/{game_id}` - Get current game state
- `POST /api/games/{game_id}/action` - Make player action (fold, call, raise, etc.)

### WebSocket Endpoints
- `WS /ws/{room_id}` - Real-time game updates

## Data Models

### Player Model
```python
{
    "id": "string",
    "username": "string", 
    "email": "string",
    "chips": "number",
    "avatar_url": "string",
    "created_at": "datetime"
}
```

### Room Model
```python
{
    "id": "string",
    "name": "string",
    "max_players": "number",
    "current_players": "number",
    "small_blind": "number",
    "big_blind": "number", 
    "status": "waiting|playing|finished",
    "created_by": "string",
    "created_at": "datetime"
}
```

### Game Model
```python
{
    "id": "string",
    "room_id": "string",
    "players": [
        {
            "player_id": "string",
            "username": "string", 
            "chips": "number",
            "bet": "number",
            "cards": ["card1", "card2"],
            "position": "number",
            "status": "active|folded|all_in",
            "is_dealer": "boolean",
            "is_small_blind": "boolean",
            "is_big_blind": "boolean"
        }
    ],
    "community_cards": ["card1", "card2", "card3", "card4", "card5"],
    "pot": "number",
    "current_bet": "number",
    "current_player": "number",
    "phase": "preflop|flop|turn|river|showdown",
    "deck": ["remaining cards"],
    "created_at": "datetime"
}
```

### Card Model
```python
{
    "rank": "A|K|Q|J|10|9|8|7|6|5|4|3|2",
    "suit": "hearts|diamonds|clubs|spades"
}
```

## Mock Data Replacement Plan

### Current Mock Data (mockData.js)
1. **players** - Replace with real players from room
2. **communityCards** - Replace with game.community_cards
3. **chatMessages** - Replace with WebSocket chat system
4. **initialGameState** - Replace with actual game state from API

### Frontend Integration Changes

1. **PokerGame.jsx**
   - Remove mockData import
   - Add API calls for game state
   - Add WebSocket connection for real-time updates
   - Replace mock player actions with actual API calls

2. **Player Authentication**
   - Add login/register forms
   - Store JWT token for authenticated requests
   - Display current player info

3. **Room Management**
   - Add room list and creation UI
   - Join/leave room functionality
   - Display room status and player count

4. **Real-time Updates**
   - WebSocket connection for game state changes
   - Live chat functionality
   - Player actions broadcast to all players

## Backend Implementation Plan

### Phase 1: Basic Models and Auth
- User authentication with JWT
- Player registration/login
- Basic CRUD operations

### Phase 2: Game Logic
- Room creation and management
- Game state management
- Card dealing and hand evaluation
- Player action validation

### Phase 3: Real-time Features
- WebSocket connections
- Live game updates
- Chat system
- Player disconnection handling

### Phase 4: Advanced Features
- Tournament mode
- Spectator mode
- Game history and statistics
- Reconnection handling

## WebSocket Events

### Client → Server
- `join_room`: Join a game room
- `leave_room`: Leave current room
- `player_action`: Make game action (fold, call, raise)
- `chat_message`: Send chat message

### Server → Client
- `game_state_update`: Updated game state
- `player_joined`: New player joined
- `player_left`: Player left the room
- `chat_message`: New chat message
- `game_started`: Game has started
- `game_ended`: Game finished

## Error Handling
- Invalid player actions
- Insufficient chips
- Player disconnections
- Room capacity limits
- Authentication failures

## Testing Strategy
- Unit tests for game logic
- Integration tests for API endpoints
- WebSocket connection testing
- Frontend integration testing