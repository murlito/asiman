import React from 'react';
import PlayingCardBack from './PlayingCardBack';
import './PokerTableExact.css';

export default function PokerTableExact({ players, dealerPosition }) {
  // 8 positions around the table - exact positioning like in image
  const getPlayerPosition = (position) => {
    const positions = [
      { x: 50, y: 85, label: 'bottom-center' },     // Player 1 (bottom center)
      { x: 15, y: 75, label: 'bottom-left' },       // Player 2 (bottom left)  
      { x: 5, y: 50, label: 'left' },               // Player 3 (left side)
      { x: 15, y: 25, label: 'top-left' },          // Player 4 (top left)
      { x: 35, y: 15, label: 'top-center-left' },   // Player 5 (top center-left)
      { x: 65, y: 15, label: 'top-center-right' },  // Player 6 (top center-right)
      { x: 95, y: 50, label: 'right' },             // Player 7 (right side)
      { x: 85, y: 75, label: 'bottom-right' }       // Player 8 (bottom right)
    ];
    
    return positions[position] || positions[0];
  };

  const renderPlayer = (player, index) => {
    const position = getPlayerPosition(player.position);
    const isDealer = index === dealerPosition;
    
    return (
      <div 
        key={player.id}
        className={`table-player-exact ${player.position === 0 ? 'current-player-exact' : ''}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Player Cards */}
        <div className="player-cards-exact">
          <PlayingCardBack />
          <PlayingCardBack />
        </div>
        
        {/* Player Info Box */}
        <div className="player-info-box-exact">
          <div className="player-name-exact">{player.name}</div>
          <div className="player-chips-exact">${player.chips}</div>
        </div>

        {/* Dealer Button */}
        {isDealer && (
          <div className="dealer-button-exact">
            <div className="dealer-chip-exact">DEALER</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="poker-table-exact-container">
      <div className="table-surface-exact">
        <div className="table-felt-exact">
          {/* Table center */}
          <div className="table-center-exact">
            <div className="table-logo-exact">POKER</div>
          </div>
          
          {/* All 8 players */}
          {players.map((player, index) => renderPlayer(player, index))}
        </div>
      </div>
    </div>
  );
}