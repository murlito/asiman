import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { mockData } from '../utils/mockData';
import PokerTableSplit from './PokerTableSplit';
import PlayerHandSplit from './PlayerHandSplit';
import CommunityCardsSplit from './CommunityCardsSplit';
import './PokerGameSplit.css';

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
    <div className="poker-game-split">
      {/* Top Section - Community Cards */}
      <div className="top-section-split">
        <div className="game-header-split">
          <div className="blinds-pot-info">
            <span className="blinds-info">Blinds: {gameInfo.blinds.small}/{gameInfo.blinds.big}</span>
            <span className="pot-info">Pot: ${gameInfo.pot}</span>
          </div>
          <Button variant="destructive" size="sm">Leave</Button>
        </div>
        
        <CommunityCardsSplit 
          cards={communityCards}
          gamePhase={gameInfo.phase}
        />
      </div>

      {/* Bottom Section - Split into Table (left) and Player Hand (right) */}
      <div className="bottom-section-split">
        {/* Left Side - Poker Table */}
        <div className="table-section-split">
          <PokerTableSplit 
            players={players}
            dealerPosition={0}
          />
        </div>

        {/* Right Side - Player Hand and Actions */}
        <div className="player-section-split">
          <PlayerHandSplit 
            cards={currentPlayerHand}
            chips={currentPlayerChips}
          />
          
          <div className="action-buttons-split">
            <Button 
              variant="destructive" 
              size="lg"
              onClick={() => handlePlayerAction('fold')}
              className="action-btn-split fold-split"
            >
              Fold
            </Button>
            
            <Button 
              variant="default" 
              size="lg"
              onClick={() => handlePlayerAction('call')}
              className="action-btn-split call-split"
            >
              Call {gameInfo.currentBet}
            </Button>
            
            <Button 
              variant="default" 
              size="lg"
              onClick={() => handlePlayerAction('raise', 50)}
              className="action-btn-split raise-split"
            >
              Raise
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}