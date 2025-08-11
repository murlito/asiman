import React from 'react';
import PlayingCardBack from './PlayingCardBack';
import './PokerTableSplit.css';

export default function PokerTableSplit({ players, dealerPosition }) {
  // 8 positions around an oval table for split layout
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
        className={`table-player-split ${player.position === 0 ? 'current-player-split' : ''}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Player Cards */}
        <div className="player-cards-split">
          <PlayingCardBack />
          <PlayingCardBack />
        </div>
        
        {/* Player Info */}
        <div className="player-info-split">
          <div className="player-name-split">{player.name}</div>
          <div className="player-chips-split">${player.chips}</div>
        </div>

        {/* Dealer Button */}
        {isDealer && (
          <div className="dealer-button-split">
            <div className="dealer-chip-split">D</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="poker-table-split-container">
      <div className="table-surface-split">
        <div className="table-felt-split">
          {/* Table center logo */}
          <div className="table-center-split">
            <div className="table-logo-split">POKER</div>
          </div>
          
          {/* All 8 players */}
          {players.map((player, index) => renderPlayer(player, index))}
        </div>
      </div>
    </div>
  );
}