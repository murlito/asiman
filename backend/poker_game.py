#!/usr/bin/env python3
"""
Texas Hold'em Poker Game Logic
Complete implementation of poker game mechanics
"""

import random
import uuid
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import json

class Suit(Enum):
    HEARTS = "hearts"
    DIAMONDS = "diamonds"
    CLUBS = "clubs"
    SPADES = "spades"

class Rank(Enum):
    TWO = "2"
    THREE = "3"
    FOUR = "4"
    FIVE = "5"
    SIX = "6"
    SEVEN = "7"
    EIGHT = "8"
    NINE = "9"
    TEN = "10"
    JACK = "J"
    QUEEN = "Q"
    KING = "K"
    ACE = "A"

class GameState(Enum):
    WAITING = "waiting"           # Waiting for players
    PRE_FLOP = "pre_flop"        # Before community cards
    FLOP = "flop"                # 3 community cards
    TURN = "turn"                # 4th community card
    RIVER = "river"              # 5th community card
    SHOWDOWN = "showdown"        # Reveal and compare hands
    FINISHED = "finished"        # Game over

class PlayerAction(Enum):
    FOLD = "fold"
    CHECK = "check"
    CALL = "call"
    RAISE = "raise"
    ALL_IN = "all_in"

class HandRanking(Enum):
    HIGH_CARD = 1
    PAIR = 2
    TWO_PAIR = 3
    THREE_OF_A_KIND = 4
    STRAIGHT = 5
    FLUSH = 6
    FULL_HOUSE = 7
    FOUR_OF_A_KIND = 8
    STRAIGHT_FLUSH = 9
    ROYAL_FLUSH = 10

@dataclass
class Card:
    rank: Rank
    suit: Suit
    
    def __str__(self):
        return f"{self.rank.value}{self.suit.value[0].upper()}"
    
    def to_dict(self):
        return {
            "rank": self.rank.value,
            "suit": self.suit.value,
            "name": f"{self.rank.value} of {self.suit.value.title()}",
            "color": "red" if self.suit in [Suit.HEARTS, Suit.DIAMONDS] else "black"
        }

@dataclass 
class Player:
    id: str
    name: str
    chips: int
    hole_cards: List[Card] = field(default_factory=list)
    current_bet: int = 0
    total_bet_this_round: int = 0
    is_folded: bool = False
    is_all_in: bool = False
    position: int = 0
    is_dealer: bool = False
    is_small_blind: bool = False
    is_big_blind: bool = False
    last_action: Optional[PlayerAction] = None
    
    def can_act(self) -> bool:
        return not self.is_folded and not self.is_all_in and self.chips > 0
    
    def to_dict(self, hide_hole_cards: bool = True):
        return {
            "id": self.id,
            "name": self.name,
            "chips": self.chips,
            "hole_cards": [] if hide_hole_cards else [card.to_dict() for card in self.hole_cards],
            "current_bet": self.current_bet,
            "total_bet_this_round": self.total_bet_this_round,
            "is_folded": self.is_folded,
            "is_all_in": self.is_all_in,
            "position": self.position,
            "is_dealer": self.is_dealer,
            "is_small_blind": self.is_small_blind,
            "is_big_blind": self.is_big_blind,
            "last_action": self.last_action.value if self.last_action else None,
            "can_act": self.can_act()
        }

@dataclass
class HandEvaluation:
    ranking: HandRanking
    cards: List[Card]
    description: str
    score: int  # For comparison

    def to_dict(self):
        return {
            "ranking": self.ranking.name,
            "ranking_value": self.ranking.value,
            "cards": [card.to_dict() for card in self.cards],
            "description": self.description,
            "score": self.score
        }

class Deck:
    def __init__(self):
        self.cards = []
        self.reset()
    
    def reset(self):
        """Create a new shuffled deck of 52 cards"""
        self.cards = []
        for suit in Suit:
            for rank in Rank:
                self.cards.append(Card(rank, suit))
        random.shuffle(self.cards)
    
    def deal_card(self) -> Optional[Card]:
        """Deal one card from the deck"""
        return self.cards.pop() if self.cards else None
    
    def cards_remaining(self) -> int:
        return len(self.cards)

