import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { mockData } from '../utils/mockData';
import PokerTable3D from './PokerTable3D';
import PlayerHand from './PlayerHand';
import CommunityCardsTop from './CommunityCardsTop';
import './PokerGame.css';

export default function PokerGame() {
  const [gameState, setGameState] = useState(mockData.initialGameState);
  const [players, setPlayers] = useState(mockData.players);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [communityCards, setCommunityCards] = useState([]);
  const [pot, setPot] = useState(1500);
  const [currentBet, setCurrentBet] = useState(20);
  const [gamePhase, setGamePhase] = useState('preflop');
  const [blinds, setBlinds] = useState({ small: 10, big: 20 });
  const { toast } = useToast();

  useEffect(() => {
    // Simulate game progression
    const timer = setTimeout(() => {
      if (gamePhase === 'preflop' && communityCards.length === 0) {
        dealFlop();
      }
    }, 5000);

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

  return (
    <div className="poker-game-3d">
      {/* Game Info Header */}
      <div className="game-header-3d">
        <div className="blinds-info">
          <div className="blind-item">Blinds: {blinds.small}/{blinds.big}</div>
        </div>
        <div className="pot-info-3d">
          <div className="pot-amount">Pot: ${pot}</div>
        </div>
        <div className="leave-button">
          <Button variant="destructive" size="sm">Leave</Button>
        </div>
      </div>

      {/* Community Cards at Top */}
      <CommunityCardsTop 
        cards={communityCards}
        gamePhase={gamePhase}
      />

      {/* Main 3D Poker Table */}
      <div className="table-area-3d">
        <PokerTable3D 
          players={players}
          currentPlayer={currentPlayer}
          dealerPosition={0}
        />
      </div>

      {/* Player Hand and Controls at Bottom */}
      <div className="bottom-area">
        <div className="player-hand-area">
          <PlayerHand 
            player={players[currentPlayer]}
            chips={players[currentPlayer].chips}
          />
        </div>
        
        <div className="action-controls-3d">
          <Button 
            variant="destructive" 
            size="lg"
            onClick={() => handlePlayerAction('fold')}
            className="action-btn fold-btn-3d"
          >
            Fold
          </Button>
          
          <Button 
            variant="default" 
            size="lg"
            onClick={() => handlePlayerAction('call')}
            className="action-btn call-btn-3d"
          >
            Call {currentBet}
          </Button>
          
          <Button 
            variant="default" 
            size="lg"
            onClick={() => handlePlayerAction('raise', currentBet + 50)}
            className="action-btn raise-btn-3d"
          >
            Raise
          </Button>
        </div>
      </div>
    </div>
  );
}