import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { mockData } from '../utils/mockData';
import PokerTableSection from './PokerTableSection';
import UserCardsSection from './UserCardsSection';
import FlopCardsSection from './FlopCardsSection';
import './PokerGameNew.css';

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
    <div className="poker-game-new">
      {/* Top Section - Flop Cards */}
      <div className="flop-section">
        <FlopCardsSection 
          cards={communityCards}
          gameInfo={gameInfo}
        />
      </div>

      {/* Bottom Section - Table and User Cards */}
      <div className="bottom-sections">
        {/* Left - Poker Table */}
        <div className="table-section">
          <PokerTableSection 
            players={players}
            dealerPosition={0}
            onPlayerAction={handlePlayerAction}
            gameInfo={gameInfo}
          />
        </div>

        {/* Right - User Cards */}
        <div className="user-cards-section">
          <UserCardsSection 
            cards={currentPlayerHand}
            chips={currentPlayerChips}
          />
        </div>
      </div>
    </div>
  );
}