class PokerGame:
    def __init__(self, game_id: str = None, small_blind: int = 10, big_blind: int = 20):
        self.game_id = game_id or str(uuid.uuid4())
        self.players: List[Player] = []
        self.deck = Deck()
        self.community_cards: List[Card] = []
        self.pot = 0
        self.current_bet = 0
        self.small_blind = small_blind
        self.big_blind = big_blind
        self.dealer_position = 0
        self.current_player_index = 0
        self.game_state = GameState.WAITING
        self.betting_round_complete = False
        self.created_at = datetime.utcnow()
        self.hand_number = 0
        
    def add_player(self, player_name: str, chips: int = 1000) -> str:
        """Add a new player to the game"""
        if len(self.players) >= 9:  # Max 9 players
            raise ValueError("Game is full (maximum 9 players)")
            
        player_id = str(uuid.uuid4())
        position = len(self.players)
        
        player = Player(
            id=player_id,
            name=player_name,
            chips=chips,
            position=position
        )
        
        self.players.append(player)
        
        # If this is the first player, they're the dealer
        if len(self.players) == 1:
            player.is_dealer = True
            self.dealer_position = 0
            
        return player_id
    
    def remove_player(self, player_id: str) -> bool:
        """Remove a player from the game"""
        player = self.get_player(player_id)
        if not player:
            return False
            
        # Return their chips to the pot if they're in the middle of a hand
        if player.current_bet > 0:
            self.pot += player.current_bet
            
        self.players = [p for p in self.players if p.id != player_id]
        
        # Reassign positions
        for i, p in enumerate(self.players):
            p.position = i
            
        return True
    
    def get_player(self, player_id: str) -> Optional[Player]:
        """Get player by ID"""
        return next((p for p in self.players if p.id == player_id), None)
    
    def can_start_game(self) -> bool:
        """Check if game can start (need at least 2 players)"""
        active_players = [p for p in self.players if p.chips > 0]
        return len(active_players) >= 2
    
    def start_new_hand(self):
        """Start a new hand"""
        if not self.can_start_game():
            raise ValueError("Need at least 2 players with chips to start")
            
        # Reset for new hand
        self.hand_number += 1
        self.deck.reset()
        self.community_cards = []
        self.pot = 0
        self.current_bet = 0
        self.betting_round_complete = False
        
        # Reset all players
        for player in self.players:
            player.hole_cards = []
            player.current_bet = 0
            player.total_bet_this_round = 0
            player.is_folded = False
            player.is_all_in = False
            player.last_action = None
            
        # Set blinds and dealer
        self._set_blinds_and_dealer()
        
        # Deal hole cards (2 cards to each player)
        self._deal_hole_cards()
        
        # Start pre-flop betting
        self.game_state = GameState.PRE_FLOP
        self._start_betting_round()
    
    def _set_blinds_and_dealer(self):
        """Set dealer, small blind, and big blind positions"""
        active_players = [p for p in self.players if p.chips > 0]
        if len(active_players) < 2:
            return
            
        # Reset all positions
        for player in self.players:
            player.is_dealer = False
            player.is_small_blind = False  
            player.is_big_blind = False
            
        # Move dealer position
        self.dealer_position = (self.dealer_position + 1) % len(active_players)
        
        # Set dealer
        active_players[self.dealer_position].is_dealer = True
        
        if len(active_players) == 2:
            # Heads up: dealer is small blind
            active_players[self.dealer_position].is_small_blind = True
            active_players[(self.dealer_position + 1) % 2].is_big_blind = True
        else:
            # Normal game: small blind is next to dealer
            sb_pos = (self.dealer_position + 1) % len(active_players)
            bb_pos = (self.dealer_position + 2) % len(active_players)
            
            active_players[sb_pos].is_small_blind = True
            active_players[bb_pos].is_big_blind = True
            
        # Collect blinds
        self._collect_blinds()
    
    def _collect_blinds(self):
        """Collect small and big blind bets"""
        for player in self.players:
            if player.is_small_blind and player.chips > 0:
                blind_amount = min(self.small_blind, player.chips)
                player.chips -= blind_amount
                player.current_bet = blind_amount
                player.total_bet_this_round = blind_amount
                self.pot += blind_amount
                
                if player.chips == 0:
                    player.is_all_in = True
                    
            elif player.is_big_blind and player.chips > 0:
                blind_amount = min(self.big_blind, player.chips)
                player.chips -= blind_amount
                player.current_bet = blind_amount
                player.total_bet_this_round = blind_amount
                self.pot += blind_amount
                self.current_bet = blind_amount
                
                if player.chips == 0:
                    player.is_all_in = True
    
    def _deal_hole_cards(self):
        """Deal 2 hole cards to each player"""
        active_players = [p for p in self.players if p.chips > 0]
        
        # Deal first card to each player
        for _ in range(2):
            for player in active_players:
                card = self.deck.deal_card()
                if card:
                    player.hole_cards.append(card)
    
    def _start_betting_round(self):
        """Start a new betting round"""
        active_players = [p for p in self.players if p.can_act()]
        
        if len(active_players) <= 1:
            self._end_hand()
            return
            
        # Find first player to act
        if self.game_state == GameState.PRE_FLOP:
            # Pre-flop: first to act is left of big blind
            bb_player = next((p for p in self.players if p.is_big_blind), None)
            if bb_player:
                bb_index = self.players.index(bb_player)
                self.current_player_index = (bb_index + 1) % len(self.players)
            else:
                self.current_player_index = 0
        else:
            # Post-flop: first to act is left of dealer
            dealer = next((p for p in self.players if p.is_dealer), None)
            if dealer:
                dealer_index = self.players.index(dealer)
                self.current_player_index = (dealer_index + 1) % len(self.players)
            else:
                self.current_player_index = 0
                
        # Find next player who can act
        while not self.players[self.current_player_index].can_act():
            self.current_player_index = (self.current_player_index + 1) % len(self.players)
            
        self.betting_round_complete = False
    
    def get_valid_actions(self, player_id: str) -> List[PlayerAction]:
        """Get valid actions for a player"""
        player = self.get_player(player_id)
        if not player or not player.can_act():
            return []
            
        actions = []
        
        # Can always fold
        actions.append(PlayerAction.FOLD)
        
        # Check if can check (no bet to call)
        if self.current_bet == player.current_bet:
            actions.append(PlayerAction.CHECK)
        else:
            # Need to call
            call_amount = self.current_bet - player.current_bet
            if player.chips >= call_amount:
                actions.append(PlayerAction.CALL)
                
        # Can raise if have chips
        if player.chips > (self.current_bet - player.current_bet):
            actions.append(PlayerAction.RAISE)
            
        # Can go all-in if not already
        if player.chips > 0:
            actions.append(PlayerAction.ALL_IN)
            
        return actions
    
    def make_action(self, player_id: str, action: PlayerAction, raise_amount: int = 0) -> bool:
        """Player makes an action"""
        player = self.get_player(player_id)
        if not player or not player.can_act():
            return False
            
        # Check if it's player's turn
        if self.players[self.current_player_index].id != player_id:
            return False
            
        valid_actions = self.get_valid_actions(player_id)
        if action not in valid_actions:
            return False
            
        # Execute action
        if action == PlayerAction.FOLD:
            player.is_folded = True
            player.last_action = action
            
        elif action == PlayerAction.CHECK:
            player.last_action = action
            
        elif action == PlayerAction.CALL:
            call_amount = min(self.current_bet - player.current_bet, player.chips)
            player.chips -= call_amount
            player.current_bet += call_amount
            player.total_bet_this_round += call_amount
            self.pot += call_amount
            player.last_action = action
            
            if player.chips == 0:
                player.is_all_in = True
                
        elif action == PlayerAction.RAISE:
            # Call current bet first
            call_amount = self.current_bet - player.current_bet
            total_needed = call_amount + raise_amount
            
            if player.chips >= total_needed:
                player.chips -= total_needed
                player.current_bet += total_needed
                player.total_bet_this_round += total_needed
                self.pot += total_needed
                self.current_bet = player.current_bet
                player.last_action = action
                
                if player.chips == 0:
                    player.is_all_in = True
            else:
                return False
                
        elif action == PlayerAction.ALL_IN:
            all_in_amount = player.chips
            player.chips = 0
            player.current_bet += all_in_amount
            player.total_bet_this_round += all_in_amount
            self.pot += all_in_amount
            player.is_all_in = True
            player.last_action = action
            
            # Update current bet if this all-in is higher
            if player.current_bet > self.current_bet:
                self.current_bet = player.current_bet
        
        # Move to next player
        self._next_player()
        
        return True
    
    def _next_player(self):
        """Move to the next player in turn"""
        players_who_can_act = [p for p in self.players if p.can_act()]
        
        if len(players_who_can_act) <= 1:
            self._end_betting_round()
            return
            
        # Check if betting round is complete
        if self._is_betting_round_complete():
            self._end_betting_round()
            return
            
        # Find next player who can act
        original_index = self.current_player_index
        while True:
            self.current_player_index = (self.current_player_index + 1) % len(self.players)
            
            if self.players[self.current_player_index].can_act():
                break
                
            # If we've gone full circle, betting round is done
            if self.current_player_index == original_index:
                self._end_betting_round()
                return
    
    def _is_betting_round_complete(self) -> bool:
        """Check if the current betting round is complete"""
        active_players = [p for p in self.players if not p.is_folded]
        players_who_can_act = [p for p in active_players if p.can_act()]
        
        # If only one active player, round is over
        if len(active_players) <= 1:
            return True
            
        # If no one can act, round is over
        if len(players_who_can_act) == 0:
            return True
            
        # Check if all active players have matched the current bet or are all-in
        for player in active_players:
            if not player.is_all_in and player.current_bet != self.current_bet:
                return False
                
        return True
    
    def _end_betting_round(self):
        """End the current betting round and move to next stage"""
        # Reset current bet for next round
        for player in self.players:
            player.current_bet = 0
            
        self.current_bet = 0
        
        # Move to next game state
        if self.game_state == GameState.PRE_FLOP:
            self._deal_flop()
        elif self.game_state == GameState.FLOP:
            self._deal_turn()
        elif self.game_state == GameState.TURN:
            self._deal_river()
        elif self.game_state == GameState.RIVER:
            self._showdown()
        else:
            self._end_hand()
    
    def _deal_flop(self):
        """Deal the flop (3 community cards)"""
        # Burn one card
        self.deck.deal_card()
        
        # Deal 3 community cards
        for _ in range(3):
            card = self.deck.deal_card()
            if card:
                self.community_cards.append(card)
                
        self.game_state = GameState.FLOP
        self._start_betting_round()
    
    def _deal_turn(self):
        """Deal the turn (4th community card)"""
        # Burn one card
        self.deck.deal_card()
        
        # Deal turn card
        card = self.deck.deal_card()
        if card:
            self.community_cards.append(card)
            
        self.game_state = GameState.TURN
        self._start_betting_round()
    
    def _deal_river(self):
        """Deal the river (5th community card)"""
        # Burn one card
        self.deck.deal_card()
        
        # Deal river card
        card = self.deck.deal_card()
        if card:
            self.community_cards.append(card)
            
        self.game_state = GameState.RIVER
        self._start_betting_round()
    
    def _showdown(self):
        """Evaluate hands and determine winner"""
        self.game_state = GameState.SHOWDOWN
        
        active_players = [p for p in self.players if not p.is_folded]
        
        if len(active_players) == 1:
            # Only one player left, they win
            winner = active_players[0]
            winner.chips += self.pot
            self.pot = 0
        else:
            # Evaluate all hands
            player_hands = []
            for player in active_players:
                hand_eval = self.evaluate_hand(player.hole_cards + self.community_cards)
                player_hands.append((player, hand_eval))
            
            # Sort by hand strength (highest first)
            player_hands.sort(key=lambda x: x[1].score, reverse=True)
            
            # Find winners (handle ties)
            best_score = player_hands[0][1].score
            winners = [ph for ph in player_hands if ph[1].score == best_score]
            
            # Split pot among winners
            pot_per_winner = self.pot // len(winners)
            remainder = self.pot % len(winners)
            
            for i, (winner, _) in enumerate(winners):
                winner.chips += pot_per_winner
                if i < remainder:  # Give remainder to first winners
                    winner.chips += 1
                    
            self.pot = 0
        
        self.game_state = GameState.FINISHED
    
    def _end_hand(self):
        """End the current hand"""
        self.game_state = GameState.FINISHED
        
        # Remove players with no chips
        self.players = [p for p in self.players if p.chips > 0]
    
    def evaluate_hand(self, cards: List[Card]) -> HandEvaluation:
        """Evaluate a 7-card hand (2 hole + 5 community)"""
        if len(cards) != 7:
            # Handle edge cases
            return HandEvaluation(HandRanking.HIGH_CARD, cards[:5], "High Card", 0)
            
        # Generate all possible 5-card combinations
        from itertools import combinations
        best_hand = None
        best_score = 0
        
        for combo in combinations(cards, 5):
            hand_eval = self._evaluate_5_card_hand(list(combo))
            if hand_eval.score > best_score:
                best_hand = hand_eval
                best_score = hand_eval.score
                
        return best_hand or HandEvaluation(HandRanking.HIGH_CARD, cards[:5], "High Card", 0)
    
    def _evaluate_5_card_hand(self, cards: List[Card]) -> HandEvaluation:
        """Evaluate exactly 5 cards"""
        # Sort cards by rank value for easier evaluation
        rank_values = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, 
                      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14}
        
        cards_sorted = sorted(cards, key=lambda c: rank_values[c.rank.value], reverse=True)
        ranks = [c.rank.value for c in cards_sorted]
        suits = [c.suit for c in cards_sorted]
        rank_counts = {}
        
        for rank in ranks:
            rank_counts[rank] = rank_counts.get(rank, 0) + 1
            
        # Check for flush
        is_flush = len(set(suits)) == 1
        
        # Check for straight
        rank_vals = [rank_values[r] for r in ranks]
        is_straight = False
        straight_high = 0
        
        # Check regular straight
        if rank_vals == list(range(max(rank_vals), max(rank_vals) - 5, -1)):
            is_straight = True
            straight_high = max(rank_vals)
        # Check wheel straight (A-2-3-4-5)
        elif rank_vals == [14, 5, 4, 3, 2]:
            is_straight = True
            straight_high = 5  # 5-high straight
            
        # Get rank counts for pairs, trips, etc.
        counts = sorted(rank_counts.values(), reverse=True)
        
        # Determine hand ranking
        if is_straight and is_flush:
            if ranks == ['A', 'K', 'Q', 'J', '10']:
                return HandEvaluation(HandRanking.ROYAL_FLUSH, cards_sorted, "Royal Flush", 900 + straight_high)
            else:
                return HandEvaluation(HandRanking.STRAIGHT_FLUSH, cards_sorted, f"Straight Flush ({ranks[0]} high)", 800 + straight_high)
        elif counts == [4, 1]:
            four_kind_rank = [r for r, c in rank_counts.items() if c == 4][0]
            return HandEvaluation(HandRanking.FOUR_OF_A_KIND, cards_sorted, f"Four of a Kind ({four_kind_rank}s)", 700 + rank_values[four_kind_rank])
        elif counts == [3, 2]:
            trips_rank = [r for r, c in rank_counts.items() if c == 3][0]
            return HandEvaluation(HandRanking.FULL_HOUSE, cards_sorted, f"Full House ({trips_rank}s full)", 600 + rank_values[trips_rank])
        elif is_flush:
            return HandEvaluation(HandRanking.FLUSH, cards_sorted, f"Flush ({ranks[0]} high)", 500 + rank_values[ranks[0]])
        elif is_straight:
            return HandEvaluation(HandRanking.STRAIGHT, cards_sorted, f"Straight ({ranks[0]} high)", 400 + straight_high)
        elif counts == [3, 1, 1]:
            trips_rank = [r for r, c in rank_counts.items() if c == 3][0]
            return HandEvaluation(HandRanking.THREE_OF_A_KIND, cards_sorted, f"Three of a Kind ({trips_rank}s)", 300 + rank_values[trips_rank])
        elif counts == [2, 2, 1]:
            pairs = sorted([r for r, c in rank_counts.items() if c == 2], key=lambda x: rank_values[x], reverse=True)
            return HandEvaluation(HandRanking.TWO_PAIR, cards_sorted, f"Two Pair ({pairs[0]}s and {pairs[1]}s)", 200 + rank_values[pairs[0]])
        elif counts == [2, 1, 1, 1]:
            pair_rank = [r for r, c in rank_counts.items() if c == 2][0]
            return HandEvaluation(HandRanking.PAIR, cards_sorted, f"Pair of {pair_rank}s", 100 + rank_values[pair_rank])
        else:
            return HandEvaluation(HandRanking.HIGH_CARD, cards_sorted, f"High Card ({ranks[0]})", rank_values[ranks[0]])
    
    def to_dict(self, player_id: str = None) -> Dict:
        """Convert game state to dictionary for JSON serialization"""
        return {
            "game_id": self.game_id,
            "game_state": self.game_state.value,
            "hand_number": self.hand_number,
            "pot": self.pot,
            "current_bet": self.current_bet,
            "small_blind": self.small_blind,
            "big_blind": self.big_blind,
            "community_cards": [card.to_dict() for card in self.community_cards],
            "players": [p.to_dict(hide_hole_cards=(p.id != player_id)) for p in self.players],
            "current_player_id": self.players[self.current_player_index].id if self.players else None,
            "valid_actions": self.get_valid_actions(player_id) if player_id else [],
            "created_at": self.created_at.isoformat(),
            "can_start": self.can_start_game()
        }