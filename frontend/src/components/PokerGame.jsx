import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Slider } from './ui/slider';
import { useToast } from '../hooks/use-toast';
import { mockData } from '../utils/mockData';
import PokerTable from './PokerTable';
import PlayerControls from './PlayerControls';
import GameChat from './GameChat';
import './PokerGame.css';

export default function PokerGame() {
  const [gameState, setGameState] = useState(mockData.initialGameState);
  const [players, setPlayers] = useState(mockData.players);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [communityCards, setCommunityCards] = useState([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [gamePhase, setGamePhase] = useState('preflop'); // preflop, flop, turn, river, showdown
  const [chatMessages, setChatMessages] = useState(mockData.chatMessages);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate game progression
    const timer = setTimeout(() => {
      if (gamePhase === 'preflop' && communityCards.length === 0) {
        dealFlop();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [gamePhase, communityCards.length]);

  const dealFlop = () => {
    const flop = mockData.communityCards.slice(0, 3);
    setCommunityCards(flop);
    setGamePhase('flop');
    toast({
      title: "Flop dealt!",
      description: "Three community cards revealed"
    });
  };

  const dealTurn = () => {
    const turn = mockData.communityCards.slice(0, 4);
    setCommunityCards(turn);
    setGamePhase('turn');
    toast({
      title: "Turn card dealt!",
      description: "Fourth community card revealed"
    });
  };

  const dealRiver = () => {
    setCommunityCards(mockData.communityCards);
    setGamePhase('river');
    toast({
      title: "River card dealt!",
      description: "Final community card revealed"
    });
  };

  const handlePlayerAction = (action, amount = 0) => {
    const player = players[currentPlayer];
    
    switch (action) {
      case 'fold':
        toast({
          title: `${player.name} folds`,
          description: "Player has folded their hand"
        });
        break;
      case 'call':
        toast({
          title: `${player.name} calls`,
          description: `Called ${currentBet} chips`
        });
        setPot(prev => prev + currentBet);
        break;
      case 'raise':
        toast({
          title: `${player.name} raises`,
          description: `Raised to ${amount} chips`
        });
        setCurrentBet(amount);
        setPot(prev => prev + amount);
        break;
      case 'check':
        toast({
          title: `${player.name} checks`,
          description: "Player checks"
        });
        break;
      case 'allin':
        toast({
          title: `${player.name} goes ALL IN!`,
          description: `${player.chips} chips in the pot`
        });
        setPot(prev => prev + player.chips);
        break;
    }

    // Move to next player
    setCurrentPlayer(prev => (prev + 1) % players.length);
  };

  const addChatMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      player: players[currentPlayer].name,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="poker-game-container">
      <div className="game-header">
        <div className="game-info">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Texas Hold'em - {gamePhase.toUpperCase()}
          </Badge>
          <div className="pot-info">
            <span className="pot-label">Pot:</span>
            <span className="pot-amount">${pot.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="game-layout">
        <div className="game-area">
          <PokerTable 
            players={players}
            communityCards={communityCards}
            currentPlayer={currentPlayer}
            pot={pot}
            gamePhase={gamePhase}
          />
          
          <PlayerControls
            currentPlayer={players[currentPlayer]}
            currentBet={currentBet}
            onPlayerAction={handlePlayerAction}
            gamePhase={gamePhase}
          />
        </div>

        <div className="sidebar">
          <GameChat 
            messages={chatMessages}
            onSendMessage={addChatMessage}
            currentPlayer={players[currentPlayer].name}
          />
          
          <div className="game-controls mt-4">
            <Button 
              onClick={dealTurn} 
              disabled={gamePhase !== 'flop'}
              className="w-full mb-2"
            >
              Deal Turn
            </Button>
            <Button 
              onClick={dealRiver} 
              disabled={gamePhase !== 'turn'}
              className="w-full"
            >
              Deal River
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}