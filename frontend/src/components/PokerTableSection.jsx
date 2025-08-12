import React from 'react';
import { Button } from './ui/button';
import PlayingCardBack from './PlayingCardBack';
import './PokerTableSection.css';

export default function PokerTableSection({ players, dealerPosition, onPlayerAction, gameInfo }) {
  // 8 positions around the table
  const getPlayerPosition = (position) => {
    const positions = [
      { x: 50, y: 85, label: 'bottom-center' },     // Player 1
      { x: 15, y: 75, label: 'bottom-left' },       // Player 2  
      { x: 5, y: 50, label: 'left' },               // Player 3
      { x: 15, y: 25, label: 'top-left' },          // Player 4
      { x: 35, y: 10, label: 'top-center-left' },   // Player 5
      { x: 65, y: 10, label: 'top-center-right' },  // Player 6
      { x: 95, y: 50, label: 'right' },             // Player 7
      { x: 85, y: 75, label: 'bottom-right' }       // Player 8
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
      
      {/* Action Buttons */}
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
  );
}