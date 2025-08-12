#!/usr/bin/env python3
"""
Poker Game Manager
Handles multiple poker games and player sessions
"""

from typing import Dict, Optional, List
from poker_game import PokerGame, PlayerAction
import threading
import time

class GameManager:
    def __init__(self):
        self.games: Dict[str, PokerGame] = {}
        self.player_sessions: Dict[str, str] = {}  # player_id -> game_id
        self.lock = threading.Lock()
    
    def create_game(self, small_blind: int = 10, big_blind: int = 20) -> str:
        """Create a new poker game"""
        with self.lock:
            game = PokerGame(small_blind=small_blind, big_blind=big_blind)
            self.games[game.game_id] = game
            return game.game_id
    
    def join_game(self, game_id: str, player_name: str, chips: int = 1000) -> Optional[str]:
        """Join a player to a game"""
        with self.lock:
            game = self.games.get(game_id)
            if not game:
                return None
                
            try:
                player_id = game.add_player(player_name, chips)
                self.player_sessions[player_id] = game_id
                return player_id
            except ValueError:
                return None
    
    def leave_game(self, player_id: str) -> bool:
        """Remove player from their current game"""
        with self.lock:
            game_id = self.player_sessions.get(player_id)
            if not game_id:
                return False
                
            game = self.games.get(game_id)
            if not game:
                return False
                
            success = game.remove_player(player_id)
            if success:
                del self.player_sessions[player_id]
                
                # Remove empty games
                if len(game.players) == 0:
                    del self.games[game_id]
                    
            return success
    
    def get_game(self, game_id: str) -> Optional[PokerGame]:
        """Get game by ID"""
        return self.games.get(game_id)
    
    def get_player_game(self, player_id: str) -> Optional[PokerGame]:
        """Get the game a player is in"""
        game_id = self.player_sessions.get(player_id)
        if game_id:
            return self.games.get(game_id)
        return None
    
    def start_game(self, game_id: str) -> bool:
        """Start a poker game"""
        with self.lock:
            game = self.games.get(game_id)
            if not game or not game.can_start_game():
                return False
                
            try:
                game.start_new_hand()
                return True
            except ValueError:
                return False
    
    def make_action(self, player_id: str, action: str, raise_amount: int = 0) -> bool:
        """Player makes an action in their game"""
        with self.lock:
            game = self.get_player_game(player_id)
            if not game:
                return False
                
            try:
                action_enum = PlayerAction(action)
                return game.make_action(player_id, action_enum, raise_amount)
            except (ValueError, KeyError):
                return False
    
    def get_game_state(self, player_id: str) -> Optional[Dict]:
        """Get game state for a player"""
        game = self.get_player_game(player_id)
        if game:
            return game.to_dict(player_id)
        return None
    
    def list_games(self) -> List[Dict]:
        """List all active games"""
        games_info = []
        for game_id, game in self.games.items():
            games_info.append({
                "game_id": game_id,
                "player_count": len(game.players),
                "state": game.game_state.value,
                "pot": game.pot,
                "can_join": len(game.players) < 9,
                "hand_number": game.hand_number
            })
        return games_info
    
    def cleanup_empty_games(self):
        """Remove games with no players"""
        with self.lock:
            empty_games = [gid for gid, game in self.games.items() if len(game.players) == 0]
            for game_id in empty_games:
                del self.games[game_id]

# Global game manager instance
game_manager = GameManager()

def get_game_manager() -> GameManager:
    return game_manager