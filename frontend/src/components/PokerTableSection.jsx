import React from 'react';
import { Button } from './ui/button';
import PlayingCardBack from './PlayingCardBack';
import PlayingCard from './PlayingCard';
import './PokerTableSection.css';

export default function PokerTableSection({ players, dealerPosition, onPlayerAction, gameInfo, userCards, userChips }) {
  // 8 positions around the table - mathematically proportional
  const getPlayerPosition = (position) => {
    // Perfect elliptical distribution around the table
    // Center of table at (50, 50), ellipse radii: horizontal=42, vertical=35
    const centerX = 50;
    const centerY = 50; 
    const radiusX = 42; // Horizontal radius
    const radiusY = 35; // Vertical radius
    
    // Calculate angle for each position (8 positions = 45° apart)
    // Start from bottom (270°) and go clockwise
    const angles = [
      270, // Player 1 - Bottom center (main player)
      225, // Player 2 - Bottom left  
      180, // Player 3 - Left
      135, // Player 4 - Top left
      90,  // Player 5 - Top center left
      45,  // Player 6 - Top center right  
      0,   // Player 7 - Top right
      315  // Player 8 - Right
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
                <div key={index} className="user-card-hover-container">
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