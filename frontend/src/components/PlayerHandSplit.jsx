import React from 'react';
import PlayingCard from './PlayingCard';
import './PlayerHandSplit.css';

export default function PlayerHandSplit({ cards, chips }) {
  return (
    <div className="player-hand-split">
      <div className="hand-title">Your Hand</div>
      
      <div className="hand-cards-split">
        {cards.map((card, index) => (
          <PlayingCard 
            key={index}
            card={card}
            faceDown={false}
            delay={index * 0.1}
          />
        ))}
      </div>
      
      <div className="chips-info-split">
        <div className="chips-label">Your Chips</div>
        <div className="chips-amount-split">${chips}</div>
      </div>
      
      <div className="hand-strength">
        <div className="strength-label">Hand Strength</div>
        <div className="strength-value">High Card</div>
      </div>
    </div>
  );
}