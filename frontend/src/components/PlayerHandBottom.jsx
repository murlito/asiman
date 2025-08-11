import React from 'react';
import PlayingCard from './PlayingCard';
import './PlayerHandBottom.css';

export default function PlayerHandBottom({ cards, chips }) {
  return (
    <div className="player-hand-bottom-exact">
      <div className="hand-cards-exact">
        {cards.map((card, index) => (
          <PlayingCard 
            key={index}
            card={card}
            faceDown={false}
            delay={index * 0.1}
          />
        ))}
      </div>
      
      <div className="chips-display-exact">
        <div className="chips-amount-exact">${chips}</div>
      </div>
    </div>
  );
}