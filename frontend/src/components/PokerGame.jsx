import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { mockData } from '../utils/mockData';
import PokerTableExact from './PokerTableExact';
import PlayerHandBottom from './PlayerHandBottom';
import CommunityCardsTop from './CommunityCardsTop';
import './PokerGameExact.css';

export default function PokerGame() {
  const [players, setPlayers] = useState(mockData.players);
  const [currentPlayerHand, setCurrentPlayerHand] = useState(mockData.currentPlayerHand);
  const [communityCards, setCommunityCards] = useState([]);
  const [gameInfo, setGameInfo] = useState(mockData.gameInfo);
  const [currentPlayerChips, setCurrentPlayerChips] = useState(1000);
  const { toast } = useToast();

  useEffect(() => {
    // Auto deal flop after 3 seconds
    const timer = setTimeout(() => {
      if (communityCards.length === 0) {
        dealFlop();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [communityCards.length]);

  const dealFlop = () => {
    const flop = mockData.communityCards.slice(0, 3);
    setCommunityCards(flop);
    setGameInfo(prev => ({ ...prev, phase: 'flop' }));
    toast({
      title: "Flop dealt!",
      description: "Three community cards revealed"
    });
  };

  const handlePlayerAction = (action, amount = 0) => {
    switch (action) {
      case 'fold':
        toast({
          title: "You fold",
          description: "Hand folded"
        });
        break;
      case 'call':
        toast({
          title: "You call",
          description: `Called ${gameInfo.currentBet}`
        });
        setCurrentPlayerChips(prev => prev - gameInfo.currentBet);
        setGameInfo(prev => ({ ...prev, pot: prev.pot + gameInfo.currentBet }));
        break;
      case 'raise':
        toast({
          title: "You raise",
          description: `Raised by ${amount}`
        });
        const raiseAmount = gameInfo.currentBet + amount;
        setCurrentPlayerChips(prev => prev - raiseAmount);
        setGameInfo(prev => ({ 
          ...prev, 
          pot: prev.pot + raiseAmount,
          currentBet: raiseAmount 
        }));
        break;
    }
  };

  return (
    <div className="poker-game-exact">
      {/* Top Header */}
      <div className="game-header-exact">
        <div className="header-left">
          <div className="blinds-display">Blinds: {gameInfo.blinds.small}/{gameInfo.blinds.big}</div>
          <div className="pot-display">Pot: ${gameInfo.pot}</div>
        </div>
        <div className="header-right">
          <Button variant="destructive" size="sm">Leave</Button>
        </div>
      </div>

      {/* Community Cards */}
      <CommunityCardsTop 
        cards={communityCards}
        gamePhase={gameInfo.phase}
      />

      {/* Main Table Area */}
      <div className="table-container-exact">
        <PokerTableExact 
          players={players}
          dealerPosition={0}
        />
      </div>

      {/* Bottom Area */}
      <div className="bottom-section-exact">
        <div className="player-hand-section">
          <PlayerHandBottom 
            cards={currentPlayerHand}
            chips={currentPlayerChips}
          />
        </div>
        
        <div className="action-buttons-exact">
          <Button 
            variant="destructive" 
            size="lg"
            onClick={() => handlePlayerAction('fold')}
            className="action-btn-exact fold-exact"
          >
            Fold
          </Button>
          
          <Button 
            variant="default" 
            size="lg"
            onClick={() => handlePlayerAction('call')}
            className="action-btn-exact call-exact"
          >
            Call {gameInfo.currentBet}
          </Button>
          
          <Button 
            variant="default" 
            size="lg"
            onClick={() => handlePlayerAction('raise', 50)}
            className="action-btn-exact raise-exact"
          >
            Raise
          </Button>
        </div>
      </div>
    </div>
  );
}