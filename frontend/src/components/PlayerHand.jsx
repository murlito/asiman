import React from 'react';
import PlayingCard from './PlayingCard';
import './PlayerHand.css';

export default function PlayerHand({ player, chips }) {
  return (
    <div className="player-hand-display">
      <div className="hand-cards">
        {player.cards.map((card, index) => (
          <PlayingCard 
            key={index}
            card={card}
            faceDown={false}
            delay={index * 0.1}
          />
        ))}
      </div>
      
      <div className="player-chips-display">
        <div className="chips-amount">${chips}</div>
        <div className="chips-stack">
          {Array.from({ length: Math.min(8, Math.floor(chips / 100)) }).map((_, i) => (
            <div 
              key={i} 
              className="chip-piece"
              style={{ 
                transform: `translateY(-${i * 3}px)`,
                zIndex: 10 - i
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}