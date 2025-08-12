import React from 'react';
import { Button } from './ui/button';
import PlayingCardBack from './PlayingCardBack';
import PlayingCard from './PlayingCard';
import './PokerTableSection.css';

export default function PokerTableSection({ players, dealerPosition, onPlayerAction, gameInfo, userCards, userChips }) {
  // 8 positions around the table - proportionally distributed
  const getPlayerPosition = (position) => {
    // More proportional positioning around oval table
    // Using ellipse formula for better distribution
    const positions = [
      { x: 50, y: 85, label: 'bottom-center' },     // Player 1 - Main player
      { x: 18, y: 78, label: 'bottom-left' },       // Player 2  
      { x: 8, y: 55, label: 'left' },               // Player 3
      { x: 18, y: 32, label: 'top-left' },          // Player 4
      { x: 38, y: 15, label: 'top-center-left' },   // Player 5
      { x: 62, y: 15, label: 'top-center-right' },  // Player 6
      { x: 82, y: 32, label: 'top-right' },         // Player 7
      { x: 92, y: 55, label: 'right' },             // Player 8
      { x: 82, y: 78, label: 'bottom-right' }       // Player 9 (if needed)
    ];
    
    return positions[position] || positions[0];
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