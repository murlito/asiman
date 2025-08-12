import React from 'react';
import { Button } from './ui/button';
import PlayingCardBack from './PlayingCardBack';
import PlayingCard from './PlayingCard';
import './PokerTableSection.css';

export default function PokerTableSection({ players, dealerPosition, onPlayerAction, gameInfo, userCards, userChips, newCardIndex }) {
  // 9 positions around the table - positioned OUTSIDE the table boundaries
  const getPlayerPosition = (position) => {
    // Players positioned outside/around the poker table, not on the edge
    // Larger ellipse to place players behind the table
    const centerX = 50;
    const centerY = 50; 
    const radiusX = 48; // Increased horizontal radius to place players outside table
    const radiusY = 42; // Increased vertical radius to place players outside table
    
    // Calculate angle for each position (9 positions = 40° apart)
    // Start from bottom (270°) and go clockwise
    const angles = [
      270, // Player 1 - Bottom center (main player)
      230, // Player 2 - Bottom left  
      190, // Player 3 - Left bottom
      150, // Player 4 - Left top
      110, // Player 5 - Top left
      70,  // Player 6 - Top right
      30,  // Player 7 - Right top  
      350, // Player 8 - Right bottom
      310  // Player 9 - Bottom right
    ];
    
    const angle = angles[position] || angles[0];
    const radians = (angle * Math.PI) / 180;
    
    const x = centerX + radiusX * Math.cos(radians);
    const y = centerY + radiusY * Math.sin(radians);
    
    return { 
      x: Math.round(x), 
      y: Math.round(y), 
      label: `position-${position}` 
    };
  };

  const renderPlayer = (player, index) => {
    const position = getPlayerPosition(player.position);
    const isDealer = index === dealerPosition;
    
    return (
      <div 
        key={player.id}
        className={`table-player-new ${player.position === 0 ? 'current-player-new' : ''}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Player Cards */}
        <div className="player-cards-new">
          <PlayingCardBack />
          <PlayingCardBack />
        </div>
        
        {/* Player Info */}
        <div className="player-info-new">
          <div className="player-name-new">{player.name}</div>
          <div className="player-chips-new">${player.chips}</div>
        </div>

        {/* Dealer Button */}
        {isDealer && (
          <div className="dealer-button-new">
            <div className="dealer-chip-new">D</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="poker-table-section-container">
      <div className="table-and-cards-container">
        <div className="table-area-with-buttons">
          <div className="table-area-new">
            <div className="table-surface-new">
              <div className="table-felt-new">
                {/* Table center logo */}
                <div className="table-center-new">
                  <div className="table-logo-new">POKER</div>
                </div>
                
                {/* All 8 players */}
                {players.map((player, index) => renderPlayer(player, index))}
              </div>
            </div>
          </div>
          
          {/* Action Buttons under table */}
          <div className="table-actions">
            <Button 
              variant="destructive" 
              size="lg"
              onClick={() => onPlayerAction('fold')}
              className="action-btn-new fold-btn-new"
            >
              FOLD
            </Button>
            
            <Button 
              variant="default" 
              size="lg"
              onClick={() => onPlayerAction('raise', 50)}
              className="action-btn-new raise-btn-new"
            >
              RAISE
            </Button>
          </div>
        </div>
        
        {/* User Cards next to table */}
        <div className="user-cards-next-to-table">
          <div className="user-hand-cards-table">
            {/* Chips info moved to the top */}
            <div className="chips-info-table">
              <div className="chips-label-table">Your Stack:</div>
              <div className="chips-amount-table">${userChips}</div>
            </div>
            
            {/* User cards below */}
            <div className="hand-cards-container">
              {userCards && userCards.map((card, index) => (
                <div key={`${card.rank}-${card.suit}-${index}`} className={`user-card-hover-container ${index === newCardIndex ? 'new-scanned-card' : ''}`}>
                  <PlayingCard 
                    card={card}
                    faceDown={true}
                    delay={index * 0.1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}