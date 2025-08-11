import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import PlayingCard from './PlayingCard';
import './PokerTable.css';

export default function PokerTable({ players, communityCards, currentPlayer, pot, gamePhase }) {
  const renderPlayer = (player, index) => {
    const isCurrentPlayer = index === currentPlayer;
    const position = getPlayerPosition(index, players.length);
    
    return (
      <div 
        key={player.id}
        className={`player-seat ${isCurrentPlayer ? 'current-player' : ''} ${player.folded ? 'folded' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) rotateY(${position.rotation}deg)`
        }}
      >
        <div className="player-info">
          <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
            <AvatarImage src={player.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
              {player.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="player-details">
            <div className="player-name">{player.name}</div>
            <div className="player-chips">${player.chips.toLocaleString()}</div>
            {player.bet > 0 && (
              <Badge className="bet-amount bg-amber-500">
                Bet: ${player.bet}
              </Badge>
            )}
          </div>
        </div>

        <div className="player-cards">
          {player.cards.map((card, cardIndex) => (
            <PlayingCard 
              key={cardIndex}
              card={card}
              faceDown={!player.showCards}
              delay={cardIndex * 0.2}
            />
          ))}
        </div>

        {isCurrentPlayer && (
          <div className="player-indicator">
            <div className="pulse-ring"></div>
          </div>
        )}
      </div>
    );
  };

  const getPlayerPosition = (index, totalPlayers) => {
    const angle = (index * 360) / totalPlayers;
    const radius = 200; // Reduced radius for better visibility
    const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
    
    return {
      x: `calc(50% + ${x}px)`,
      y: `calc(50% + ${y}px)`,
      rotation: 0 // Removed rotation for better readability
    };
  };

  return (
    <div className="poker-table-container">
      <div className="table-3d">
        <div className="table-surface">
          <div className="table-felt">
            {/* Community Cards Area */}
            <div className="community-cards-area">
              <div className="community-label">Community Cards</div>
              <div className="community-cards">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="community-card-slot">
                    {communityCards[index] ? (
                      <PlayingCard 
                        card={communityCards[index]}
                        faceDown={false}
                        delay={index * 0.3}
                      />
                    ) : (
                      <div className="empty-card-slot"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pot Area */}
            <div className="pot-area">
              <div className="pot-chips">
                <div className="chip-stack">
                  {Array.from({ length: Math.min(10, Math.floor(pot / 100)) }).map((_, i) => (
                    <div 
                      key={i} 
                      className="poker-chip"
                      style={{ 
                        transform: `translateY(-${i * 4}px) rotateX(${5 + i * 2}deg)`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Players around the table */}
            <div className="players-container">
              {players.map((player, index) => renderPlayer(player, index))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}