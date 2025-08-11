import React from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import PlayingCardSmall from './PlayingCardSmall';
import './PokerTable3D.css';

export default function PokerTable3D({ players, currentPlayer, dealerPosition }) {
  const getPlayerPosition = (index, totalPlayers) => {
    const angle = (index * 360) / totalPlayers;
    const radius = 180;
    const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
    
    return {
      x: x,
      y: y,
      angle: angle
    };
  };

  const renderPlayer = (player, index) => {
    const position = getPlayerPosition(index, players.length);
    const isCurrentPlayer = index === currentPlayer;
    const isDealer = index === dealerPosition;
    
    return (
      <div 
        key={player.id}
        className={`table-player-seat ${isCurrentPlayer ? 'active-player' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
      >
        {/* Player Cards */}
        <div className="player-table-cards">
          <PlayingCardSmall faceDown={true} />
          <PlayingCardSmall faceDown={true} />
        </div>
        
        {/* Player Info */}
        <div className="player-table-info">
          <div className="player-avatar-small">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {player.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="player-details-small">
            <div className="player-name-small">{player.name}</div>
            <div className="player-chips-small">${player.chips}</div>
          </div>
        </div>

        {/* Dealer Button */}
        {isDealer && (
          <div className="dealer-button">
            <div className="dealer-chip">D</div>
          </div>
        )}

        {/* Current Player Indicator */}
        {isCurrentPlayer && (
          <div className="current-player-indicator">
            <div className="player-glow"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="poker-table-3d-container">
      <div className="table-3d-surface">
        <div className="table-felt-3d">
          {/* Table Center */}
          <div className="table-center">
            <div className="table-logo">POKER</div>
          </div>
          
          {/* Players around the table */}
          <div className="players-ring">
            {players.map((player, index) => renderPlayer(player, index))}
          </div>
        </div>
      </div>
    </div>
  );
}